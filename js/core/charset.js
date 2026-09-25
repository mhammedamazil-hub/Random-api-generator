/**
 * Character-set definitions and unbiased random string generation.
 * Works in browsers and Node (>= 19) — no DOM, no dependencies.
 */

export const CHARSETS = {
  base62: {
    id: 'base62',
    label: 'Base62 (A–Z a–z 0–9)',
    alphabet: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789',
    reClass: 'A-Za-z0-9',
  },
  base62url: {
    id: 'base62url',
    label: 'Base64URL (A–Z a–z 0–9 - _)',
    alphabet: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_',
    reClass: 'A-Za-z0-9_-',
  },
  base64: {
    id: 'base64',
    label: 'Base64 (A–Z a–z 0–9 + /)',
    alphabet: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/',
    reClass: 'A-Za-z0-9+/',
  },
  hex: {
    id: 'hex',
    label: 'Hex (0–9 a–f)',
    alphabet: '0123456789abcdef',
    reClass: '0-9a-f',
  },
  hexUpper: {
    id: 'hexUpper',
    label: 'Hex (0–9 A–F)',
    alphabet: '0123456789ABCDEF',
    reClass: '0-9A-F',
  },
  alnumLower: {
    id: 'alnumLower',
    label: 'Lowercase alphanumeric (a–z 0–9)',
    alphabet: 'abcdefghijklmnopqrstuvwxyz0123456789',
    reClass: 'a-z0-9',
  },
  alnumUpper: {
    id: 'alnumUpper',
    label: 'Uppercase alphanumeric (A–Z 0–9)',
    alphabet: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',
    reClass: 'A-Z0-9',
  },
  digits: {
    id: 'digits',
    label: 'Digits (0–9)',
    alphabet: '0123456789',
    reClass: '0-9',
  },
  alphaLower: {
    id: 'alphaLower',
    label: 'Lowercase letters (a–z)',
    alphabet: 'abcdefghijklmnopqrstuvwxyz',
    reClass: 'a-z',
  },
};

export function charset(id) {
  const cs = CHARSETS[id];
  if (!cs) throw new Error(`Unknown charset: ${id}`);
  return cs;
}

function defaultBytes(n) {
  let webcrypto = globalThis.crypto;
  if (!webcrypto || !webcrypto.getRandomValues) {
    throw new Error('Web Crypto API unavailable; cannot draw secure randomness.');
  }
  return webcrypto.getRandomValues(new Uint8Array(n));
}

/**
 * Unbiased random string over `alphabet` (rejection sampling).
 * @param {string} alphabet
 * @param {number} length
 * @param {(n:number)=>Uint8Array} [rng] byte source, for tests
 */
export function randomString(alphabet, length, rng = defaultBytes) {
  if (!Number.isInteger(length) || length < 0 || length > 4096) {
    throw new RangeError(`Invalid length: ${length}`);
  }
  const size = alphabet.length;
  const limit = Math.floor(256 / size) * size; // reject >= limit to avoid modulo bias
  let out = '';
  while (out.length < length) {
    const bytes = rng(Math.max(16, (length - out.length) * 2));
    for (let i = 0; i < bytes.length; i++) {
      const b = bytes[i];
      if (b >= limit) continue;
      out += alphabet[b % size];
      if (out.length === length) break;
    }
  }
  return out;
}

export function randomToken(charsetId, length, rng = defaultBytes) {
  return randomString(charset(charsetId).alphabet, length, rng);
}
