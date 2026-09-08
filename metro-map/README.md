# Metro Map

**Find your Delhi Metro route, instantly and visually.**

A fast, mobile-first Delhi Metro route finder. Pick your From and To stations
and see the complete journey on an interactive 3D map — with correct line
colours, interchange stations and direction — without studying a complicated
wall map.

## Features

- **From → To station search** with keyboard navigation and line-colour hints
- **Client-side route calculation** — no backend, no API calls, fewest
  interchanges preferred
- **Interactive 3D route visualisation** (Three.js) with irrelevant lines and
  stations faded out so the journey is never confusing
- **Clear step-by-step instructions** — line to take, direction, stop count,
  and exactly where to change trains
- **Share via WhatsApp or copy link** — recipients land on the same route
- **Fully static** — no backend, database, login, or accounts
- **Fast and smooth on mobile** — small initial bundle, 3D scene is lazy
  loaded only after a route is found
- **SEO ready** — structured data, sitemap, robots.txt, per-route page titles

## Tech Stack

- React 19 + TypeScript + Vite 6
- Tailwind CSS 4
- Three.js (3D route rendering)
- Static JSON metro data — no server required

## Local Development

```bash
npm install
npm run dev
```

Open http://localhost:5173

## Production Build

```bash
npm run build
npm run preview
```

The build outputs static files to `dist/`. See **DEPLOY.md** for deployment
instructions (Vercel / Netlify).

## Linting & Type-checking

```bash
npm run lint    # oxlint
npx tsc -b      # type-check only
```

## Project Structure

```
src/
  components/     # UI + 3D scene (StationSearch, MetroScene, RoutePanel, ShareButton)
  data/           # Metro line data (metro-data.json) & station positions (stations.ts)
  algorithms/     # Client-side route finder (BFS, minimises interchanges)
  types/          # Shared TypeScript types
  utils/          # Route URL building / sharing helpers
  pages/          # Home page (the entire app is a single page)
```

## Data

Metro line sequences and interchanges are based on the operational DMRC
network (2026 snapshot), covering Red, Yellow, Blue (+ branch), Green
(+ branch), Violet, Pink (+ spur), Magenta (+ north extension), Grey and the
Airport Express — across Delhi, Noida, Gurugram and Faridabad. Station
coordinates used for the 3D layout are approximate relative positions for
visualisation, not precise GPS.

## Notes for maintainers

- Before deploying, update the placeholder domain (`metromap.app`) in
  `index.html`, `public/robots.txt` and `public/sitemap.xml` to your real
  production domain.
- Do not add a backend, database, accounts, fare/time calculation, booking,
  ads, or extra pages — this project is intentionally a single-page static
  tool by design.

## Licence

Private project.

---

Developed by Brand Launch Studio · [@bigfootkrampus](https://instagram.com/bigfootkrampus) · +91 8595395788 · deepak@brandlaunchstudio.online
