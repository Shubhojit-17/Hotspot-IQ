/**
 * Score Gauge Component
 * Circular gauge visualization for opportunity score
 */

import { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

export default function ScoreGauge({ score = 0, size = 'md', showLabel = true, isLoading }) {
  const normalizedScore = Math.min(100, Math.max(0, score));
  
  // Determine color based on score
  const scoreColor = useMemo(() => {
    if (normalizedScore >= 70) return '#10b981'; // Green - Excellent
    if (normalizedScore >= 50) return '#06b6d4'; // Cyan - Good
    if (normalizedScore >= 30) return '#f59e0b'; // Amber - Fair
    return '#f43f5e'; // Rose - Poor
  }, [normalizedScore]);

  const scoreLabel = useMemo(() => {
    if (normalizedScore >= 70) return 'Excellent';
    if (normalizedScore >= 50) return 'Good';
    if (normalizedScore >= 30) return 'Fair';
    return 'Poor';
  }, [normalizedScore]);

  // Chart data for gauge effect
  const data = [
    { name: 'score', value: normalizedScore },
    { name: 'remaining', value: 100 - normalizedScore },
  ];

  // Size configurations
  const sizes = {
    sm: { width: 100, height: 100, inner: 35, outer: 45, fontSize: 'text-xl' },
    md: { width: 160, height: 160, inner: 55, outer: 70, fontSize: 'text-3xl' },
    lg: { width: 200, height: 200, inner: 70, outer: 90, fontSize: 'text-4xl' },
  };

  const config = sizes[size] || sizes.md;

  if (isLoading) {
    return (
      <div 
        className="relative flex items-center justify-center"
        style={{ width: config.width, height: config.height }}
      >
        <div 
          className="absolute rounded-full border-8 border-slate-700 animate-pulse"
          style={{ 
            width: config.outer * 2, 
            height: config.outer * 2,
          }}
        />
        <div className="w-8 h-8 border-2 border-slate-600 border-t-primary-glow rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div 
      className="relative"
      style={{ width: config.width, height: config.height }}
    >
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            startAngle={180}
            endAngle={0}
            innerRadius={config.inner}
            outerRadius={config.outer}
            paddingAngle={0}
            dataKey="value"
            stroke="none"
          >
            <Cell fill={scoreColor} />
            <Cell fill="#1e293b" />
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      
      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span 
          className={`font-bold ${config.fontSize} transition-colors duration-500`}
          style={{ color: scoreColor }}
        >
          {normalizedScore}
        </span>
        {showLabel && (
          <span 
            className="text-xs font-medium transition-colors duration-500 -mt-1"
            style={{ color: scoreColor }}
          >
            {scoreLabel}
          </span>
        )}
      </div>
      
      {/* Scale markers */}
      <div className="absolute bottom-0 left-0 right-0 flex justify-between px-2 text-xs text-slate-600">
        <span>0</span>
        <span>50</span>
        <span>100</span>
      </div>
    </div>
  );
}
