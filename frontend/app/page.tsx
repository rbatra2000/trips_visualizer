'use client';

import { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { simpleDslParser } from '@/services/simpleDslParser';
import { tripConverter } from '@/services/tripConverter';
import { airportService } from '@/services/airportService';
import { RouteWithCoordinates } from '@/types/trip';
import { ValidationError } from '@/types/validation';

// Dynamic import to prevent SSR issues
const PlotlyMap = dynamic(() => import('@/components/Visualizer/PlotlyMap'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full bg-white">
      <div className="text-gray-600">Loading map...</div>
    </div>
  ),
});

const MonacoEditor = dynamic(() => import('@/components/Editor/MonacoEditor'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full bg-gray-800">
      <div className="text-gray-400">Loading editor...</div>
    </div>
  ),
});

const defaultDSL = `// Example trips - Try editing the code below!
// Invalid airport codes will be highlighted with red underlines

trip(
  name="Copenhagen Adventure",
  stops=["SFO", "JFK", "CPH"],
  from="Jan 1 2024",
  to="Jan 5 2024",
  tags=["vacation", "europe"],
  color="blue"
)

trip(
  name="Tokyo Business",
  stops=["LAX", "NRT", "LAX"],
  from="Mar 20 2024",
  to="Mar 28 2024",
  tags=["business"],
  color="green"
)

trip(
  name="European Tour",
  stops=["SFO", "LHR", "CDG", "FCO", "SFO"],
  from="Jun 1 2024",
  to="Jun 15 2024",
  tags=["vacation", "multi-city"],
  color="purple"
)`;

export default function HomePage() {
  const [dslCode, setDslCode] = useState(defaultDSL);
  const [routes, setRoutes] = useState<RouteWithCoordinates[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [isUserTyping, setIsUserTyping] = useState(false);

  // Load airports on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        await airportService.loadAirports();
        setLoading(false);
        // Parse initial DSL
        await parseAndVisualize(defaultDSL);
      } catch (err) {
        setError('Failed to load airport data');
        setLoading(false);
        console.error(err);
      }
    };

    loadData();
  }, []);

  const parseAndVisualize = useCallback(async (code: string) => {
    if (!airportService.isLoaded()) return;

    try {
      const result = simpleDslParser.parse(code);
      setValidationErrors(result.errors);

      const newRoutes = tripConverter.convertTripsToRoutes(result.data);
      setRoutes(newRoutes);
    } catch (err) {
      console.error('Parse error:', err);
      setValidationErrors([{
        line: 1,
        column: 0,
        length: 0,
        message: err instanceof Error ? err.message : 'Failed to parse DSL',
        severity: 'error',
      }]);
      setRoutes([]);
    }
  }, []);

  const handleCodeChange = useCallback(
    (newCode: string) => {
      setDslCode(newCode);
      setIsUserTyping(true);

      // Debounce parsing
      const timeoutId = setTimeout(() => {
        setIsUserTyping(false);
        parseAndVisualize(newCode);
      }, 500);
      return () => clearTimeout(timeoutId);
    },
    [parseAndVisualize]
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900">
        <div className="text-white text-lg">Loading airports database (7,698 airports)...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900">
        <div className="text-red-400 text-lg">{error}</div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-900">
      {/* Editor Panel */}
      <div className="w-1/2 border-r border-gray-700 flex flex-col">
        <div className="bg-gray-800 px-4 py-3 border-b border-gray-700 flex items-center justify-between">
          <div>
            <h2 className="text-white font-semibold text-lg">Trip DSL Editor</h2>
            <p className="text-gray-400 text-xs mt-0.5">
              {validationErrors.length === 0
                ? 'Define your trips using the custom DSL'
                : `${validationErrors.length} validation error${validationErrors.length !== 1 ? 's' : ''}`}
            </p>
          </div>
          {validationErrors.length > 0 && (
            <div className="bg-red-900/30 border border-red-500 text-red-300 px-3 py-1 rounded text-sm">
              {validationErrors.length} error{validationErrors.length !== 1 ? 's' : ''}
            </div>
          )}
        </div>
        <div className="flex-1 overflow-hidden">
          <MonacoEditor
            value={dslCode}
            onChange={handleCodeChange}
            errors={validationErrors}
          />
        </div>
      </div>

      {/* Visualizer Panel */}
      <div className="w-1/2 flex flex-col">
        <div className="bg-gray-800 px-4 py-3 border-b border-gray-700">
          <h2 className="text-white font-semibold text-lg">Flight Visualization</h2>
          <p className="text-gray-400 text-xs mt-0.5">
            {routes.length > 0
              ? `Showing ${routes.length} route${routes.length !== 1 ? 's' : ''}`
              : 'No routes to display'}
          </p>
        </div>
        <div className="flex-1 bg-white">
          <PlotlyMap routes={routes} pauseAnimation={isUserTyping} />
        </div>
      </div>
    </div>
  );
}
