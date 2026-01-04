import { Trip } from '@/types/trip';
import { createTripDslServices } from './langiumServices';
import { Model } from '@/langium/generated/ast';

class DSLParser {
  private services = createTripDslServices().TripDsl;

  async parse(dslText: string): Promise<Trip[]> {
    try {
      // Import URI from 'langium'
      const { URI } = await import('langium');
      const uri = URI.parse('inmemory://user.trip');
      // See: https://github.com/langium/langium/issues/1708
      const document = this.services.shared.workspace.LangiumDocumentFactory.fromString(
        dslText,
        uri
      );

      // Build the document (parse and validate)
      await this.services.shared.workspace.DocumentBuilder.build([document], {
        validation: true
      });

      const model = document.parseResult.value as Model;

      if (!model) {
        throw new Error('Failed to parse DSL');
      }

      // Convert AST trips to our Trip type
      const trips: Trip[] = [];
      for (const element of model.elements) {
        if (element.$type === 'Trip') {
          const trip = this.convertTripToModel(element as any);
          trips.push(trip);
        }
      }

      return trips;
    } catch (error) {
      console.error('DSL Parse error:', error);
      throw error;
    }
  }

  private convertTripToModel(astTrip: any): Trip {
    const properties = new Map(
      astTrip.properties.map((p: any) => {
        const type = p.$type.replace('Property', '').toLowerCase();
        return [type, p];
      })
    );

    const name = this.extractValue(properties.get('name'));
    const stops = this.extractArray(properties.get('stops'), 'stops');
    const from = this.parseDate(this.extractValue(properties.get('from')));
    const to = this.parseDate(this.extractValue(properties.get('to')));
    const tags = this.extractArray(properties.get('tags'), 'tags') || [];
    const color = this.extractValue(properties.get('color')) || 'red';

    return {
      id: this.generateId(),
      name,
      stops,
      from,
      to,
      tags,
      color,
    };
  }

  private extractValue(property: any): string {
    if (!property) return '';
    return property.value?.replace(/"/g, '') || '';
  }

  private extractArray(property: any, fieldName: string): string[] {
    if (!property) return [];
    const arr = property[fieldName] || [];
    return arr.map((s: string) => s.replace(/"/g, ''));
  }

  private parseDate(dateStr: string): Date {
    // Parse "Jan 1 2024" format
    if (!dateStr) return new Date();
    const parsed = new Date(dateStr);
    return isNaN(parsed.getTime()) ? new Date() : parsed;
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }
}

// Export singleton instance
export const dslParser = new DSLParser();
