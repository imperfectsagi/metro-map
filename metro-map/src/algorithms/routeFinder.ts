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

/**
 * Find route preferring fewer interchanges.
 * Uses BFS with state = (station, currentLine, interchanges)
 * Cost primarily by interchanges, then by hops.
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
    path: { station: string; line: string }[];
  }

  const visited = new Map<string, number>(); // key -> best interchanges
  const queue: Node[] = [];

  // Start: no line yet
  queue.push({
    station: fromId,
    line: '',
    interchanges: 0,
    path: [{ station: fromId, line: '' }],
  });
  visited.set(`${fromId}|`, 0);

  let best: Node | null = null;

  while (queue.length > 0) {
    // Simple priority: prefer lower interchanges (sort occasionally or use deque)
    queue.sort((a, b) => a.interchanges - b.interchanges || a.path.length - b.path.length);
    const current = queue.shift()!;

    if (current.station === toId) {
      if (!best || current.interchanges < best.interchanges || 
          (current.interchanges === best.interchanges && current.path.length < best.path.length)) {
        best = current;
      }
      // continue to find possibly better
      if (current.interchanges === 0) break; // optimal
      continue;
    }

    const neighbors = graph.get(current.station) || [];
    for (const { to, line } of neighbors) {
      let newInterchanges = current.interchanges;
      if (current.line && current.line !== line) {
        newInterchanges += 1;
      }
      // Soft limit to avoid too long routes
      if (newInterchanges > 4) continue;

      const key = `${to}|${line}`;
      const prevBest = visited.get(key);
      if (prevBest !== undefined && prevBest <= newInterchanges) continue;
      visited.set(key, newInterchanges);

      queue.push({
        station: to,
        line,
        interchanges: newInterchanges,
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
