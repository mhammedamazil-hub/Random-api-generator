/**
 * Local format detection & validation.
 *
 * Pattern-matches a pasted string against known provider key *shapes*.
 * This is purely lexical: a "match" only means the string looks right.
 * It says nothing about validity — this module never performs network I/O.
 */

import { charset } from './charset.js';
import { PROVIDERS } from './providers.js';
import { credentialBits } from './entropy.js';

export function escapeRe(source) {
  return source.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function segmentSource(token, provider) {
  if (typeof token === 'string') return escapeRe(token);
  const prefix = token.prefixOptions
    ? `(?:${token.prefixOptions.map(escapeRe).join('|')})`
    : escapeRe(token.prefix || '');
  // Approximate lengths tolerate provider drift; tight tokens are exact.
  const quantifier =
    provider.approx && !token.tight
      ? `{${Math.max(1, token.length - 2)},${token.length + 6}}`
      : `{${token.length}}`;
  return `${prefix}[${charset(token.charsetId).reClass}]${quantifier}`;
}

const cache = new Map();

/** Regexes (one per credential) for a provider. */
export function providerRegexes(provider) {
  if (cache.has(provider.id)) return cache.get(provider.id);
  const compiled = provider.credentials.map((credential) => ({
    label: credential.label,
    regex: new RegExp(
      `^${credential.template.map((t) => segmentSource(t, provider)).join('')}$`
    ),
  }));
  cache.set(provider.id, compiled);
  return compiled;
}

/**
 * Detect which provider key shape(s) a string matches.
 * @returns {{providerId:string, providerName:string, credentialLabel:string, bits:number}[]}
 */
export function detect(input) {
  const hits = [];
  const trimmed = input.trim();
  if (!trimmed) return hits;
  for (const provider of PROVIDERS) {
    for (const { label, regex } of providerRegexes(provider)) {
      if (regex.test(trimmed)) {
        const credential = provider.credentials.find((c) => c.label === label);
        hits.push({
          providerId: provider.id,
          providerName: provider.name,
          credentialLabel: label,
          bits: credentialBits(credential),
        });
      }
    }
  }
  return hits;
}

/**
 * Scan multi-line input. Returns one entry per non-empty line.
 * @returns {{line:string, lineNumber:number, hits:ReturnType<typeof detect>}[]}
 */
export function scan(text) {
  return text
    .split(/\r?\n/)
    .map((line, i) => ({ line: line.trim(), lineNumber: i + 1 }))
    .filter((l) => l.line.length > 0)
    .map((l) => ({ ...l, hits: detect(l.line) }));
}
