export interface Trip {
  id: string;
  name: string;
  stops: string[]; // Array of IATA codes
  from: Date;      // Start date
  to: Date;        // End date
  tags?: string[];
  color?: string;
}

export interface Route {
  src: string;     // Source IATA code
  dest: string;    // Destination IATA code
  date: Date;
}

export interface RouteWithCoordinates extends Route {
  name_src: string;
  lat_src: number;
  long_src: number;
  name_dest: string;
  lat_dest: number;
  long_dest: number;
  tripName: string;
  tripColor: string;
}
