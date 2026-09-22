# Brevé — frontend

The Brevé UI: the marketing site, auth pages, and the dashboard for
managing short links and bio pages. Talks to the API in `../../server`.

## Local setup

```bash
npm install
npm run dev
```

No `.env` file is required for local dev — the app defaults to
`http://localhost:4000`, matching the server's own default port, so
`npm run dev` on both projects together just works. See `.env.example`
for the two optional variables and when you'd actually need to set one.

## Deploying to Netlify

1. **Push this repo to GitHub** (or GitLab/Bitbucket) and connect it as a
   new Netlify site. Netlify reads `netlify.toml` automatically — build
   command and publish directory are already set, nothing to configure
   by hand.
2. **Set one environment variable** in Netlify (Site configuration →
   Environment variables): `VITE_API_URL` — the server's public URL,
   deployed separately (Render, Railway, etc.), e.g.
   `https://breve-server.onrender.com`. No trailing slash. Vite bakes this
   in at build time, so it has to be set *before* the first build runs —
   add it, then trigger a deploy (or redeploy if you already built once
   without it).
3. **Deploy.** `public/_redirects` already handles client-side routing
   (a hard refresh on `/login` or `/dashboard/abc123` needs this, or
   Netlify 404s on it — see that file's own comment for why), and
   `public/_headers` sets caching for the hashed asset files.
4. **Tell the server about this URL.** The backend's CORS check already
   allows any `*.netlify.app` origin automatically, but its `CLIENT_URL`
   env var also needs your real site URL — it's what password-reset
   emails link to, and what CORS falls back to for a custom domain that
   *doesn't* end in `.netlify.app`. Set that on the server's own host
   (see `../../server/README.md`), not here.

### Why login would look broken if you skip step 2

Without `VITE_API_URL` set, a deployed Netlify site quietly keeps
calling `http://localhost:4000` — which doesn't exist from a visitor's
browser. Every request just fails with "Can't reach the server." The
fix is always the same: confirm the env var is set in Netlify, then
redeploy — an env var change alone doesn't rebuild the already-published
site.
