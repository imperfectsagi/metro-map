import type { Line, RouteResult, RouteSegment } from '../types/metro';
import metroData from '../data/metro-data.json';
import { getStationName } from '../data/stations';

// Build adjacency graph: stationId -> list of {neighbor, lineId}
type GraphEdge = { to: string; line: string };
const graph = new Map<string, GraphEdge[]>();

function buildGraph() {
  if (graph.size > 0) return;
  for (const line of metroData.lines as Line[]) {
    const stations = line.stations;
    for (let i = 0; i < stations.length - 1; i++) {
      const a = stations[i];
      const b = stations[i + 1];
      if (!graph.has(a)) graph.set(a, []);
      if (!graph.has(b)) graph.set(b, []);
      graph.get(a)!.push({ to: b, line: line.id });
      graph.get(b)!.push({ to: a, line: line.id });
    }
  }
}

function getLineInfo(lineId: string): Line | undefined {
  return (metroData.lines as Line[]).find((l) => l.id === lineId);
}

function getDirection(lineId: string, fromStation: string, toStation: string): string {
  const line = getLineInfo(lineId);
  if (!line) return '';
  const stations = line.stations;
  const fromIdx = stations.indexOf(fromStation);
  const toIdx = stations.indexOf(toStation);
  if (fromIdx === -1 || toIdx === -1) return '';
  // Direction is the terminus toward which we are traveling
  if (toIdx > fromIdx) {
    return getStationName(stations[stations.length - 1]);
  } else {
    return getStationName(stations[0]);
  }
}

// How many "extra stops" a single interchange is considered worth.
// Tuned so that swapping one interchange for a modest stop-count saving
// is worthwhile, but an interchange isn't so cheap that the algorithm
// starts hopping lines for a single-stop shortcut (which would produce
// jittery, unrealistic-looking routes and eat into the walking/waiting
// time an interchange actually costs a passenger).
//
// score = interchanges * INTERCHANGE_PENALTY + totalStops
//
// e.g. a 14-stop / 2-change route scores 2*4 + 14 = 22
//      an  8-stop / 3-change route scores 3*4 +  8 = 20  -> now correctly wins
const INTERCHANGE_PENALTY = 4;

/**
 * Find the best route between two stations using a hybrid cost that
 * balances interchange count against total stops travelled, so a route
 * with fewer changes isn't automatically preferred over a genuinely
 * shorter/faster one.
 *
 * Uses Dijkstra-style search with state = (station, currentLine,
 * interchangesSoFar), where the running cost is
 * `interchanges * INTERCHANGE_PENALTY + stopsSoFar`. Interchange count is
 * tracked as part of the state key (not just folded into the cost) because
 * it's also a capped resource — see the note above `visited` below for why
 * that matters for correctness. This is a proper shortest-path search
 * (priority queue, no early-exit heuristics that could skip a lower-cost
 * path), so the first time we pop the destination off the frontier we have
 * the true minimum-cost route.
 */
export function findRoute(fromId: string, toId: string): RouteResult | null {
  buildGraph();
  if (fromId === toId) {
    return {
      from: fromId,
      to: toId,
      stations: [fromId],
      segments: [],
      interchanges: [],
      interchangeCount: 0,
    };
  }
  if (!graph.has(fromId) || !graph.has(toId)) return null;

  // State: stationId|lineId (lineId can be '' for start)
  // We track path as list of {station, line}
  interface Node {
    station: string;
    line: string;
    interchanges: number;
    stops: number; // total stops travelled so far (edges taken)
    score: number; // interchanges * INTERCHANGE_PENALTY + stops
    path: { station: string; line: string }[];
  }

  // Key includes `interchanges` alongside (station, line). Interchange
  // count isn't just part of the cost — it's a capped resource (see the
  // `newInterchanges > 4` guard below), so a state that has spent FEWER
  // interchanges to reach a station can still unlock cheaper continuations
  // that a lower-score-but-interchange-heavier state at the same station
  // cannot reach (it may already be at the cap). Pruning on score alone
  // per (station, line) would incorrectly discard those still-flexible
  // states — keying on interchange count too keeps the search admissible.
  const visited = new Map<string, number>(); // key -> best score seen
  const queue: Node[] = [];

  // Start: no line yet
  queue.push({
    station: fromId,
    line: '',
    interchanges: 0,
    stops: 0,
    score: 0,
    path: [{ station: fromId, line: '' }],
  });
  visited.set(`${fromId}|0|`, 0);

  let best: Node | null = null;

  while (queue.length > 0) {
    // Priority: lowest hybrid score first (Dijkstra frontier order).
    // Tie-break on fewer stops so equally-scored routes still prefer the
    // physically shorter one.
    queue.sort((a, b) => a.score - b.score || a.stops - b.stops);
    const current = queue.shift()!;

    if (current.station === toId) {
      // First time we pop the destination, it's the true minimum-cost
      // route (Dijkstra guarantee) — no need to keep searching.
      best = current;
      break;
    }

    const neighbors = graph.get(current.station) || [];
    for (const { to, line } of neighbors) {
      const isInterchange = current.line !== '' && current.line !== line;
      const newInterchanges = current.interchanges + (isInterchange ? 1 : 0);
      const newStops = current.stops + 1;
      const newScore = newInterchanges * INTERCHANGE_PENALTY + newStops;

      // Soft limit to avoid absurd routes ballooning search space
      if (newInterchanges > 4) continue;

      const key = `${to}|${newInterchanges}|${line}`;
      const prevBest = visited.get(key);
      if (prevBest !== undefined && prevBest <= newScore) continue;
      visited.set(key, newScore);

      queue.push({
        station: to,
        line,
        interchanges: newInterchanges,
        stops: newStops,
        score: newScore,
        path: [...current.path, { station: to, line }],
      });
    }
  }

  if (!best) return null;

  // Reconstruct segments
  const path = best.path;
  const stations = path.map((p) => p.station);
  const segments: RouteSegment[] = [];
  const interchanges: string[] = [];

  let segStart = 0;
  let currentLine = path[1]?.line || '';

  for (let i = 1; i < path.length; i++) {
    const p = path[i];
    if (p.line !== currentLine) {
      // close previous segment
      if (currentLine) {
        const segStations = stations.slice(segStart, i);
        const lineInfo = getLineInfo(currentLine)!;
        segments.push({
          lineId: currentLine,
          lineName: lineInfo.name,
          colour: lineInfo.colour,
          direction: getDirection(currentLine, segStations[0], segStations[segStations.length - 1]),
          stations: segStations,
          fromStation: segStations[0],
          toStation: segStations[segStations.length - 1],
        });
        interchanges.push(stations[i - 1]);
      }
      segStart = i - 1;
      currentLine = p.line;
    }
  }
  // last segment
  if (currentLine) {
    const segStations = stations.slice(segStart);
    const lineInfo = getLineInfo(currentLine)!;
    segments.push({
      lineId: currentLine,
      lineName: lineInfo.name,
      colour: lineInfo.colour,
      direction: getDirection(currentLine, segStations[0], segStations[segStations.length - 1]),
      stations: segStations,
      fromStation: segStations[0],
      toStation: segStations[segStations.length - 1],
    });
  }

  return {
    from: fromId,
    to: toId,
    stations,
    segments,
    interchanges,
    interchangeCount: interchanges.length,
  };
}

export function getAllStationOptions(): { id: string; name: string; colours: string[] }[] {
  const seen = new Map<string, string[]>();
  for (const line of metroData.lines as Line[]) {
    for (const sid of line.stations) {
      const list = seen.get(sid) ?? [];
      if (!list.includes(line.colour)) list.push(line.colour);
      seen.set(sid, list);
    }
  }
  const options = Array.from(seen.entries()).map(([id, colours]) => ({
    id,
    name: getStationName(id),
    colours,
  }));
  return options.sort((a, b) => a.name.localeCompare(b.name));
}
