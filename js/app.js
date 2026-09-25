/**
 * Keyshape UI — hash-routed views, generator controls, validator, entropy table,
 * PWA install + service worker registration. All computation in js/core/*.
 */

import { PROVIDERS, getProvider, CATEGORIES, shapeSummary } from './core/providers.js';
import { generateBatch, formatOutput } from './core/generate.js';
import {
  providerBits,
  providerLog10KeySpace,
  log10ExpectedYears,
  fmtLog10Html,
  fmtBits,
  AGE_OF_UNIVERSE_YEARS,
} from './core/entropy.js';
import { scan } from './core/validate.js';
import { CHARSETS } from './core/charset.js';

const $ = (id) => document.getElementById(id);

/* ── tiny toast ─────────────────────────────────────────────────────────── */
let toastTimer;
function toast(message) {
  const el = $('toast');
  el.textContent = message;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 2600);
}

/* ── router ────────────────────────────────────────────────────────────── */
const VIEWS = ['generate', 'validate', 'entropy', 'install'];
function showView() {
  const name = (location.hash || '#generate').slice(1);
  const active = VIEWS.includes(name) ? name : 'generate';
  for (const v of VIEWS) {
    $(`view-${v}`).hidden = v !== active;
  }
  for (const a of document.querySelectorAll('.nav a')) {
    if (a.dataset.view === active) a.setAttribute('aria-current', 'page');
    else a.removeAttribute('aria-current');
  }
}
window.addEventListener('hashchange', showView);

/* ── generator state ───────────────────────────────────────────────────── */
const genOpts = { lengths: {}, prefixIndex: {} };
let lastRows = [];
let lastProvider = null;
let lastText = '';

function selectedProvider() {
  return getProvider($('gen-provider').value) || PROVIDERS[0];
}

function adjustableTokens(provider) {
  const tokens = [];
  for (const cred of provider.credentials) {
    for (const t of cred.template) {
      if (typeof t !== 'string' && t.adjustable) tokens.push(t);
    }
  }
  return tokens;
}

function prefixedTokens(provider) {
  const tokens = [];
  for (const cred of provider.credentials) {
    for (const t of cred.template) {
      if (typeof t !== 'string' && t.prefixOptions) tokens.push(t);
    }
  }
  return tokens;
}

function configureGenerator() {
  const provider = selectedProvider();
  genOpts.lengths = {};
  genOpts.prefixIndex = {};

  // prefix / key-type selector
  const prefTokens = prefixedTokens(provider);
  const wrap = $('gen-prefix-wrap');
  const sel = $('gen-prefix');
  sel.innerHTML = '';
  if (prefTokens.length > 0) {
    const token = prefTokens[0];
    $('gen-prefix-label').textContent =
      prefTokens.length === 1 ? `${token.label} type` : `${token.label} type (first segment)`;
    token.prefixOptions.forEach((p, i) => {
      const opt = document.createElement('option');
      opt.value = String(i);
      opt.textContent = p === '' ? '(no prefix)' : p;
      sel.appendChild(opt);
    });
    genOpts.prefixIndex[token.label] = 0;
    sel.onchange = () => {
      genOpts.prefixIndex[token.label] = Number(sel.value);
    };
    wrap.hidden = false;
  } else {
    wrap.hidden = true;
  }

  // adjustable length inputs
  const lenWrap = $('gen-lengths-wrap');
  const lenRow = $('gen-lengths');
  lenRow.innerHTML = '';
  const adjTokens = adjustableTokens(provider);
  if (adjTokens.length > 0) {
    for (const token of adjTokens) {
      const label = document.createElement('label');
      const name = document.createElement('span');
      name.textContent = token.label;
      const input = document.createElement('input');
      input.type = 'number';
      input.min = '1';
      input.max = '256';
      input.value = String(token.length);
      input.dataset.tokenLabel = token.label;
      input.addEventListener('change', () => {
        const v = Math.min(256, Math.max(1, Number(input.value) || token.length));
        input.value = String(v);
        genOpts.lengths[token.label] = v;
      });
      label.append(name, input);
      lenRow.appendChild(label);
      genOpts.lengths[token.label] = token.length;
    }
    lenWrap.hidden = false;
  } else {
    lenWrap.hidden = true;
  }

  $('gen-note').textContent = provider.note || '';
  const customWrap = $('custom-wrap');
  if (customWrap) customWrap.hidden = provider.id !== '__custom__';
}

function runGenerate() {
  const provider = selectedProvider();
  const qtyEl = $('gen-qty');
  const count = Math.min(10000, Math.max(1, Math.floor(Number(qtyEl.value) || 1)));
  qtyEl.value = String(count);
  const format = $('gen-format').value;
  try {
    lastRows = generateBatch(provider, count, genOpts);
    lastProvider = provider;
    lastText = formatOutput(provider, lastRows, format);
    $('gen-output').textContent = lastText;
    const unit = provider.compound ? 'credential sets' : 'keys';
    $('gen-meta').textContent = `${lastRows.length} ${unit} · ${provider.name} · ${format.toUpperCase()} · synthetic`;
  } catch (err) {
    toast(`Generation failed: ${err.message}`);
  }
}

async function copyOutput() {
  if (!lastText) {
    toast('Nothing to copy yet — press Generate first.');
    return;
  }
  try {
    await navigator.clipboard.writeText(lastText);
    toast('Copied to clipboard.');
  } catch {
    // Fallback for older browsers / non-secure contexts
    const pre = $('gen-output');
    const range = document.createRange();
    range.selectNodeContents(pre);
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
    document.execCommand('copy');
    sel.removeAllRanges();
    toast('Copied to clipboard.');
  }
}

function downloadOutput() {
  if (!lastText || !lastProvider) {
    toast('Nothing to download yet — press Generate first.');
    return;
  }
  const format = $('gen-format').value;
  const blob = new Blob([lastText], {
    type: format === 'json' ? 'application/json' : 'text/plain;charset=utf-8',
  });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `keyshape-${lastProvider.id}-fixtures.${format}`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  toast('Download started.');
}

/* ── catalog table ─────────────────────────────────────────────────────── */
function renderCatalog() {
  const q = $('cat-search').value.trim().toLowerCase();
  const cat = $('cat-filter').value;
  const body = $('catalog-body');
  body.innerHTML = '';
  let shown = 0;
  for (const p of PROVIDERS) {
    if (cat && p.category !== cat) continue;
    const hay = `${p.name} ${p.id} ${p.category} ${shapeSummary(p)}`.toLowerCase();
    if (q && !hay.includes(q)) continue;
    shown++;
    const tr = document.createElement('tr');

    const tdName = document.createElement('td');
    const strong = document.createElement('strong');
    strong.textContent = p.name;
    const sub = document.createElement('div');
    sub.className = 'muted';
    sub.textContent = p.compound ? 'multi-part credential' : 'single key';
    tdName.append(strong, sub);

    const tdCat = document.createElement('td');
    tdCat.className = 'col-cat';
    tdCat.textContent = p.category;

    const tdShape = document.createElement('td');
    tdShape.className = 'shape';
    tdShape.textContent = shapeSummary(p);

    const tdBits = document.createElement('td');
    tdBits.className = 'num';
    tdBits.textContent = fmtBits(providerBits(p));

    const tdAct = document.createElement('td');
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'btn';
    btn.textContent = 'Load';
    btn.addEventListener('click', () => {
      $('gen-provider').value = p.id;
      configureGenerator();
      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
    });
    tdAct.appendChild(btn);

    tr.append(tdName, tdCat, tdShape, tdBits, tdAct);
    body.appendChild(tr);
  }
  $('cat-count').textContent = `${shown} of ${PROVIDERS.length} providers`;
}

/* ── validator ─────────────────────────────────────────────────────────── */
let valTimer;
function renderValidation() {
  const text = $('val-input').value;
  const out = $('val-results');
  out.innerHTML = '';
  if (!text.trim()) {
    $('val-summary').textContent = '';
    return;
  }
  const report = scan(text);
  let matched = 0;
  for (const { line, lineNumber, hits } of report) {
    if (hits.length > 0) matched++;
    const div = document.createElement('div');
    div.className = 'val-line';

    const lineEl = document.createElement('div');
    lineEl.className = 'line-text';
    lineEl.textContent = `L${lineNumber}: ${line.length > 80 ? line.slice(0, 80) + '…' : line}`;
    div.appendChild(lineEl);

    if (hits.length === 0) {
      const badge = document.createElement('span');
      badge.className = 'badge none';
      badge.textContent = 'no match';
      const span = document.createElement('span');
      span.className = 'muted';
      span.textContent = 'No known provider format.';
      div.append(badge, span);
    } else {
      for (const hit of hits) {
        const p = document.createElement('div');
        p.className = 'val-hit';
        const badge = document.createElement('span');
        badge.className = 'badge ok';
        badge.textContent = 'shape ✓';
        const label = document.createElement('strong');
        label.textContent = `${hit.providerName} · ${hit.credentialLabel}`;
        const bits = document.createElement('span');
        bits.className = 'muted';
        bits.textContent = ` — ${fmtBits(hit.bits)} format entropy`;
        p.append(badge, label, bits);
        div.appendChild(p);
      }
    }
    out.appendChild(div);
  }
  $('val-summary').textContent =
    `${report.length} line${report.length === 1 ? '' : 's'} · ${matched} matched a known format (shape only)`;
}

/* ── entropy table ─────────────────────────────────────────────────────── */
function renderEntropy() {
  const rate = Number($('ent-rate').value);
  const rateLabel = $('ent-rate').selectedOptions[0].textContent.replace(/\s*\(.*\)/, '');
  $('ent-col-years').textContent = `Expected years @ ${rateLabel.replace(' /s', '')}/s`;

  const body = $('entropy-body');
  body.innerHTML = '';
  const rows = [...PROVIDERS].sort((a, b) => providerBits(b) - providerBits(a));
  for (const p of rows) {
    const log10ks = providerLog10KeySpace(p);
    const log10yr = log10ExpectedYears(log10ks, rate);
    const tr = document.createElement('tr');

    const tdName = document.createElement('td');
    tdName.textContent = p.name;

    const tdBits = document.createElement('td');
    tdBits.className = 'num col-bits';
    tdBits.textContent = fmtBits(providerBits(p));

    const tdKs = document.createElement('td');
    tdKs.className = 'num col-ks';
    tdKs.innerHTML = fmtLog10Html(log10ks);

    const tdYears = document.createElement('td');
    tdYears.className = 'num';
    tdYears.innerHTML = fmtLog10Html(log10yr);

    const tdVs = document.createElement('td');
    tdVs.className = 'num col-vs';
    const ratio = log10yr - Math.log10(AGE_OF_UNIVERSE_YEARS);
    tdVs.innerHTML = `${fmtLog10Html(ratio)} ×`;

    tr.append(tdName, tdBits, tdKs, tdYears, tdVs);
    body.appendChild(tr);
  }
}

/* ── PWA: install + service worker ─────────────────────────────────────── */
let deferredPrompt = null;
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  $('btn-install').hidden = false;
});
$('btn-install').addEventListener('click', async () => {
  if (!deferredPrompt) return;
  deferredPrompt.prompt();
  await deferredPrompt.userChoice;
  deferredPrompt = null;
  $('btn-install').hidden = true;
});
window.addEventListener('appinstalled', () => toast('Keyshape installed.'));

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    const swUrl = new URL('sw.js', import.meta.url);
    navigator.serviceWorker.register(swUrl.href).catch(() => {
      /* offline support unavailable (e.g. file://) — app still works online */
    });
  });
}

/* ── boot ──────────────────────────────────────────────────────────────── */
function init() {
  // provider select
  const sel = $('gen-provider');
  const groups = {};
  for (const p of PROVIDERS) {
    if (!groups[p.category]) {
      const og = document.createElement('optgroup');
      og.label = p.category;
      groups[p.category] = og;
      sel.appendChild(og);
    }
    const opt = document.createElement('option');
    opt.value = p.id;
    opt.textContent = p.name;
    groups[p.category].appendChild(opt);
  }
  // custom provider (user-defined shape) as a synthetic entry
  const custom = document.createElement('option');
  custom.value = '__custom__';
  custom.textContent = 'Custom provider (define shape below)';
  sel.appendChild(custom);

  // category filter
  const filter = $('cat-filter');
  filter.appendChild(new Option('All categories', ''));
  for (const c of CATEGORIES) filter.appendChild(new Option(c, c));

  sel.addEventListener('change', () => {
    if (sel.value === '__custom__') {
      installCustomProvider();
    }
    configureGenerator();
  });
  $('gen-form').addEventListener('submit', (e) => {
    e.preventDefault();
    runGenerate();
  });
  $('gen-copy').addEventListener('click', copyOutput);
  $('gen-download').addEventListener('click', downloadOutput);
  $('cat-search').addEventListener('input', renderCatalog);
  $('cat-filter').addEventListener('change', renderCatalog);

  $('val-input').addEventListener('input', () => {
    clearTimeout(valTimer);
    valTimer = setTimeout(renderValidation, 150);
  });
  $('val-clear').addEventListener('click', () => {
    $('val-input').value = '';
    renderValidation();
  });
  $('val-sample').addEventListener('click', () => {
    const samples = ['openai', 'github-pat', 'gemini', 'groq', 'stripe']
      .map((id) => formatSample(id))
      .concat(['definitely-not-a-key']);
    $('val-input').value = samples.join('\n');
    renderValidation();
  });

  $('ent-rate').addEventListener('change', renderEntropy);

  showView();
  configureGenerator();
  renderCatalog();
  renderEntropy();
}

/** one synthetic line for the validator demo */
function formatSample(id) {
  const provider = getProvider(id);
  const rows = generateBatch(provider, 1, { prefixIndex: { 'Secret key': 0 } });
  return rows[0].text.replace(/\n/g, ' ');
}

/* ── custom provider (user-defined shape, added to the catalog at runtime) ─ */
function installCustomProvider() {
  if (getProvider('__custom__')) return;
  const spec = {
    id: '__custom__',
    name: 'Custom provider',
    category: 'Other',
    approx: true,
    note: 'Define your own shape below: prefix, suffix and alphabet. Use the segment length input for the random body length.',
    credentials: [
      {
        label: 'Key',
        template: [{ label: 'Key', length: 24, charsetId: 'base62', prefix: '', adjustable: true }],
      },
    ],
  };
  PROVIDERS.push(spec);
  addCustomControls(spec);
  renderCatalog();
}

function addCustomControls(spec) {
  if ($('custom-wrap')) return;
  const wrap = document.createElement('div');
  wrap.id = 'custom-wrap';
  wrap.className = 'field-note';
  wrap.innerHTML = `
    <div class="length-row" style="align-items:end">
      <label><span>Custom prefix</span><input id="custom-prefix" value="" placeholder="e.g. xyz_"></label>
      <label><span>Custom suffix</span><input id="custom-suffix" value="" placeholder="optional"></label>
      <label><span>Alphabet</span>
        <select id="custom-charset">
          ${Object.values(CHARSETS).map((c) => `<option value="${c.id}">${c.label}</option>`).join('')}
        </select>
      </label>
    </div>`;
  $('gen-note').after(wrap);

  const token = spec.credentials[0].template[0];
  const sync = () => {
    token.prefix = $('custom-prefix').value;
    token.charsetId = $('custom-charset').value;
    const suffix = $('custom-suffix').value;
    spec.credentials[0].template = suffix ? [token, suffix] : [token];
    renderCatalog();
  };
  wrap.addEventListener('change', sync);
  wrap.addEventListener('input', sync);
}

init();
