# Environment Strategy

## Overview

Three isolated environments: local dev → staging → production.

| Environment | Supabase Project | Vercel | Branch |
|---|---|---|---|
| Local | `supabase start` (CLI) | `vite dev` | Any feature branch |
| Staging | `legacyapos-staging` | Preview URL | `develop` |
| Production | `legacyapos-prod` | legacyapos.com | `main` |

---

## Supabase Staging Setup (Manual Steps)

Execute once when creating the staging environment:

```bash
# 1. Create staging project via Supabase dashboard
#    Region: Southeast Asia (Singapore) — ap-southeast-1

# 2. Link the project
supabase link --project-ref <staging-project-ref>

# 3. Apply all migrations
supabase db push --project-ref <staging-project-ref>

# 4. Apply seed data (demo accounts, sample products)
supabase db reset --linked

# 5. Set Edge Function secrets
supabase secrets set \
  MIDTRANS_SERVER_KEY=<sandbox-server-key> \
  MIDTRANS_CLIENT_KEY=<sandbox-client-key> \
  MIDTRANS_IS_PRODUCTION=false \
  --project-ref <staging-project-ref>

# 6. Deploy Edge Functions
supabase functions deploy payments-midtrans-charge --project-ref <staging-project-ref>
supabase functions deploy payments-midtrans-webhook --project-ref <staging-project-ref>
```

---

## Vercel Deployment Setup (Manual Steps)

```bash
# 1. Install Vercel CLI
npm i -g vercel

# 2. Link repo
vercel link

# 3. Set build config
#    Build command: npm run build
#    Output dir: dist
#    Install command: npm ci --legacy-peer-deps

# 4. Set environment variables per environment in Vercel dashboard:
#    Production:   VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY (prod values)
#    Preview:      VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY (staging values)
#    Development:  VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY (local values)

# 5. Deploy
vercel --prod   # production
vercel          # preview (staging)
```

---

## Migration Promotion Flow

Migrations always flow: local → staging → production.

```
local dev
  └─ test migration locally with `supabase db reset`
       └─ push to feature branch → PR to develop
            └─ CI runs → auto-deploy to staging Supabase
                 └─ QA sign-off on staging
                      └─ PR to main → CI runs → deploy to production
```

**Never apply migrations directly to production** without staging validation.

---

## Environment Variable Reference

| Variable | Local | Staging | Production |
|---|---|---|---|
| `VITE_SUPABASE_URL` | `http://localhost:54321` | staging URL | prod URL |
| `VITE_SUPABASE_ANON_KEY` | local anon key | staging anon key | prod anon key |
| `VITE_MIDTRANS_CLIENT_KEY` | sandbox client key | sandbox client key | production client key |
| `VITE_MIDTRANS_SNAP_URL` | sandbox URL | sandbox URL | production URL |
| `VITE_APP_ENV` | `development` | `staging` | `production` |

**Edge Function secrets (set via `supabase secrets set`):**
- `SUPABASE_SERVICE_ROLE_KEY` — set automatically by Supabase
- `MIDTRANS_SERVER_KEY` — sandbox for staging, production for prod
- `MIDTRANS_IS_PRODUCTION` — `false` for staging, `true` for production

---

## .gitignore Policy

The following are in `.gitignore` and must never be committed:
- `.env.local`
- `.env.production`
- `.env.staging`

The following ARE committed:
- `.env.example` — template with empty values and comments
