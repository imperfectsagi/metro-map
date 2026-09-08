import { useEffect, useMemo, useRef, useState, type ReactElement } from 'react';
import type { RouteResult } from '../types/metro';
import { getStationById } from '../data/stations';

interface Props {
  route: RouteResult;
}

/* ---------- Layout constants ---------- */
const ROW_H = 64; // vertical space per station
const PAD_TOP = 40;
const PAD_BOTTOM = 36;
const RAIL_X = 44; // x position of the vertical line rail
const LABEL_X = 76; // x position where station labels start
const BANNER_H = 58; // height of the "line + direction" banner above each segment
const CHANGE_H = 46; // height of the interchange connector row
const VIEW_W = 360; // schematic viewBox width (mobile-first, scales via SVG)

type Row =
  | { kind: 'banner'; segIndex: number; y: number }
  | { kind: 'station'; segIndex: number; stationId: string; y: number; isFirst: boolean; isLast: boolean; isGlobalFirst: boolean; isGlobalLast: boolean }
  | { kind: 'change'; segIndex: number; y: number };

function readableTextColour(hex: string): string {
  const c = hex.replace('#', '');
  if (c.length !== 6) return '#0f172a';
  const r = parseInt(c.slice(0, 2), 16);
  const g = parseInt(c.slice(2, 4), 16);
  const b = parseInt(c.slice(4, 6), 16);
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return lum > 0.62 ? '#0f172a' : '#ffffff';
}

export default function RouteMap({ route }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [trainProgress, setTrainProgress] = useState(0);

  const singleStation = route.segments.length === 0;

  // Build the row layout: banner -> stations -> change -> banner -> stations ... -> end
  const { rows, totalHeight, segStopCounts } = useMemo(() => {
    const rows: Row[] = [];
    let y = PAD_TOP;
    const stopCounts: number[] = [];

    if (singleStation) {
      rows.push({
        kind: 'station',
        segIndex: 0,
        stationId: route.from,
        y,
        isFirst: true,
        isLast: true,
        isGlobalFirst: true,
        isGlobalLast: true,
      });
      y += ROW_H;
      return { rows, totalHeight: y + PAD_BOTTOM, segStopCounts: [0] };
    }

    route.segments.forEach((seg, segIndex) => {
      rows.push({ kind: 'banner', segIndex, y });
      y += BANNER_H;

      seg.stations.forEach((sid, i) => {
        rows.push({
          kind: 'station',
          segIndex,
          stationId: sid,
          y,
          isFirst: i === 0,
          isLast: i === seg.stations.length - 1,
          isGlobalFirst: segIndex === 0 && i === 0,
          isGlobalLast: segIndex === route.segments.length - 1 && i === seg.stations.length - 1,
        });
        y += ROW_H;
      });
      stopCounts.push(seg.stations.length - 1);

      if (segIndex < route.segments.length - 1) {
        rows.push({ kind: 'change', segIndex, y });
        y += CHANGE_H;
      }
    });

    return { rows, totalHeight: y + PAD_BOTTOM, segStopCounts: stopCounts };
  }, [route, singleStation]);

  // Station-row y positions only, in path order (for the train dot + rail path)
  const stationRows = useMemo(() => rows.filter((r): r is Extract<Row, { kind: 'station' }> => r.kind === 'station'), [rows]);

  // Entrance + train animation. Component is remounted (keyed) per route by
  // the parent, so state starts fresh — this effect only needs to drive rAF.
  useEffect(() => {
    const raf = requestAnimationFrame(() => setVisible(true));
    let raf2 = 0;
    const start = performance.now() + 550;
    const duration = Math.min(5200, Math.max(1800, stationRows.length * 260));
    const tick = (t: number) => {
      const elapsed = t - start;
      if (elapsed < 0) {
        raf2 = requestAnimationFrame(tick);
        return;
      }
      const p = Math.min(1, elapsed / duration);
      setTrainProgress(p);
      if (p < 1) raf2 = requestAnimationFrame(tick);
    };
    raf2 = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      cancelAnimationFrame(raf2);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stationRows.length]);

  if (singleStation) {
    const s = getStationById(route.from);
    return (
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-8 text-center">
        <div className="text-3xl mb-2">📍</div>
        <p className="font-semibold text-slate-800">{s?.name ?? route.from}</p>
        <p className="text-sm text-slate-500 mt-1">You're already here.</p>
      </div>
    );
  }

  // Compute train dot position along stationRows using trainProgress
  const trainPos = (() => {
    if (stationRows.length < 2) return null;
    const exact = trainProgress * (stationRows.length - 1);
    const i0 = Math.floor(exact);
    const i1 = Math.min(stationRows.length - 1, i0 + 1);
    const frac = exact - i0;
    const y = stationRows[i0].y + (stationRows[i1].y - stationRows[i0].y) * frac;
    const seg = route.segments[stationRows[i0].segIndex];
    return { y, colour: seg.colour };
  })();

  return (
    <div className="rounded-2xl border border-slate-200 bg-gradient-to-b from-slate-50 to-white shadow-sm overflow-hidden">
      {/* Header strip: quick glance summary */}
      <div className="px-4 pt-3.5 pb-2.5 border-b border-slate-100 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          {route.segments.map((seg, i) => (
            <span key={i} className="flex items-center gap-1.5 shrink-0">
              <span
                className="w-2.5 h-2.5 rounded-full ring-2 ring-white shadow-sm"
                style={{ backgroundColor: seg.colour }}
                aria-hidden
              />
              {i < route.segments.length - 1 && <span className="text-slate-300 text-xs">→</span>}
            </span>
          ))}
        </div>
        <p className="text-[11px] font-medium text-slate-400 shrink-0">
          {route.interchangeCount === 0
            ? 'Direct route'
            : `${route.interchangeCount} change${route.interchangeCount > 1 ? 's' : ''}`}
        </p>
      </div>

      {/* Scrollable schematic */}
      <div
        ref={containerRef}
        className="overflow-y-auto overscroll-contain"
        style={{ maxHeight: '62vh' }}
      >
        <svg
          viewBox={`0 0 ${VIEW_W} ${totalHeight}`}
          width="100%"
          height={totalHeight}
          role="img"
          aria-label={`Route map from ${getStationById(route.from)?.name} to ${getStationById(route.to)?.name}`}
          className={`block transition-opacity duration-500 ${visible ? 'opacity-100' : 'opacity-0'}`}
        >
          <defs>
            <filter id="pinShadow" x="-50%" y="-50%" width="200%" height="200%">
              <feDropShadow dx="0" dy="1.5" stdDeviation="1.5" floodColor="#0f172a" floodOpacity="0.28" />
            </filter>
          </defs>

          {/* Rails: one per segment, drawn+animated as a growing line */}
          {route.segments.map((seg, segIndex) => {
            const segRows = stationRows.filter((r) => r.segIndex === segIndex);
            if (segRows.length < 2) return null;
            const y1 = segRows[0].y;
            const y2 = segRows[segRows.length - 1].y;
            return (
              <line
                key={segIndex}
                x1={RAIL_X}
                y1={y1}
                x2={RAIL_X}
                y2={y2}
                stroke={seg.colour}
                strokeWidth={6}
                strokeLinecap="round"
                style={{
                  transition: `stroke-dashoffset 900ms cubic-bezier(0.22,1,0.36,1) ${segIndex * 140 + 200}ms`,
                  strokeDasharray: y2 - y1,
                  strokeDashoffset: visible ? 0 : y2 - y1,
                }}
              />
            );
          })}

          {/* Interchange connector dashes between segments */}
          {rows
            .filter((r): r is Extract<Row, { kind: 'change' }> => r.kind === 'change')
            .map((r, idx) => (
              <line
                key={`chg-${idx}`}
                x1={RAIL_X}
                y1={r.y - 2}
                x2={RAIL_X}
                y2={r.y + CHANGE_H + 2}
                stroke="#cbd5e1"
                strokeWidth={3}
                strokeDasharray="1.5 7"
                strokeLinecap="round"
              />
            ))}

          {/* Row content */}
          {rows.map((r, idx) => {
            if (r.kind === 'banner') {
              const seg = route.segments[r.segIndex];
              const txtColour = readableTextColour(seg.colour);
              return (
                <g
                  key={`b-${idx}`}
                  style={{
                    transition: `opacity 420ms ease ${r.segIndex * 140}ms, transform 420ms cubic-bezier(0.22,1,0.36,1) ${r.segIndex * 140}ms`,
                    opacity: visible ? 1 : 0,
                    transform: visible ? 'translateY(0)' : 'translateY(6px)',
                  }}
                >
                  <rect
                    x={12}
                    y={r.y}
                    width={VIEW_W - 24}
                    height={BANNER_H - 14}
                    rx={12}
                    fill={seg.colour}
                  />
                  <text x={26} y={r.y + 21} fontSize={13} fontWeight={800} fill={txtColour}>
                    {seg.lineName}
                  </text>
                  <text x={26} y={r.y + 37} fontSize={11.5} fontWeight={600} fill={txtColour} opacity={0.92}>
                    {`Towards ${seg.direction.toUpperCase()}`}
                  </text>
                  <text
                    x={VIEW_W - 26}
                    y={r.y + 29}
                    fontSize={10.5}
                    fontWeight={700}
                    fill={txtColour}
                    textAnchor="end"
                    opacity={0.85}
                  >
                    {segStopCounts[r.segIndex]} {segStopCounts[r.segIndex] === 1 ? 'stop' : 'stops'}
                  </text>
                </g>
              );
            }

            if (r.kind === 'change') {
              const toSeg = route.segments[r.segIndex + 1];
              const stationName = getStationById(route.interchanges[r.segIndex])?.name ?? route.interchanges[r.segIndex];
              return (
                <g key={`c-${idx}`} opacity={visible ? 1 : 0} style={{ transition: `opacity 400ms ease ${r.segIndex * 160 + 300}ms` }}>
                  <rect x={64} y={r.y + 2} width={VIEW_W - 88} height={CHANGE_H - 8} rx={10} fill="#fffbeb" stroke="#fde68a" />
                  <text x={78} y={r.y + 20} fontSize={10} fontWeight={700} fill="#92400e">
                    ⇄ CHANGE AT {stationName.toUpperCase()}
                  </text>
                  <circle cx={82} cy={r.y + 33} r={4.5} fill={toSeg.colour} />
                  <text x={91} y={r.y + 36} fontSize={10.5} fontWeight={700} fill="#78350f">
                    {`Board ${toSeg.lineName}`}
                  </text>
                </g>
              );
            }

            // station row
            const station = getStationById(r.stationId);
            const seg = route.segments[r.segIndex];
            const isTerminal = r.isGlobalFirst || r.isGlobalLast;
            const isChangePoint = r.isLast && !r.isGlobalLast;
            const delay = idx * 26 + 260;

            let marker: ReactElement;
            if (r.isGlobalFirst) {
              marker = (
                <g filter="url(#pinShadow)">
                  <circle cx={RAIL_X} cy={r.y} r={9} fill="#10b981" stroke="#fff" strokeWidth={3} />
                  <circle cx={RAIL_X} cy={r.y} r={3} fill="#fff" />
                </g>
              );
            } else if (r.isGlobalLast) {
              marker = (
                <g filter="url(#pinShadow)">
                  <circle cx={RAIL_X} cy={r.y} r={10} fill="#ef4444" stroke="#fff" strokeWidth={3} />
                  <text x={RAIL_X} y={r.y + 3.5} fontSize={9} textAnchor="middle" fill="#fff">
                    🎯
                  </text>
                </g>
              );
            } else if (isChangePoint) {
              marker = (
                <g filter="url(#pinShadow)">
                  <circle cx={RAIL_X} cy={r.y} r={8} fill="#fff" stroke={seg.colour} strokeWidth={4} />
                </g>
              );
            } else {
              marker = <circle cx={RAIL_X} cy={r.y} r={4.5} fill="#fff" stroke={seg.colour} strokeWidth={3} />;
            }

            return (
              <g
                key={`s-${idx}`}
                style={{
                  transition: `opacity 380ms ease ${delay}ms, transform 380ms cubic-bezier(0.22,1,0.36,1) ${delay}ms`,
                  opacity: visible ? 1 : 0,
                  transform: visible ? 'translateX(0)' : 'translateX(-6px)',
                }}
              >
                {marker}
                <text
                  x={LABEL_X}
                  y={r.y + 4}
                  fontSize={isTerminal ? 13.5 : 12}
                  fontWeight={isTerminal ? 800 : isChangePoint ? 700 : 500}
                  fill={isTerminal ? '#0f172a' : isChangePoint ? '#0f172a' : '#475569'}
                >
                  {station?.name ?? r.stationId}
                </text>
                {r.isGlobalFirst && (
                  <text x={LABEL_X} y={r.y + 18} fontSize={9.5} fontWeight={700} fill="#059669">
                    START
                  </text>
                )}
                {r.isGlobalLast && (
                  <text x={LABEL_X} y={r.y + 18} fontSize={9.5} fontWeight={700} fill="#dc2626">
                    DESTINATION
                  </text>
                )}
                {isChangePoint && (
                  <text x={LABEL_X} y={r.y + 18} fontSize={9.5} fontWeight={700} fill={seg.colour}>
                    INTERCHANGE
                  </text>
                )}
              </g>
            );
          })}

          {/* Animated train dot */}
          {trainPos && (
            <g style={{ transition: 'opacity 300ms ease' }} opacity={visible ? 1 : 0}>
              <circle cx={RAIL_X} cy={trainPos.y} r={13} fill={trainPos.colour} opacity={0.18} />
              <circle cx={RAIL_X} cy={trainPos.y} r={7} fill="#fff" stroke={trainPos.colour} strokeWidth={3.5} />
            </g>
          )}
        </svg>
      </div>
    </div>
  );
}
