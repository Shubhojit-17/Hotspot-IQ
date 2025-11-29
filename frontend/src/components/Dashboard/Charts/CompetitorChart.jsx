/**
 * Competitor Chart Component
 * Bar chart showing competitor distribution by category
 */

import { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

// Category colors
const CATEGORY_COLORS = {
  cafe: '#10b981',
  restaurant: '#f59e0b',
  retail: '#3b82f6',
  gym: '#8b5cf6',
  pharmacy: '#ec4899',
  salon: '#14b8a6',
  electronics: '#6366f1',
  clothing: '#f43f5e',
  default: '#64748b',
};

// Custom tooltip
const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload || !payload.length) return null;

  const data = payload[0].payload;
  return (
    <div className="bg-canvas-base border border-surface-border rounded-lg p-3 shadow-glass">
      <p className="text-slate-200 font-medium">{data.name}</p>
      <p className="text-sm text-slate-400">
        <span className="text-destructive-glow font-semibold">{data.count}</span> competitors
      </p>
    </div>
  );
};

export default function CompetitorChart({ competitors = [], isLoading }) {
  // Safely convert to array
  const competitorList = Array.isArray(competitors) ? competitors : [];
  
  // Group competitors by category
  const chartData = useMemo(() => {
    const grouped = competitorList.reduce((acc, competitor) => {
      const category = competitor.category?.toLowerCase() || 'other';
      if (!acc[category]) {
        acc[category] = { name: category, count: 0 };
      }
      acc[category].count++;
      return acc;
    }, {});

    return Object.values(grouped)
      .sort((a, b) => b.count - a.count)
      .slice(0, 6); // Top 6 categories
  }, [competitorList]);

  if (isLoading) {
    return (
      <div className="glass-panel p-4">
        <div className="h-4 bg-slate-700 rounded w-32 mb-4 animate-pulse" />
        <div className="h-48 bg-slate-700/30 rounded animate-pulse" />
      </div>
    );
  }

  if (competitorList.length === 0) {
    return (
      <div className="glass-panel p-4">
        <h3 className="text-sm font-medium text-slate-400 mb-4 flex items-center gap-2">
          <span>📊</span> Competitor Distribution
        </h3>
        <div className="h-48 flex items-center justify-center text-slate-500">
          <div className="text-center">
            <span className="text-3xl mb-2 block">🎉</span>
            <p>No competitors to show</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-panel p-4">
      <h3 className="text-sm font-medium text-slate-400 mb-4 flex items-center gap-2">
        <span>📊</span> Competitor Distribution
      </h3>
      
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
          >
            <XAxis 
              type="number" 
              hide 
              domain={[0, 'dataMax + 1']}
            />
            <YAxis
              type="category"
              dataKey="name"
              width={80}
              tick={{ fill: '#94a3b8', fontSize: 12 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(value) => 
                value.charAt(0).toUpperCase() + value.slice(1)
              }
            />
            <Tooltip content={<CustomTooltip />} cursor={false} />
            <Bar
              dataKey="count"
              radius={[0, 4, 4, 0]}
              maxBarSize={24}
            >
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={CATEGORY_COLORS[entry.name] || CATEGORY_COLORS.default}
                  fillOpacity={0.8}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      
      {/* Legend */}
      <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-surface-border">
        {chartData.map((item) => (
          <div key={item.name} className="flex items-center gap-1.5 text-xs">
            <div
              className="w-2.5 h-2.5 rounded-sm"
              style={{ backgroundColor: CATEGORY_COLORS[item.name] || CATEGORY_COLORS.default }}
            />
            <span className="text-slate-500 capitalize">{item.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
