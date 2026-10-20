# Deployment — The Golden Tiger (Vercel)

## Required environment variables

Set these in the Vercel project settings (Project → Settings → Environment Variables):

- `NEXT_PUBLIC_SUPABASE_URL` — Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase anon/public key
- `SUPABASE_SERVICE_ROLE_KEY` — Supabase service-role key (server-side only)
- `JWT_SECRET` — Secret used to sign session JWTs

## Build

```
next build
```

## Node version

Node.js 18.x is required (Vercel default). Set `engines.node` to `18.x` if pinning.
