import type { RouteResult } from '../types/metro';
import { getStationName } from '../data/stations';

interface Props {
  route: RouteResult;
}

export default function RoutePanel({ route }: Props) {
  if (!route.segments.length) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
        <p className="text-sm text-slate-600">You are already at your destination.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-100">
        <h2 className="font-semibold text-slate-800">Your Journey</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          {route.interchangeCount === 0
            ? 'Direct · No interchange'
            : `${route.interchangeCount} interchange${route.interchangeCount > 1 ? 's' : ''}`}
          {' · '}
          {route.stations.length - 1} {route.stations.length - 1 === 1 ? 'stop' : 'stops'} total
        </p>
      </div>

      <ol className="px-4 py-3 space-y-0">
        {route.segments.map((seg, idx) => (
          <li key={idx} className="relative">
            {/* Take line */}
            <div className="flex items-start gap-3 py-2">
              <div
                className="mt-0.5 w-5 h-5 rounded-full shrink-0 border-2 border-white shadow"
                style={{ backgroundColor: seg.colour }}
                aria-hidden
              />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-slate-800 text-sm">
                  Take {seg.lineName}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  Direction: <span className="font-medium text-slate-700">{seg.direction}</span>
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  {seg.stations.length - 1} {seg.stations.length - 1 === 1 ? 'stop' : 'stops'}
                </p>
                {idx === 0 && (
                  <p className="text-xs text-emerald-600 mt-1 font-medium">
                    Start at {getStationName(seg.fromStation)}
                  </p>
                )}
              </div>
            </div>

            {/* Change */}
            {idx < route.segments.length - 1 && (
              <div className="flex items-start gap-3 py-2 ml-0.5 border-l-2 border-dashed border-slate-200 pl-5">
                <div className="w-4 h-4 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center text-[10px] shrink-0 -ml-[22px] border border-amber-200">
                  ↻
                </div>
                <div>
                  <p className="text-sm font-medium text-amber-800">
                    Change at {getStationName(route.interchanges[idx])}
                  </p>
                </div>
              </div>
            )}

            {/* Get off on last */}
            {idx === route.segments.length - 1 && (
              <div className="flex items-start gap-3 py-2">
                <div className="w-5 h-5 rounded-full bg-rose-500 shrink-0 flex items-center justify-center text-white text-[10px] font-bold">
                  ●
                </div>
                <p className="text-sm font-semibold text-rose-700">
                  Get off at {getStationName(seg.toStation)}
                </p>
              </div>
            )}
          </li>
        ))}
      </ol>
    </div>
  );
}
