# Metro Map

**Find your Delhi Metro route, instantly and visually.**

A fast, mobile-first Delhi Metro map and route finder. Pick your From and To
stations and see the complete journey on a clean 2D metro navigation map —
with correct line colours, every interchange and the exact train direction —
without studying the full, complicated Delhi Metro route map.

## Features

- **From → To station search** with keyboard navigation and line-colour hints
- **Client-side route calculation** — no backend, no API calls, fewest
  interchanges preferred
- **Clean 2D route map** that shows only the relevant Metro line(s) for your
  journey as a simple, app-like schematic (not the full network diagram) —
  with FROM / DESTINATION pins, every interchange clearly marked, and a
  subtly animated train dot
- **Clear step-by-step instructions** — line to take, direction/terminal
  station, stop count, and exactly where to change trains
- **Share via WhatsApp or copy link** — recipients land on the same route
- **Fully static** — no backend, database, login, or accounts
- **Fast and smooth on mobile** — tiny bundle, pure SVG rendering, no heavy
  3D/WebGL dependency
- **SEO ready** — structured data, sitemap, robots.txt, per-route page titles

## Tech Stack

- React 19 + TypeScript + Vite 6
- Tailwind CSS 4
- Pure SVG route schematic (no 3D/WebGL dependency)
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
  components/     # UI + 2D route map (StationSearch, RouteMap, RoutePanel, ShareButton)
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
coordinates are approximate relative positions used only to preserve each
line's real station order, not precise GPS.

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
