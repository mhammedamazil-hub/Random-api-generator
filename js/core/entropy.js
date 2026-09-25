/**
 * Key-space and brute-force arithmetic.
 * All large magnitudes are handled in log10 space so we never overflow.
 */

import { charset } from './charset.js';

export const SECONDS_PER_YEAR = 3.156e7;
export const AGE_OF_UNIVERSE_YEARS = 1.38e10;

/** @param {{length:number, charsetId:string}} token */
export function tokenBits(token) {
  return token.length * Math.log2(charset(token.charsetId).alphabet.length);
}

export function tokenLog10KeySpace(token) {
  return token.length * Math.log10(charset(token.charsetId).alphabet.length);
}

function templateTokens(credential) {
  return credential.template.filter((t) => typeof t !== 'string');
}

/** Entropy of one credential in bits (sum over random segments). */
export function credentialBits(credential) {
  return templateTokens(credential).reduce((s, t) => s + tokenBits(t), 0);
}

/** Entropy of a provider (all credential parts) in bits. */
export function providerBits(provider) {
  return provider.credentials.reduce((s, c) => s + credentialBits(c), 0);
}

export function providerLog10KeySpace(provider) {
  return provider.credentials.reduce(
    (s, c) => s + templateTokens(c).reduce((a, t) => a + tokenLog10KeySpace(t), 0),
    0
  );
}

/**
 * log10 of the expected search time in years to find one key by blind
 * guessing (expected probes ≈ keyspace / 2) at `probesPerSecond`.
 */
export function log10ExpectedYears(log10KeySpace, probesPerSecond) {
  return (
    log10KeySpace -
    Math.log10(2) -
    Math.log10(probesPerSecond) -
    Math.log10(SECONDS_PER_YEAR)
  );
}

/** Split a log10 magnitude into {mantissa, exponent} with 1 <= mantissa < 10. */
export function splitExp(log10Value) {
  const exponent = Math.floor(log10Value);
  const mantissa = 10 ** (log10Value - exponent);
  return { mantissa, exponent };
}

/** Human string like "3.16 × 10^85", or ordinary numbers when small. */
export function fmtLog10(log10Value) {
  if (log10Value < 3) {
    const v = 10 ** log10Value;
    return v < 1 ? v.toFixed(3) : v.toLocaleString(undefined, { maximumFractionDigits: 1 });
  }
  if (log10Value < 6) {
    return Math.round(10 ** log10Value).toLocaleString('en-US');
  }
  const { mantissa, exponent } = splitExp(log10Value);
  return `${mantissa.toFixed(2)} × 10^${exponent}`;
}

/**
 * HTML string with a real <sup> exponent (fmtLog10 is the text fallback).
 * Escapes nothing else — only used with our own numeric strings.
 */
export function fmtLog10Html(log10Value) {
  const text = fmtLog10(log10Value);
  return text.replace(/\^(-?\d+)/, '<sup>$1</sup>');
}

/** Bits → "128 bits" with one decimal when fractional. */
export function fmtBits(bits) {
  const rounded = Math.round(bits * 10) / 10;
  return `${Number.isInteger(rounded) ? rounded : rounded.toFixed(1)} bits`;
}
