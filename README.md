# Keyshape — API Key Format & Entropy Lab

An offline-first, dependency-free PWA for developers:

- **Format catalog** — 57 providers (OpenAI, Anthropic, Gemini, GitHub PATs, AWS, Stripe, Twilio, Slack, Supabase JWTs, webhook URLs, connection strings, …) with documented key shapes: prefix, length, character set, multi-part credentials.
- **Synthetic fixture generator** — random strings in real key *formats*, batch-exportable as TXT / CSV / JSON. Built for test fixtures, parser QA, mock flows and secret-scanner rule testing.
- **Format validator** — paste strings, get instant local classification (“this looks like a Groq key: `gsk_` + 56 Base62”). Purely lexical.
- **Entropy & brute-force lab** — per-provider key-space and expected-guessing-time math (log-space, no big-number libs).

> **What this is not.** Keyshape never contacts provider APIs and cannot tell you whether a key is valid — by design. Generating candidate secrets and probing third-party auth endpoints to land a “working” key is account theft: illegal under computer-misuse law (CFAA / UK CMA and equivalents), a ToS violation at every listed provider, and — as the Entropy tab shows — mathematically hopeless for well-generated keys anyway. The keys you hear about being “found” in the wild were leaked, not guessed. No such feature will be added.

## Quick start

No build step, no dependencies. Either:

```bash
# just open it
open index.html            # (xdg-open on Linux)

# or serve it (recommended: module scripts + service worker need http)
npx serve .                # or: python3 -m http.server 8080
```

## Tests

Core logic (`js/core/*`) is pure ES modules shared by browser and Node:

```bash
npm test                   # node --test tests/core.test.mjs  (Node ≥ 19)
```

Coverage: unbiased charset sampling, catalog schema integrity for all 57 providers, generator→validator round-trip on every provider (including compound credentials and prefix/length options), known entropy values (e.g. OpenAI = 48·log₂62 ≈ 285 bits), and formatter behaviour.

## Deploy free on GitHub Pages

The site is fully static — Pages hosts it as-is:

1. Push this repo to GitHub.
2. **Settings → Pages → Build and deployment**: Source *Deploy from a branch*, branch `main` (or your working branch), folder `/ (root)`.
3. Wait for the green check → the app is live at `https://<user>.github.io/Random-api-generator/`.

`.nojekyll` is included so Pages serves files verbatim. All URLs are relative, so it works under a project sub-path. The service worker caches the whole app after the first visit — it keeps working offline.

## Install as an app (PWA / “APK”)

- **Android / desktop Chrome & Edge** — open the site → *Install & About* → **Install Keyshape** (or the address-bar install icon). It gets a home-screen icon and a standalone window. This is the recommended “Android build”.
- **iPhone / iPad** — Safari → Share → *Add to Home Screen*.
- **Store-style `.apk`** — wrap the same static build in a [Trusted Web Activity](https://developer.chrome.com/docs/android/trusted-web-activity) (Bubblewrap) or Capacitor shell and sign with your own keystore. The `README` intentionally ships no prebuilt APK: a wrapper adds nothing except a signature, and **there is no background service** — an app that silently probes third-party auth endpoints is malware, and there is nothing to probe here.

## Project layout

```
index.html                 app shell (4 views: Generate / Validate / Entropy / Install)
css/styles.css             design system (dark default, light via prefers-color-scheme)
js/core/charset.js         charsets + unbiased random strings (rejection sampling)
js/core/providers.js       the 57-provider format catalog (data + shape summaries)
js/core/generate.js        fixture generation + TXT/CSV/JSON serializers
js/core/entropy.js         key-space & brute-force math (log10 space)
js/core/validate.js        local format detection (regex built from the catalog)
js/app.js                  UI wiring, router, PWA install, SW registration
sw.js                      offline-first service worker
manifest.webmanifest       PWA manifest
scripts/generate-icons.mjs dependency-free PNG icon generator (npm run icons)
tests/core.test.mjs        unit tests (npm test)
```

### Custom formats

Pick **Custom provider** in the generator to define your own prefix, suffix, alphabet and body length — useful for internal tokens with house formats.

## License

MIT.
