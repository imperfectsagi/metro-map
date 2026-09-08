import type { RouteResult } from '../types/metro';
import { getStationName } from '../data/stations';

interface Props {
  route: RouteResult;
}

// A small set of line emoji swatches so the "Towards" line reads at a glance,
// matching how passengers actually scan platform signage.
function lineDot(colour: string) {
  return (
    <span
      className="inline-block w-3 h-3 rounded-full ring-2 ring-white shadow align-middle"
      style={{ backgroundColor: colour }}
      aria-hidden
    />
  );
}

export default function RoutePanel({ route }: Props) {
  if (!route.segments.length) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm text-center">
        <div className="text-2xl mb-1">📍</div>
        <p className="text-sm text-slate-600 font-medium">You're already at your destination.</p>
      </div>
    );
  }

  const totalStops = route.stations.length - 1;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
        <h2 className="font-semibold text-slate-800">Journey Instructions</h2>
        <p className="text-xs font-medium text-slate-500">
          {route.interchangeCount === 0
            ? 'Direct · no change'
            : `${route.interchangeCount} change${route.interchangeCount > 1 ? 's' : ''}`}
          {' · '}
          {totalStops} {totalStops === 1 ? 'stop' : 'stops'}
        </p>
      </div>

      <div className="px-4 py-4 space-y-3">
        {route.segments.map((seg, idx) => {
          const stopCount = seg.stations.length - 1;
          return (
            <div key={idx}>
              {/* Step card */}
              <div
                className="rounded-xl border overflow-hidden"
                style={{ borderColor: seg.colour + '55' }}
              >
                <div
                  className="px-3.5 py-2 flex items-center gap-2"
                  style={{ backgroundColor: seg.colour }}
                >
                  <span className="text-[11px] font-bold uppercase tracking-wide text-white/90 bg-white/20 rounded-full px-2 py-0.5">
                    Step {idx + 1}
                  </span>
                  <span className="text-white font-bold text-sm truncate">{seg.lineName}</span>
                </div>
                <div className="px-3.5 py-3 bg-white space-y-2">
                  <p className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                    {lineDot(seg.colour)}
                    Towards&nbsp;
                    <span style={{ color: seg.colour }}>{seg.direction.toUpperCase()}</span>
                  </p>
                  <p className="text-sm text-slate-600">
                    <span className="font-semibold text-slate-800">{getStationName(seg.fromStation)}</span>
                    <span className="mx-1.5 text-slate-400">→</span>
                    <span className="font-semibold text-slate-800">{getStationName(seg.toStation)}</span>
                  </p>
                  <p className="text-xs text-slate-500">
                    {stopCount} {stopCount === 1 ? 'stop' : 'stops'} on this line
                  </p>
                  {idx === 0 && (
                    <p className="text-xs font-semibold text-emerald-600 flex items-center gap-1 pt-0.5">
                      🟢 Board at {getStationName(seg.fromStation)}
                    </p>
                  )}
                </div>
              </div>

              {/* Change instruction */}
              {idx < route.segments.length - 1 && (
                <div className="flex items-center gap-2.5 my-2 pl-1">
                  <div className="w-7 h-7 rounded-full bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-700 text-sm shrink-0">
                    🔄
                  </div>
                  <p className="text-sm font-semibold text-amber-800">
                    Change at {getStationName(route.interchanges[idx])}
                  </p>
                </div>
              )}

              {/* Arrival */}
              {idx === route.segments.length - 1 && (
                <div className="flex items-center gap-2.5 mt-2.5 pl-1">
                  <div className="w-7 h-7 rounded-full bg-rose-100 border border-rose-300 flex items-center justify-center text-rose-600 text-sm shrink-0">
                    🎯
                  </div>
                  <p className="text-sm font-bold text-rose-700">
                    Arrive at {getStationName(seg.toStation)}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
