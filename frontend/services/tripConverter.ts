import { Trip, RouteWithCoordinates } from '@/types/trip';
import { airportService } from './airportService';

class TripConverter {
  /**
   * Converts trips to route pairs with coordinates
   * Mimics the pandas merge logic from the Jupyter notebook
   */
  convertTripsToRoutes(trips: Trip[]): RouteWithCoordinates[] {
    const routes: RouteWithCoordinates[] = [];

    for (const trip of trips) {
      // Create consecutive pairs of stops (like the Python code)
      for (let i = 0; i < trip.stops.length - 1; i++) {
        const srcCode = trip.stops[i].toUpperCase();
        const destCode = trip.stops[i + 1].toUpperCase();

        const srcAirport = airportService.getByIata(srcCode);
        const destAirport = airportService.getByIata(destCode);

        if (!srcAirport || !destAirport) {
          console.warn(
            `⚠️  Skipping route ${srcCode} → ${destCode}: Airport not found`
          );
          continue;
        }

        routes.push({
          src: srcCode,
          dest: destCode,
          name_src: srcAirport.name,
          lat_src: srcAirport.lat,
          long_src: srcAirport.long,
          name_dest: destAirport.name,
          lat_dest: destAirport.lat,
          long_dest: destAirport.long,
          tripName: trip.name,
          tripColor: trip.color || 'red',
          date: trip.from, // Use trip start date
        });
      }
    }

    // Sort routes by date (chronological order)
    routes.sort((a, b) => {
      const dateA = a.date instanceof Date ? a.date : new Date(a.date);
      const dateB = b.date instanceof Date ? b.date : new Date(b.date);
      return dateA.getTime() - dateB.getTime();
    });

    return routes;
  }

  /**
   * Get unique airports from routes (for markers)
   */
  getUniqueAirports(routes: RouteWithCoordinates[]): Array<{
    iata: string;
    name: string;
    lat: number;
    long: number;
  }> {
    const airportMap = new Map();

    for (const route of routes) {
      if (!airportMap.has(route.src)) {
        airportMap.set(route.src, {
          iata: route.src,
          name: route.name_src,
          lat: route.lat_src,
          long: route.long_src,
        });
      }
      if (!airportMap.has(route.dest)) {
        airportMap.set(route.dest, {
          iata: route.dest,
          name: route.name_dest,
          lat: route.lat_dest,
          long: route.long_dest,
        });
      }
    }

    return Array.from(airportMap.values());
  }
}

// Export singleton instance
export const tripConverter = new TripConverter();
