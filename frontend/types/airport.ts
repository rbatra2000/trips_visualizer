export interface Airport {
  id: number;
  name: string;
  city: string;
  country: string;
  iata: string;
  icao: string;
  lat: number;
  long: number;
  alt: number;
  timezone: number | string;
  dst: string;
  timezone2: string;
  type: string;
  source: string;
}
