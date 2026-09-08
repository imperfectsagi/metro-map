# Deployment Guide

Metro Map is a fully static site (React + Vite build output) — no backend,
no environment variables, and no database required. It can be deployed to
any static host. Below are instructions for the two most common choices.

## Before you deploy

Update the placeholder production domain (`https://metromap.app`) in these
three files to your real domain, so SEO tags and the sitemap are correct:

- `index.html` — `<link rel="canonical">`, Open Graph `og:url`, and the
  JSON-LD `url` field
- `public/robots.txt` — the `Sitemap:` line
- `public/sitemap.xml` — the `<loc>` value

## Option A — Vercel

1. Push this project to a GitHub/GitLab/Bitbucket repository.
2. In Vercel, click **Add New → Project** and import the repository.
3. Framework preset: **Vite** (auto-detected).
   - Build command: `npm run build`
   - Output directory: `dist`
4. Deploy. A `vercel.json` is already included in the project which:
   - Rewrites all routes to `index.html` (required for the client-side
     `/route` path and shared links to work on refresh)
   - Adds long-term caching headers for hashed static assets

No environment variables are needed.

### Vercel CLI (alternative)

```bash
npm install -g vercel
vercel --prod
```

## Option B — Netlify

1. Push this project to a Git repository, or drag-and-drop the `dist/`
   folder directly onto Netlify for a one-off deploy.
2. If connecting a repository:
   - Build command: `npm run build`
   - Publish directory: `dist`
3. A `netlify.toml` is already included in the project, which sets the
   build command/publish directory and adds the SPA redirect rule
   (`/* → /index.html`, status 200) so shared route links and page
   refreshes work correctly.

### Netlify CLI (alternative)

```bash
npm install -g netlify-cli
npm run build
netlify deploy --prod --dir=dist
```

## Option C — Any other static host

```bash
npm install
npm run build
```

Upload the contents of `dist/` to your host. The only requirement is that
**all paths must fall back to `index.html`** (SPA rewrite), since routing
(the `/route` path used for shared links) happens client-side. Consult your
host's documentation for "SPA fallback" or "rewrite rules" if it isn't
Vercel or Netlify.

## Verifying after deploy

- Open the live URL and confirm the search UI loads instantly.
- Pick two stations, tap **Show Route**, and confirm the 2D route map and
  step-by-step instructions appear.
- Tap **Copy Link**, open it in a new private/incognito tab, and confirm the
  same route loads automatically (this tests the SPA rewrite rule).
- Check `/robots.txt` and `/sitemap.xml` are reachable at your domain.
