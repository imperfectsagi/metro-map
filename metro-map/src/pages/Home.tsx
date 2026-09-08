import { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import { useSearchParams } from 'react-router-dom';
import StationSearch from '../components/StationSearch';
import RoutePanel from '../components/RoutePanel';
import ShareButton from '../components/ShareButton';
import { findRoute, getAllStationOptions } from '../algorithms/routeFinder';
import type { RouteResult } from '../types/metro';
import { getStationName } from '../data/stations';
import { buildRouteUrl } from '../utils/routeUrl';

const MetroScene = lazy(() => import('../components/MetroScene'));

const stationOptions = getAllStationOptions();

export default function Home() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [fromId, setFromId] = useState<string>('');
  const [toId, setToId] = useState<string>('');
  const [route, setRoute] = useState<RouteResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showMap, setShowMap] = useState(false);

  // Handle shared URL (e.g. ?from=rajiv-chowk&to=hauz-khas), works on both / and /route
  useEffect(() => {
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    if (from && to) {
      setFromId(from);
      setToId(to);
      calculateRoute(from, to);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const calculateRoute = useCallback((f: string, t: string) => {
    if (!f || !t) {
      setError('Please select both stations.');
      return;
    }
    if (f === t) {
      setError('From and To stations are the same.');
      return;
    }
    setLoading(true);
    setError(null);
    setRoute(null);
    // slight delay for UX
    setTimeout(() => {
      const result = findRoute(f, t);
      setLoading(false);
      if (!result) {
        setError("We couldn't find a route between these stations. Please check the station names.");
        setShowMap(false);
      } else {
        setRoute(result);
        setShowMap(true);
        // update URL without reload
        setSearchParams({ from: f, to: t }, { replace: true });
      }
    }, 180);
  }, [setSearchParams]);

  const handleShowRoute = () => {
    calculateRoute(fromId, toId);
  };

  const handleSwap = () => {
    setFromId(toId);
    setToId(fromId);
    setRoute(null);
    setShowMap(false);
    setError(null);
  };

  const fromName = fromId ? getStationName(fromId) : '';
  const toName = toId ? getStationName(toId) : '';

  useEffect(() => {
    if (route && fromName && toName) {
      document.title = `${fromName} to ${toName} — Delhi Metro Route | Metro Map`;
    } else {
      document.title = 'Delhi Metro Map & Route Finder — Metro Map';
    }
  }, [route, fromName, toName]);

  return (
    <div className="min-h-dvh flex flex-col bg-slate-50 text-slate-900">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur border-b border-slate-200 px-4 py-3">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight flex items-center gap-1.5">
              <span aria-hidden>🚇</span> Metro Map
            </h1>
            <p className="text-xs text-slate-500">Understand your Metro journey visually.</p>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col max-w-lg mx-auto w-full">
        {/* Search Card */}
        <section className="px-4 pt-5 pb-3">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                From
              </label>
              <StationSearch
                value={fromId}
                onChange={setFromId}
                options={stationOptions}
                placeholder="Search station"
                ariaLabel="From station"
              />
            </div>

            <div className="flex justify-center -my-1">
              <button
                type="button"
                onClick={handleSwap}
                className="w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 active:scale-95 transition flex items-center justify-center text-lg"
                aria-label="Swap stations"
              >
                ↔
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                To
              </label>
              <StationSearch
                value={toId}
                onChange={setToId}
                options={stationOptions}
                placeholder="Search station"
                ariaLabel="To station"
              />
            </div>

            <button
              type="button"
              onClick={handleShowRoute}
              disabled={loading || !fromId || !toId}
              className="w-full py-3.5 rounded-xl bg-slate-900 text-white font-semibold text-base
                         disabled:opacity-40 disabled:cursor-not-allowed
                         active:scale-[0.98] transition shadow-md"
            >
              {loading ? 'Finding route…' : 'Show Route'}
            </button>

            {error && (
              <p className="text-sm text-red-600 text-center px-2" role="alert">
                {error}
              </p>
            )}
          </div>
        </section>

        {/* 3D Map */}
        {showMap && route && (
          <section className="relative flex-1 min-h-[45vh] bg-slate-900 mx-0">
            <Suspense
              fallback={
                <div className="absolute inset-0 flex items-center justify-center text-white/70 text-sm">
                  Loading map…
                </div>
              }
            >
              <MetroScene route={route} />
            </Suspense>
          </section>
        )}

        {/* Route Panel */}
        {route && (
          <section className="px-4 pb-6 pt-2">
            <RoutePanel route={route} />
            <div className="mt-3">
              <ShareButton
                fromName={fromName}
                toName={toName}
                url={buildRouteUrl(route.from, route.to)}
              />
            </div>
          </section>
        )}

        {/* SEO content (visible but secondary) */}
        {!showMap && (
          <section className="px-4 py-8 text-slate-600 text-sm leading-relaxed">
            <h2 className="text-base font-semibold text-slate-800 mb-2">Delhi Metro Map & Route Finder</h2>
            <p className="mb-3">
              Metro Map is a free Delhi Metro route finder. Pick your From and To stations to see the
              best Delhi Metro route with correct line colours, interchange stations and direction —
              shown on a clear interactive 3D metro map, without studying a complicated wall map.
            </p>
            <p className="mb-3">
              Covers all operational Delhi Metro lines: Red, Yellow, Blue, Green, Violet, Pink, Magenta,
              Grey and the Airport Express, across Delhi, Noida, Gurugram and Faridabad.
            </p>
            <p>
              Once your route is ready, share it instantly with friends and family on WhatsApp or copy
              the link — no sign-up needed.
            </p>
          </section>
        )}
      </main>

      {/* Subtle footer */}
      <footer className="mt-auto border-t border-slate-200 bg-white px-4 py-4 text-center text-xs text-slate-400">
        <p>Developed by Brand Launch Studio</p>
        <p className="mt-1 space-x-2">
          <a href="https://instagram.com/bigfootkrampus" target="_blank" rel="noopener noreferrer" className="hover:text-slate-600">
            @bigfootkrampus
          </a>
          <span>·</span>
          <a href="tel:+918595395788" className="hover:text-slate-600">+91 8595395788</a>
          <span>·</span>
          <a href="mailto:deepak@brandlaunchstudio.online" className="hover:text-slate-600">
            deepak@brandlaunchstudio.online
          </a>
        </p>
      </footer>
    </div>
  );
}
