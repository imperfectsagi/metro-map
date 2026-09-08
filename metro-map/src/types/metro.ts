export interface Station {
  id: string;
  name: string;
  lat: number;
  lng: number;
  lines: string[];
}

export interface Line {
  id: string;
  name: string;
  colour: string;
  stations: string[]; // ordered station ids
}

export interface Edge {
  from: string;
  to: string;
  line: string;
}

export interface Interchange {
  station: string;
  lines: string[];
}

export interface MetroData {
  stations: Station[];
  lines: Line[];
  edges: Edge[];
  interchanges: Interchange[];
}

export interface RouteSegment {
  lineId: string;
  lineName: string;
  colour: string;
  direction: string; // terminus name
  stations: string[]; // ordered station ids in this segment
  fromStation: string;
  toStation: string;
}

export interface RouteResult {
  from: string;
  to: string;
  stations: string[]; // full ordered path
  segments: RouteSegment[];
  interchanges: string[];
  interchangeCount: number;
}
