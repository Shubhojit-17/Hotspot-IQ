/**
 * Landmark Radar Chart Component
 * Radar chart showing landmark category distribution
 */

import { useMemo } from 'react';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';

// Category configuration
const CATEGORY_CONFIG = {
  metro_station: { label: 'Metro', maxScore: 5 },
  bus_stop: { label: 'Bus', maxScore: 10 },
  school: { label: 'School', maxScore: 8 },
  college: { label: 'College', maxScore: 5 },
  hospital: { label: 'Hospital', maxScore: 5 },
  mall: { label: 'Mall', maxScore: 3 },
  office: { label: 'Office', maxScore: 10 },
  residential: { label: 'Residential', maxScore: 15 },
  temple: { label: 'Temple', maxScore: 5 },
  park: { label: 'Park', maxScore: 5 },
};

// Custom tooltip
const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload || !payload.length) return null;

  const data = payload[0].payload;
  return (
    <div className="bg-canvas-base border border-surface-border rounded-lg p-3 shadow-glass">
      <p className="text-slate-200 font-medium">{data.fullLabel}</p>
      <p className="text-sm text-slate-400">
        <span className="text-primary-glow font-semibold">{data.count}</span> nearby
      </p>
    </div>
  );
};

export default function LandmarkRadar({ landmarks = [], isLoading }) {
  // Safely convert to array
  const landmarkList = Array.isArray(landmarks) ? landmarks : [];
  
  // Process landmarks into radar data
  const chartData = useMemo(() => {
    // Count landmarks by category
    const counts = landmarkList.reduce((acc, landmark) => {
      const category = landmark.category?.toLowerCase().replace(/\s+/g, '_') || 'other';
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {});

    // Convert to chart format with normalized values
    return Object.entries(CATEGORY_CONFIG).map(([key, config]) => {
      const count = counts[key] || 0;
      const normalized = Math.min(100, (count / config.maxScore) * 100);
      return {
        category: config.label,
        fullLabel: config.label,
        value: normalized,
        count,
      };
    });
  }, [landmarkList]);

  if (isLoading) {
    return (
      <div className="glass-panel p-4">
        <div className="h-4 bg-slate-700 rounded w-32 mb-4 animate-pulse" />
        <div className="h-64 bg-slate-700/30 rounded-full animate-pulse mx-auto w-64" />
      </div>
    );
  }

  if (landmarkList.length === 0) {
    return (
      <div className="glass-panel p-4">
        <h3 className="text-sm font-medium text-slate-400 mb-4 flex items-center gap-2">
          <img src="/icons/star.svg" alt="" className="w-4 h-4" style={{ filter: 'invert(68%) sepia(51%) saturate(1016%) hue-rotate(359deg) brightness(101%) contrast(96%)' }} />
          Landmark Coverage
        </h3>
        <div className="h-64 flex items-center justify-center text-slate-500">
          <div className="text-center">
            <img src="/icons/marker.svg" alt="" className="w-8 h-8 mx-auto mb-2 opacity-50" style={{ filter: 'invert(70%) sepia(10%) saturate(200%) hue-rotate(180deg) brightness(90%) contrast(85%)' }} />
            <p>No landmarks detected</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-panel p-4">
      <h3 className="text-sm font-medium text-slate-400 mb-4 flex items-center gap-2">
        <img src="/icons/star.svg" alt="" className="w-4 h-4" style={{ filter: 'invert(68%) sepia(51%) saturate(1016%) hue-rotate(359deg) brightness(101%) contrast(96%)' }} />
        Landmark Coverage
      </h3>
      
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={chartData} margin={{ top: 20, right: 30, bottom: 20, left: 30 }}>
            <PolarGrid 
              stroke="#334155" 
              strokeOpacity={0.5}
            />
            <PolarAngleAxis
              dataKey="category"
              tick={{ fill: '#94a3b8', fontSize: 11 }}
              tickLine={false}
            />
            <PolarRadiusAxis
              angle={90}
              domain={[0, 100]}
              tick={false}
              axisLine={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Radar
              name="Coverage"
              dataKey="value"
              stroke="#10b981"
              fill="#10b981"
              fillOpacity={0.3}
              strokeWidth={2}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
      
      {/* Summary */}
      <div className="mt-3 pt-3 border-t border-surface-border">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-500">Total landmarks detected</span>
          <span className="text-primary-glow font-semibold">{landmarkList.length}</span>
        </div>
      </div>
    </div>
  );
}
