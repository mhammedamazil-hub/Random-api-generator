/**
 * Provider format catalog.
 *
 * Shapes below reflect PUBLICLY DOCUMENTED / commonly observed key formats
 * (prefix + approximate length + charset class). Lengths marked `approx` are
 * typical values — real providers rotate and evolve formats. This catalog is
 * for generating synthetic test fixtures and recognizing key types locally.
 *
 * Schema:
 *   Provider  = { id, name, category, approx?, compound?, note?, credentials: Credential[] }
 *   Credential= { label, template: (string | Token)[] }
 *   Token     = { label, length, charsetId, prefix?, prefixOptions?, adjustable?, tight? }
 *   compound: true → several labeled credentials (e.g. SID + token), rendered
 *             as "Label: value" lines; false/omitted → a single key string.
 */

const T = (label, length, charsetId, opts = {}) => ({
  label,
  length,
  charsetId,
  ...opts,
});
const C = (label, template) => ({ label, template });

const GOOG = (id, name) => ({
  id,
  name,
  category: 'Cloud & Infra',
  approx: true,
  note: 'Google API keys use the AIza prefix (~35 chars after it).',
  credentials: [C('API key', [T('API key', 35, 'base62url', { prefix: 'AIza' })])],
});

export const PROVIDERS = [
  // ── AI & ML ──────────────────────────────────────────────────────────────
  {
    id: 'gemini',
    name: 'Google Gemini',
    category: 'AI & ML',
    approx: true,
    note: 'Google AI / Gemini API keys use the shared AIza key format.',
    credentials: [C('API key', [T('API key', 35, 'base62url', { prefix: 'AIza' })])],
  },
  {
    id: 'openai',
    name: 'OpenAI',
    category: 'AI & ML',
    approx: true,
    note: 'Secret keys are sk- + ~48 chars. Project keys may use sk-proj-. Classic sk- keys were shorter historically.',
    credentials: [C('Secret key', [T('Secret key', 48, 'base62', { prefix: 'sk-', adjustable: true })])],
  },
  {
    id: 'anthropic',
    name: 'Anthropic',
    category: 'AI & ML',
    approx: true,
    note: 'sk-ant- + long (~90+) Base64URL-ish body, often with an apiNN build tag.',
    credentials: [C('API key', [T('API key', 90, 'base62url', { prefix: 'sk-ant-', adjustable: true })])],
  },
  {
    id: 'openrouter',
    name: 'OpenRouter',
    category: 'AI & ML',
    approx: true,
    note: 'sk-or-v1- + ~64 hex body.',
    credentials: [C('API key', [T('API key', 64, 'hex', { prefix: 'sk-or-v1-' })])],
  },
  {
    id: 'huggingface',
    name: 'Hugging Face',
    category: 'AI & ML',
    approx: true,
    note: 'Access tokens are hf_ + ~37 chars. Fine-grained tokens may use hf_pat_.',
    credentials: [C('Access token', [T('Access token', 37, 'base62', { prefix: 'hf_' })])],
  },
  {
    id: 'groq',
    name: 'Groq',
    category: 'AI & ML',
    approx: true,
    note: 'gsk_ + ~56 chars.',
    credentials: [C('API key', [T('API key', 56, 'base62', { prefix: 'gsk_' })])],
  },
  {
    id: 'replicate',
    name: 'Replicate',
    category: 'AI & ML',
    approx: true,
    note: 'r8_ + ~40 chars.',
    credentials: [C('API token', [T('API token', 40, 'base62', { prefix: 'r8_', adjustable: true })])],
  },
  {
    id: 'cohere',
    name: 'Cohere',
    category: 'AI & ML',
    approx: true,
    note: '~40 chars. Newer keys may carry a co- prefix.',
    credentials: [C('API key', [T('API key', 40, 'base62', { prefixOptions: ['', 'co-'], adjustable: true })])],
  },
  {
    id: 'mistral',
    name: 'Mistral AI',
    category: 'AI & ML',
    approx: true,
    note: '~32 chars.',
    credentials: [C('API key', [T('API key', 32, 'base62', { adjustable: true })])],
  },
  {
    id: 'together',
    name: 'Together AI',
    category: 'AI & ML',
    approx: true,
    note: '~50 chars.',
    credentials: [C('API key', [T('API key', 50, 'base62', { adjustable: true })])],
  },
  {
    id: 'perplexity',
    name: 'Perplexity',
    category: 'AI & ML',
    approx: true,
    note: 'pplx- + ~40 chars.',
    credentials: [C('API key', [T('API key', 40, 'base62', { prefix: 'pplx-', adjustable: true })])],
  },
  {
    id: 'elevenlabs',
    name: 'ElevenLabs',
    category: 'AI & ML',
    approx: true,
    note: '~32 hex chars.',
    credentials: [C('API key', [T('API key', 32, 'hex', { adjustable: true })])],
  },
  {
    id: 'assemblyai',
    name: 'AssemblyAI',
    category: 'AI & ML',
    approx: true,
    note: '~32 chars, commonly hex.',
    credentials: [C('API key', [T('API key', 32, 'hex', { adjustable: true })])],
  },
  {
    id: 'deepgram',
    name: 'Deepgram',
    category: 'AI & ML',
    approx: true,
    note: 'Project API keys commonly ~40 chars (some are UUID-shaped).',
    credentials: [C('API key', [T('API key', 40, 'base62', { adjustable: true })])],
  },

  // ── Dev Platforms ────────────────────────────────────────────────────────
  {
    id: 'github-pat',
    name: 'GitHub Classic PAT',
    category: 'Dev Platforms',
    approx: true,
    note: 'Classic personal access tokens: ghp_ + ~36 chars.',
    credentials: [C('Token', [T('Token', 36, 'base62', { prefix: 'ghp_' })])],
  },
  {
    id: 'github-fine',
    name: 'GitHub Fine-grained PAT',
    category: 'Dev Platforms',
    approx: true,
    note: 'Fine-grained tokens: github_pat_ + ~82 chars (underscore-separated body).',
    credentials: [C('Token', [T('Token', 82, 'base62url', { prefix: 'github_pat_' })])],
  },
  {
    id: 'gitlab',
    name: 'GitLab',
    category: 'Dev Platforms',
    approx: true,
    note: 'Personal/group/project access tokens: glpat- + ~20 chars (some run to 24).',
    credentials: [C('Token', [T('Token', 20, 'base62', { prefix: 'glpat-', adjustable: true })])],
  },
  {
    id: 'npm',
    name: 'npm',
    category: 'Dev Platforms',
    approx: true,
    note: 'Automation/granular access tokens: npm_ + ~36 chars.',
    credentials: [C('Token', [T('Token', 36, 'base62', { prefix: 'npm_' })])],
  },
  {
    id: 'vercel',
    name: 'Vercel',
    category: 'Dev Platforms',
    approx: true,
    note: 'Tokens commonly vercel_ + ~24 chars.',
    credentials: [C('Token', [T('Token', 24, 'base62', { prefix: 'vercel_', adjustable: true })])],
  },
  {
    id: 'netlify',
    name: 'Netlify',
    category: 'Dev Platforms',
    approx: true,
    note: 'Personal access tokens: nfp_ + provider-specific length.',
    credentials: [C('Token', [T('Token', 40, 'base62url', { prefix: 'nfp_', adjustable: true })])],
  },
  {
    id: 'linear',
    name: 'Linear',
    category: 'Dev Platforms',
    approx: true,
    note: 'Personal API keys: lin_api_ + long body.',
    credentials: [C('API key', [T('API key', 40, 'base62url', { prefix: 'lin_api_', adjustable: true })])],
  },
  {
    id: 'notion',
    name: 'Notion',
    category: 'Dev Platforms',
    approx: true,
    note: 'Internal integrations: secret_… ; newer workspace tokens: ntn_… .',
    credentials: [C('Integration token', [T('Integration token', 32, 'base62', { prefixOptions: ['ntn_', 'secret_'], adjustable: true })])],
  },

  // ── Cloud & Infra ────────────────────────────────────────────────────────
  GOOG('firebase', 'Firebase'),
  GOOG('google-maps', 'Google Maps'),
  GOOG('google-cloud', 'Google Cloud'),
  GOOG('google-translate', 'Google Translate'),
  {
    id: 'supabase',
    name: 'Supabase',
    category: 'Cloud & Infra',
    approx: true,
    note: 'API keys are JWTs (header.payload.signature, Base64URL segments). Service-role vs anon is a claim inside the payload.',
    credentials: [
      C('JWT API key', [
        T('Header', 24, 'base62url'),
        '.',
        T('Payload', 36, 'base62url'),
        '.',
        T('Signature', 43, 'base62url'),
      ]),
    ],
  },
  {
    id: 'pinecone',
    name: 'Pinecone',
    category: 'Cloud & Infra',
    approx: true,
    note: 'Older keys ~36 chars; newer keys carry pcsk_/pchk_ style prefixes.',
    credentials: [C('API key', [T('API key', 36, 'base62url', { prefixOptions: ['', 'pcsk_', 'pchk_'], adjustable: true })])],
  },
  {
    id: 'cloudflare',
    name: 'Cloudflare',
    category: 'Cloud & Infra',
    approx: true,
    note: 'API tokens (~40 chars) and legacy global API keys (~37 chars) coexist.',
    credentials: [C('API token', [T('API token', 40, 'alnumLower', { adjustable: true })])],
  },
  {
    id: 'aws',
    name: 'AWS',
    category: 'Cloud & Infra',
    compound: true,
    approx: true,
    note: 'Access key ID (AKIA…, 20 chars) is paired with a 40-char Base64 secret key. Newer STS keys use ASIA… .',
    credentials: [
      C('Access Key ID', [T('Access Key ID', 16, 'alnumUpper', { prefix: 'AKIA', tight: true })]),
      C('Secret Access Key', [T('Secret Access Key', 40, 'base64')]),
    ],
  },
  {
    id: 'azure',
    name: 'Azure',
    category: 'Cloud & Infra',
    compound: true,
    approx: true,
    note: 'Azure uses many credential types (subscription GUIDs, client IDs, client secrets, SAS). Example shape only.',
    credentials: [
      C('Client/Subscription ID', [
        T('a', 8, 'hex', { tight: true }), '-', T('b', 4, 'hex', { tight: true }), '-',
        T('c', 4, 'hex', { tight: true }), '-', T('d', 4, 'hex', { tight: true }), '-',
        T('e', 12, 'hex', { tight: true }),
      ]),
      C('Client Secret', [T('Client Secret', 40, 'base62url', { adjustable: true })]),
    ],
  },
  {
    id: 'digitalocean',
    name: 'DigitalOcean',
    category: 'Cloud & Infra',
    approx: true,
    note: 'Tokens commonly dop_v1_ + body; OAuth access tokens are opaque ~64 chars.',
    credentials: [C('Token', [T('Token', 64, 'alnumLower', { prefix: 'dop_v1_', adjustable: true })])],
  },
  {
    id: 'databricks',
    name: 'Databricks',
    category: 'Cloud & Infra',
    approx: true,
    note: 'Personal access tokens: dapi + hex body. Newer formats (dapiNN…) differ.',
    credentials: [C('Token', [T('Token', 32, 'hex', { prefix: 'dapi', adjustable: true })])],
  },
  {
    id: 'upstash',
    name: 'Upstash',
    category: 'Cloud & Infra',
    approx: true,
    note: 'REST/token credentials are opaque; length varies by product.',
    credentials: [C('Token', [T('Token', 40, 'base62url', { adjustable: true })])],
  },
  {
    id: 'planetscale',
    name: 'PlanetScale',
    category: 'Cloud & Infra',
    approx: true,
    note: 'API tokens use pscale_tkn_ style prefixes with provider-specific bodies.',
    credentials: [C('Token', [T('Token', 40, 'base62url', { prefix: 'pscale_tkn_', adjustable: true })])],
  },
  {
    id: 'mongodb-atlas',
    name: 'MongoDB Atlas',
    category: 'Cloud & Infra',
    approx: true,
    note: 'Credentials live inside a connection string (mongodb+srv://user:pass@cluster…). URL-shaped, not an ordinary key.',
    credentials: [
      C('Connection string', [
        'mongodb+srv://',
        T('Username', 8, 'alnumLower'),
        ':',
        T('Password', 24, 'base62url'),
        '@cluster',
        T('Cluster id', 6, 'alnumLower'),
        '.mongodb.net',
      ]),
    ],
  },

  // ── Data & Search ────────────────────────────────────────────────────────
  {
    id: 'openweather',
    name: 'OpenWeather',
    category: 'Data & Search',
    approx: true,
    note: 'API keys commonly 32 hex chars.',
    credentials: [C('API key', [T('API key', 32, 'hex', { adjustable: true })])],
  },
  {
    id: 'newsapi',
    name: 'NewsAPI',
    category: 'Data & Search',
    approx: true,
    note: 'API keys commonly 32 hex chars.',
    credentials: [C('API key', [T('API key', 32, 'hex', { adjustable: true })])],
  },
  {
    id: 'exchangerate',
    name: 'ExchangeRate API',
    category: 'Data & Search',
    approx: true,
    note: 'Provider-specific opaque key.',
    credentials: [C('API key', [T('API key', 32, 'base62', { adjustable: true })])],
  },
  {
    id: 'mapbox',
    name: 'Mapbox',
    category: 'Data & Search',
    approx: true,
    note: 'Tokens are pk.… (public) or sk.… (secret), long Base64URL bodies.',
    credentials: [C('Token', [T('Token', 70, 'base62url', { prefixOptions: ['pk.', 'sk.'], adjustable: true })])],
  },
  {
    id: 'algolia',
    name: 'Algolia',
    category: 'Data & Search',
    compound: true,
    approx: true,
    note: 'Always a pair: application ID + API key (search-only or admin).',
    credentials: [
      C('Application ID', [T('Application ID', 10, 'alnumLower')]),
      C('API Key', [T('API Key', 32, 'base62')]),
    ],
  },

  // ── Comms & Messaging ────────────────────────────────────────────────────
  {
    id: 'twilio',
    name: 'Twilio',
    category: 'Comms & Messaging',
    compound: true,
    approx: true,
    note: 'Two-part credential: Account SID (AC + 32 hex) plus a 32-hex Auth Token. API keys use SK… prefixes.',
    credentials: [
      C('Account SID', [T('Account SID', 32, 'hex', { prefix: 'AC', tight: true })]),
      C('Auth Token', [T('Auth Token', 32, 'hex')]),
    ],
  },
  {
    id: 'sendgrid',
    name: 'SendGrid',
    category: 'Comms & Messaging',
    approx: true,
    note: 'API keys are SG.<id>.<secret> — Base64URL segments separated by dots.',
    credentials: [
      C('API key', [
        'SG.',
        T('Key ID', 22, 'base62url'),
        '.',
        T('Secret', 43, 'base62url'),
      ]),
    ],
  },
  {
    id: 'mailgun',
    name: 'Mailgun',
    category: 'Comms & Messaging',
    approx: true,
    note: 'Private API keys commonly key- + hex body.',
    credentials: [C('API key', [T('API key', 32, 'hex', { prefix: 'key-', adjustable: true })])],
  },
  {
    id: 'discord-bot',
    name: 'Discord Bot Token',
    category: 'Comms & Messaging',
    approx: true,
    note: 'Three dot-separated Base64URL segments (snowflake.timestamp.hmac) — a bot token, not a conventional API key.',
    credentials: [
      C('Bot token', [
        T('User ID', 18, 'base62url', { tight: true }),
        '.',
        T('Timestamp', 6, 'base62url'),
        '.',
        T('HMAC', 27, 'base62url'),
      ]),
    ],
  },
  {
    id: 'discord-webhook',
    name: 'Discord Webhook',
    category: 'Comms & Messaging',
    approx: true,
    note: 'URL-shaped credential: the path carries the webhook ID and token.',
    credentials: [
      C('Webhook URL', [
        'https://discord.com/api/webhooks/',
        T('Webhook ID', 19, 'digits'),
        '/',
        T('Token', 68, 'base62url'),
      ]),
    ],
  },
  {
    id: 'telegram-bot',
    name: 'Telegram Bot',
    category: 'Comms & Messaging',
    approx: true,
    note: 'bot_id:token — a numeric bot ID, a colon, then a 35-char token.',
    credentials: [
      C('Bot token', [
        T('Bot ID', 9, 'digits'),
        ':',
        T('Token', 35, 'base62url'),
      ]),
    ],
  },
  {
    id: 'slack',
    name: 'Slack',
    category: 'Comms & Messaging',
    approx: true,
    note: 'Bot tokens xoxb-…, user tokens xoxp-… : digit groups separated by dashes plus a final secret body.',
    credentials: [
      C('Token', [
        T('Team digits', 11, 'digits', {
          prefixOptions: ['xoxb-', 'xoxp-', 'xoxa-', 'xoxs-'],
          tight: true,
        }),
        '-',
        T('User digits', 11, 'digits', { tight: true }),
        '-',
        T('Secret', 24, 'base62'),
      ]),
    ],
  },
  {
    id: 'resend',
    name: 'Resend',
    category: 'Comms & Messaging',
    approx: true,
    note: 'API keys: re_ + body.',
    credentials: [C('API key', [T('API key', 32, 'base62url', { prefix: 're_', adjustable: true })])],
  },

  // ── Apps & Social ────────────────────────────────────────────────────────
  {
    id: 'twitch',
    name: 'Twitch',
    category: 'Apps & Social',
    compound: true,
    approx: true,
    note: 'Apps authenticate with a pair: client ID + client secret.',
    credentials: [
      C('Client ID', [T('Client ID', 30, 'alnumLower')]),
      C('Client Secret', [T('Client Secret', 32, 'base62')]),
    ],
  },
  {
    id: 'spotify',
    name: 'Spotify',
    category: 'Apps & Social',
    compound: true,
    approx: true,
    note: 'Apps authenticate with a pair: client ID + client secret.',
    credentials: [
      C('Client ID', [T('Client ID', 32, 'base62')]),
      C('Client Secret', [T('Client Secret', 32, 'base62')]),
    ],
  },
  {
    id: 'reddit',
    name: 'Reddit',
    category: 'Apps & Social',
    compound: true,
    approx: true,
    note: 'Apps authenticate with a pair: client ID (under the app) + client secret.',
    credentials: [
      C('Client ID', [T('Client ID', 14, 'base62', { adjustable: true })]),
      C('Client Secret', [T('Client Secret', 27, 'base62')]),
    ],
  },

  // ── Auth & Analytics ─────────────────────────────────────────────────────
  {
    id: 'auth0',
    name: 'Auth0',
    category: 'Auth & Analytics',
    compound: true,
    approx: true,
    note: 'Machine-to-machine auth needs a trio: tenant domain + client ID + client secret.',
    credentials: [
      C('Domain', [
        T('Tenant', 12, 'alnumLower'),
        '.us.auth0.com',
      ]),
      C('Client ID', [T('Client ID', 32, 'base62')]),
      C('Client Secret', [T('Client Secret', 64, 'base62url')]),
    ],
  },
  {
    id: 'sentry',
    name: 'Sentry',
    category: 'Auth & Analytics',
    approx: true,
    note: 'DSN-shaped: https://<pubkey>@<host>/<project>. Auth tokens use sntry_… style prefixes.',
    credentials: [
      C('DSN', [
        'https://',
        T('Public key', 32, 'hex'),
        '@',
        T('Host', 10, 'alnumLower'),
        '.ingest.sentry.io/',
        T('Project ID', 6, 'digits'),
      ]),
    ],
  },
  {
    id: 'posthog',
    name: 'PostHog',
    category: 'Auth & Analytics',
    approx: true,
    note: 'Project API keys are opaque bodies; personal API keys use phx_ prefixes.',
    credentials: [C('Project API key', [T('Project API key', 32, 'alnumLower', { prefixOptions: ['', 'phx_'], adjustable: true })])],
  },
  {
    id: 'clerk',
    name: 'Clerk',
    category: 'Auth & Analytics',
    approx: true,
    note: 'Publishable/secret keys: pk_/sk_ with test/live variants.',
    credentials: [
      C('Key', [
        T('Key', 30, 'base62url', {
          prefixOptions: ['pk_test_', 'sk_test_', 'pk_live_', 'sk_live_'],
          adjustable: true,
        }),
      ]),
    ],
  },

  // ── Payments ─────────────────────────────────────────────────────────────
  {
    id: 'stripe',
    name: 'Stripe',
    category: 'Payments',
    approx: true,
    note: 'Secret keys: sk_test_/sk_live_; restricted keys rk_… . Classic keys ~24 chars after the prefix, newer keys are much longer.',
    credentials: [
      C('Secret key', [
        T('Secret key', 24, 'base62', {
          prefixOptions: ['sk_test_', 'sk_live_', 'rk_test_', 'rk_live_'],
          adjustable: true,
        }),
      ]),
    ],
  },
];

/** Lookup by id. */
export function getProvider(id) {
  return PROVIDERS.find((p) => p.id === id) || null;
}

export const CATEGORIES = [...new Set(PROVIDERS.map((p) => p.category))].sort();

/**
 * A one-line human description of the shape, e.g. "sk- + 48×Base62".
 */
export function shapeSummary(provider) {
  return provider.credentials
    .map((credential) =>
      credential.template
        .map((t) => {
          if (typeof t === 'string') return t;
          const prefix = t.prefixOptions ? t.prefixOptions.join('|') : t.prefix || '';
          const n = t.length;
          const kind = { base62: 'Base62', base62url: 'Base64URL', base64: 'Base64', hex: 'hex', hexUpper: 'HEX', alnumLower: 'a-z0-9', alnumUpper: 'A-Z0-9', digits: 'digits', alphaLower: 'a-z' }[t.charsetId] || t.charsetId;
          return `${prefix}${n}×${kind}`;
        })
        .join('')
    )
    .join(provider.compound ? '  +  ' : '');
}
