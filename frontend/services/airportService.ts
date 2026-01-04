import { Airport } from '@/types/airport';

class AirportService {
  private airports: Map<string, Airport> = new Map();
  private loaded = false;

  async loadAirports(): Promise<void> {
    if (this.loaded) return;

    try {
      // Fetch airports.dat from public directory
      const response = await fetch('/data/airports.dat');
      if (!response.ok) {
        throw new Error(`Failed to load airports: ${response.statusText}`);
      }

      const text = await response.text();
      const lines = text.split('\n');

      for (const line of lines) {
        if (!line.trim()) continue;

        const parts = line.split(',');
        if (parts.length < 14) continue;

        const airport: Airport = {
          id: parseInt(parts[0]),
          name: parts[1].replace(/"/g, ''),
          city: parts[2].replace(/"/g, ''),
          country: parts[3].replace(/"/g, ''),
          iata: parts[4].replace(/"/g, ''),
          icao: parts[5].replace(/"/g, ''),
          lat: parseFloat(parts[6]),
          long: parseFloat(parts[7]),
          alt: parseFloat(parts[8]),
          timezone: parts[9] === '\\N' ? 0 : parseFloat(parts[9]),
          dst: parts[10].replace(/"/g, ''),
          timezone2: parts[11].replace(/"/g, ''),
          type: parts[12].replace(/"/g, ''),
          source: parts[13].replace(/"/g, '')
        };

        // Only store if valid IATA code
        if (airport.iata && airport.iata !== '\\N' && airport.iata.length === 3) {
          this.airports.set(airport.iata, airport);
        }
      }

      this.loaded = true;
      console.log(`✈️  Loaded ${this.airports.size} airports`);
    } catch (error) {
      console.error('Error loading airports:', error);
      throw error;
    }
  }

  getByIata(iata: string): Airport | undefined {
    return this.airports.get(iata.toUpperCase());
  }

  getAllAirports(): Airport[] {
    return Array.from(this.airports.values());
  }

  getValidCodes(): string[] {
    return Array.from(this.airports.keys());
  }

  searchAirports(query: string, limit = 10): Airport[] {
    const lowerQuery = query.toLowerCase();
    return Array.from(this.airports.values())
      .filter(airport =>
        airport.iata.toLowerCase().includes(lowerQuery) ||
        airport.name.toLowerCase().includes(lowerQuery) ||
        airport.city.toLowerCase().includes(lowerQuery)
      )
      .slice(0, limit);
  }

  isLoaded(): boolean {
    return this.loaded;
  }
}

// Export singleton instance
export const airportService = new AirportService();
