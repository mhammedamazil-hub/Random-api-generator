/**
 * Unit tests for Keyshape core modules (no DOM required).
 * Run: npm test  (plain `node --test tests/` also works)
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import { CHARSETS, randomString, randomToken } from '../js/core/charset.js';
import { PROVIDERS, getProvider, shapeSummary, CATEGORIES } from '../js/core/providers.js';
import {
  generateOne,
  generateBatch,
  formatOutput,
  slug,
  FIXTURE_NOTICE,
} from '../js/core/generate.js';
import {
  providerBits,
  tokenBits,
  log10ExpectedYears,
  splitExp,
  fmtLog10,
  providerLog10KeySpace,
} from '../js/core/entropy.js';
import { detect, scan, providerRegexes, escapeRe } from '../js/core/validate.js';

// Deterministic RNG for reproducible assertions when needed.
function seededBytes(n) {
  const out = new Uint8Array(n);
  let x = 0x9e3779b9;
  for (let i = 0; i < n; i++) {
    x = (x * 1664525 + 1013904223) >>> 0;
    out[i] = x & 0xff;
  }
  return out;
}

test('charsets expose non-empty alphabets and regex classes', () => {
  for (const cs of Object.values(CHARSETS)) {
    assert.ok(cs.alphabet.length >= 2);
    assert.equal(new Set(cs.alphabet).size, cs.alphabet.length, `${cs.id} has duplicate chars`);
    assert.ok(cs.reClass.length > 0);
  }
});

test('randomString: length, alphabet conformance, injected rng', () => {
  const s = randomString('abc', 500, seededBytes);
  assert.equal(s.length, 500);
  for (const ch of s) assert.ok('abc'.includes(ch));
  const hex = randomToken('hex', 32, seededBytes);
  assert.equal(hex.length, 32);
  assert.match(hex, /^[0-9a-f]{32}$/);
  assert.throws(() => randomString('abc', -1), RangeError);
});

test('provider catalog: ids unique, schema valid, regexes compile', () => {
  const ids = new Set();
  assert.ok(PROVIDERS.length >= 50, `expected the full catalog, got ${PROVIDERS.length}`);
  for (const p of PROVIDERS) {
    assert.ok(p.id && p.name && p.category, `missing fields on ${p.id}`);
    assert.ok(!ids.has(p.id), `duplicate id ${p.id}`);
    ids.add(p.id);
    assert.ok(Array.isArray(p.credentials) && p.credentials.length >= 1, p.id);
    for (const c of p.credentials) {
      assert.ok(c.label && Array.isArray(c.template) && c.template.length >= 1, p.id);
      for (const t of c.template) {
        if (typeof t === 'string') continue;
        assert.ok(t.label && Number.isInteger(t.length) && t.length > 0, `${p.id}/${c.label}`);
        assert.ok(CHARSETS[t.charsetId], `${p.id}: bad charset ${t.charsetId}`);
      }
      // must produce at least one random char
      assert.ok(c.template.some((t) => typeof t !== 'string'), `${p.id}: no random segments`);
    }
    for (const { regex } of providerRegexes(p)) {
      assert.ok(regex instanceof RegExp);
    }
    assert.ok(shapeSummary(p).length > 0);
    assert.ok(providerBits(p) > 0);
    assert.ok(providerLog10KeySpace(p) > 0);
  }
  assert.ok(CATEGORIES.length >= 5);
  assert.equal(getProvider('openai').name, 'OpenAI');
  assert.equal(getProvider('nope'), null);
});

test('generator: round-trip — every provider fixture matches its own format', () => {
  for (const p of PROVIDERS) {
    for (let i = 0; i < 5; i++) {
      const row = generateOne(p, {});
      for (const cred of p.credentials) {
        const value = row.values[slug(cred.label)];
        assert.ok(value && value.length > 0, `${p.id}/${cred.label}`);
        const { regex } = providerRegexes(p).find((r) => r.label === cred.label);
        assert.ok(regex.test(value), `${p.id}: generated "${value}" failed its own pattern ${regex}`);
      }
    }
  }
});

test('generator: adjustable lengths and prefix options are honored', () => {
  const anthropic = getProvider('anthropic');
  const short = generateOne(anthropic, { lengths: { 'API key': 10 } });
  assert.match(short.text, /^sk-ant-.{10}$/);

  const stripe = getProvider('stripe');
  const live = generateOne(stripe, { prefixIndex: { 'Secret key': 1 } });
  assert.match(live.text, /^sk_live_/);
  const restricted = generateOne(stripe, { prefixIndex: { 'Secret key': 3 } });
  assert.match(restricted.text, /^rk_live_/);
});

test('generator: compound providers render labeled lines; batch + formats work', () => {
  const aws = getProvider('aws');
  const row = generateOne(aws, {});
  assert.match(row.text, /^Access Key ID: AKIA[A-Z0-9]{16}\nSecret Access Key: /);
  assert.equal(row.values.access_key_id.startsWith('AKIA'), true);

  const rows = generateBatch(getProvider('openai'), 3, {}, seededBytes);
  assert.equal(rows.length, 3);
  assert.throws(() => generateBatch(getProvider('openai'), 0), RangeError);
  assert.throws(() => generateBatch(getProvider('openai'), 10001), RangeError);

  const txt = formatOutput(getProvider('openai'), rows, 'txt');
  assert.ok(txt.includes(FIXTURE_NOTICE));
  const csv = formatOutput(getProvider('openai'), rows, 'csv');
  assert.ok(csv.startsWith('Secret key\r\n'));
  const json = JSON.parse(formatOutput(aws, generateBatch(aws, 2, {}, seededBytes), 'json'));
  assert.equal(json.fixtures.length, 2);
  assert.ok(json.fixtures[0].access_key_id.startsWith('AKIA'));
  assert.equal(json._notice, FIXTURE_NOTICE);
});

test('entropy: known values and formatting', () => {
  const openai = getProvider('openai');
  // 48 chars of Base62 = 48 * log2(62) ≈ 284.7 bits
  assert.ok(Math.abs(providerBits(openai) - 48 * Math.log2(62)) < 1e-9);
  assert.equal(tokenBits({ length: 8, charsetId: 'hex' }), 32);

  // Expected years for OpenAI's keyspace at 10^12 probes/s is ~10^66
  const log10ks = providerLog10KeySpace(openai);
  const log10Years = log10ExpectedYears(log10ks, 1e12);
  assert.ok(log10Years > 65 && log10Years < 67, `got ${log10Years}`);

  const { mantissa, exponent } = splitExp(284.7);
  assert.ok(Math.abs(Math.log10(mantissa) + exponent - 284.7) < 1e-9);
  assert.ok(mantissa >= 1 && mantissa < 10);
  assert.match(fmtLog10(85.2), /10\^85$/);
});

test('validator: detects real shapes, rejects junk, never false-claims validity', () => {
  const openaiRow = generateOne(getProvider('openai'), { lengths: { 'Secret key': 48 } });
  const hits = detect(openaiRow.text);
  assert.ok(hits.some((h) => h.providerId === 'openai'), JSON.stringify(hits));
  assert.ok(hits.every((h) => h.bits > 0));

  assert.equal(detect('not-a-key').length, 0);
  assert.equal(detect('').length, 0);

  // A wrong-length sk- key must not match OpenAI exactly.
  assert.equal(detect('sk-' + 'a'.repeat(5)).length, 0);

  // Multi-line scan
  const g = generateOne(getProvider('groq'), {});
  const report = scan(`${openaiRow.text}\n\n${g.text}`);
  assert.equal(report.length, 2);
  assert.ok(report[0].hits.length >= 1);
  assert.ok(report[1].hits.some((h) => h.providerId === 'groq'));

  // AWS access key segment detects on its own
  const awsRow = generateOne(getProvider('aws'), {});
  assert.ok(detect(awsRow.values.access_key_id).some((h) => h.providerId === 'aws'));

  assert.equal(escapeRe('a.b*c'), 'a\\.b\\*c');
});
