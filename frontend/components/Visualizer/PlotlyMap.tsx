'use client';

import { useEffect, useState, useRef } from 'react';
import { RouteWithCoordinates } from '@/types/trip';
import { tripConverter } from '@/services/tripConverter';

interface PlotlyMapProps {
  routes: RouteWithCoordinates[];
  pauseAnimation?: boolean;
}

export default function PlotlyMap({ routes, pauseAnimation = false }: PlotlyMapProps) {
  const [Plot, setPlot] = useState<any>(null);
  const [currentFrame, setCurrentFrame] = useState(0);
  const animationRef = useRef<NodeJS.Timeout | null>(null);
  const isPausedRef = useRef(false);

  useEffect(() => {
    import('react-plotly.js').then((mod) => {
      setPlot(() => mod.default);
    });
  }, []);

  // Pause/resume animation based on user typing
  useEffect(() => {
    isPausedRef.current = pauseAnimation;

    if (pauseAnimation && animationRef.current) {
      // Pause animation - clear interval but keep current frame
      clearInterval(animationRef.current);
      animationRef.current = null;
    } else if (!pauseAnimation && routes.length > 0 && currentFrame < routes.length) {
      // Resume animation if not finished
      if (!animationRef.current) {
        let frame = currentFrame;
        const interval = setInterval(() => {
          if (isPausedRef.current) {
            clearInterval(interval);
            return;
          }
          frame++;
          if (frame <= routes.length) {
            setCurrentFrame(frame);
          } else {
            clearInterval(interval);
          }
        }, 600);
        animationRef.current = interval;
      }
    }
  }, [pauseAnimation, routes.length, currentFrame]);

  // Auto-animate routes when they change
  useEffect(() => {
    if (routes.length === 0) {
      setCurrentFrame(0);
      return;
    }

    // Don't start animation if user is typing
    if (pauseAnimation) {
      return;
    }

    // Clear any existing animation
    if (animationRef.current) {
      clearInterval(animationRef.current);
    }

    // Start from 0 and animate
    setCurrentFrame(0);
    let frame = 0;

    const interval = setInterval(() => {
      if (isPausedRef.current) {
        clearInterval(interval);
        return;
      }
      frame++;
      if (frame <= routes.length) {
        setCurrentFrame(frame);
      } else {
        clearInterval(interval);
      }
    }, 600); // Slower animation - 600ms per route

    animationRef.current = interval;

    return () => {
      if (animationRef.current) {
        clearInterval(animationRef.current);
      }
    };
  }, [routes, pauseAnimation]);

  if (!Plot) {
    return (
      <div className="flex items-center justify-center h-full bg-white">
        <div className="text-gray-600">Loading map...</div>
      </div>
    );
  }

  const { data, layout } = generatePlotlyConfig(routes, currentFrame);

  return (
    <div className="w-full h-full bg-white">
      <Plot
        data={data}
        layout={layout}
        config={{
          responsive: true,
          displayModeBar: true,
          displaylogo: false,
          modeBarButtonsToRemove: ['lasso2d', 'select2d'],
        }}
        style={{
          width: '100%',
          height: '100%',
        }}
        useResizeHandler={true}
      />
    </div>
  );
}

function formatDate(date: Date | string): string {
  const d = date instanceof Date ? date : new Date(date);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function generatePlotlyConfig(routes: RouteWithCoordinates[], currentFrame: number) {
  const uniqueAirports = tripConverter.getUniqueAirports(routes);

  const data: any[] = [
    // Airport markers
    {
      type: 'scattergeo',
      mode: 'markers',
      lon: uniqueAirports.map((a) => a.long),
      lat: uniqueAirports.map((a) => a.lat),
      text: uniqueAirports.map((a) => `${a.iata} - ${a.name}`),
      hoverinfo: 'text',
      marker: {
        size: 6,
        color: 'rgb(220, 38, 38)',
        line: {
          width: 1,
          color: 'white',
        },
      },
      showlegend: false,
    },
  ];

  // Add routes progressively based on currentFrame
  for (let i = 0; i < Math.min(currentFrame, routes.length); i++) {
    const route = routes[i];
    const isNewest = i === currentFrame - 1;

    data.push({
      type: 'scattergeo',
      locationmode: 'country names',
      lon: [route.long_src, route.long_dest],
      lat: [route.lat_src, route.lat_dest],
      mode: 'lines',
      line: {
        width: isNewest ? 3 : 2, // Thicker for newest route
        color: route.tripColor || 'red',
      },
      opacity: isNewest ? 1.0 : 0.6, // Brighter for newest route
      hoverinfo: 'text',
      text: `${route.src} → ${route.dest}<br>${route.tripName}<br>${formatDate(route.date)}`,
      showlegend: false,
    });
  }

  const visibleRoutes = Math.min(currentFrame, routes.length);
  const layout: any = {
    title: {
      text: routes.length > 0
        ? `Flight Routes (${visibleRoutes}/${routes.length} routes)`
        : 'No routes to display',
      font: { size: 20, color: '#1f2937' },
    },
    showlegend: false,
    geo: {
      scope: 'world',
      showland: true,
      landcolor: '#d0e6af',
      countrycolor: '#a0afba',
      showcountries: true,
      showlakes: true,
      lakecolor: '#85c5e3',
      oceancolor: '#b3dbe6',
      showocean: true,
      projection: {
        type: 'natural earth',
      },
      fitbounds: routes.length > 0 ? 'locations' : false,
    },
    autosize: true,
    margin: { t: 60, b: 20, l: 20, r: 20 },
    transition: {
      duration: 500,
      easing: 'cubic-in-out',
    },
  };

  return { data, layout };
}
