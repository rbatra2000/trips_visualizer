import { Trip } from '@/types/trip';
import { ValidationError, ParseResult } from '@/types/validation';
import { airportService } from './airportService';

class SimpleDSLParser {
  /**
   * Parse DSL text into Trip objects with validation
   */
  parse(dslText: string): ParseResult<Trip> {
    const trips: Trip[] = [];
    const errors: ValidationError[] = [];
    const lines = dslText.split('\n');

    // Match trip(...) blocks
    const tripRegex = /trip\s*\(([\s\S]*?)\)/g;
    let match;

    while ((match = tripRegex.exec(dslText)) !== null) {
      const tripContent = match[1];
      const tripStart = match.index;

      // Calculate line number
      const beforeTrip = dslText.substring(0, tripStart);
      const lineNumber = beforeTrip.split('\n').length;

      const result = this.parseTripContent(tripContent, lineNumber, dslText);

      if (result.trip) {
        trips.push(result.trip);
      }

      errors.push(...result.errors);
    }

    return { data: trips, errors };
  }

  private parseTripContent(
    content: string,
    startLine: number,
    fullText: string
  ): { trip: Trip | null; errors: ValidationError[] } {
    const errors: ValidationError[] = [];
    const properties: any = {};

    try {
      // Parse name="..."
      const nameMatch = content.match(/name\s*=\s*"([^"]*)"/);
      if (nameMatch) {
        properties.name = nameMatch[1];
      } else {
        errors.push({
          line: startLine,
          column: 0,
          length: 4,
          message: 'Missing required property: name',
          severity: 'error',
        });
      }

      // Parse stops=["...", "..."]
      const stopsMatch = content.match(/stops\s*=\s*\[(.*?)\]/);
      if (stopsMatch) {
        properties.stops = stopsMatch[1]
          .split(',')
          .map(s => s.trim().replace(/['"]/g, ''))
          .filter(s => s.length > 0);

        // Validate airport codes
        if (airportService.isLoaded()) {
          // Track occurrence count for each code
          const codeOccurrenceCount = new Map<string, number>();

          properties.stops.forEach((code: string, index: number) => {
            // Get the occurrence index for this specific code
            const occurrenceIndex = codeOccurrenceCount.get(code) || 0;
            codeOccurrenceCount.set(code, occurrenceIndex + 1);

            const airport = airportService.getByIata(code);
            if (!airport) {
              // Find the line containing the stops array
              const stopsLineMatch = content.match(/stops\s*=\s*\[.*?\]/s);
              if (!stopsLineMatch) return;

              // Get the position of the stops declaration in the full text
              const tripStartPos = fullText.indexOf(content);
              const stopsInContent = content.indexOf(stopsLineMatch[0]);
              const stopsStartPos = tripStartPos + stopsInContent;

              // Find all occurrences of this code in the stops array
              const stopsText = stopsLineMatch[0];
              const codePattern = new RegExp(`["']${code.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}["']`, 'g');
              const matches = [...stopsText.matchAll(codePattern)];

              if (matches[occurrenceIndex]) {
                // Get the absolute position in the full text
                const absolutePos = stopsStartPos + matches[occurrenceIndex].index! + 1; // +1 to skip opening quote

                // Calculate line and column
                const textBeforeError = fullText.substring(0, absolutePos);
                const errorLine = textBeforeError.split('\n').length;
                const lastNewlinePos = textBeforeError.lastIndexOf('\n');
                const errorColumn = lastNewlinePos === -1 ? absolutePos : textBeforeError.length - lastNewlinePos - 1;

                errors.push({
                  line: errorLine,
                  column: errorColumn,
                  length: code.length,
                  message: `Unknown airport code: ${code}`,
                  severity: 'error',
                });
              }
            }
          });
        }

        if (properties.stops.length < 2) {
          errors.push({
            line: startLine,
            column: 0,
            length: 5,
            message: 'Trip must have at least 2 stops',
            severity: 'error',
          });
        }
      } else {
        errors.push({
          line: startLine,
          column: 0,
          length: 4,
          message: 'Missing required property: stops',
          severity: 'error',
        });
      }

      // Parse from="..."
      const fromMatch = content.match(/from\s*=\s*"([^"]*)"/);
      if (fromMatch) properties.from = new Date(fromMatch[1]);

      // Parse to="..."
      const toMatch = content.match(/to\s*=\s*"([^"]*)"/);
      if (toMatch) properties.to = new Date(toMatch[1]);

      // Parse tags=["...", "..."]
      const tagsMatch = content.match(/tags\s*=\s*\[(.*?)\]/);
      if (tagsMatch) {
        properties.tags = tagsMatch[1]
          .split(',')
          .map(s => s.trim().replace(/['"]/g, ''))
          .filter(s => s.length > 0);
      }

      // Parse color="..."
      const colorMatch = content.match(/color\s*=\s*"([^"]*)"/);
      if (colorMatch) properties.color = colorMatch[1];

      // If there are critical errors, don't create the trip
      if (errors.some(e => e.severity === 'error' &&
          (e.message.includes('Missing required') || e.message.includes('at least 2 stops')))) {
        return { trip: null, errors };
      }

      const trip: Trip = {
        id: this.generateId(),
        name: properties.name || 'Unnamed Trip',
        stops: properties.stops || [],
        from: properties.from || new Date(),
        to: properties.to || new Date(),
        tags: properties.tags || [],
        color: properties.color || 'red',
      };

      return { trip, errors };
    } catch (error) {
      console.error('Error parsing trip:', error);
      errors.push({
        line: startLine,
        column: 0,
        length: 4,
        message: 'Failed to parse trip',
        severity: 'error',
      });
      return { trip: null, errors };
    }
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }
}

// Export singleton instance
export const simpleDslParser = new SimpleDSLParser();
