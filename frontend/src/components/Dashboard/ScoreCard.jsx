/**
 * Score Card Component
 * Displays the Opportunity Score with a radial progress ring
 */

export default function ScoreCard({ score, label, isLoading }) {
  // Score should be 0-100
  const normalizedScore = Math.min(100, Math.max(0, score || 0));
  
  // Calculate stroke-dasharray for progress ring
  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (normalizedScore / 100) * circumference;
  
  // Determine color based on score
  const getScoreColor = (score) => {
    if (score >= 70) return '#10b981'; // Green - Excellent
    if (score >= 50) return '#06b6d4'; // Cyan - Good
    if (score >= 30) return '#f59e0b'; // Amber - Fair
    return '#f43f5e'; // Rose - Poor
  };
  
  const getScoreLabel = (score) => {
    if (score >= 70) return 'Excellent';
    if (score >= 50) return 'Good';
    if (score >= 30) return 'Fair';
    return 'Poor';
  };
  
  const scoreColor = getScoreColor(normalizedScore);
  const scoreLabel = getScoreLabel(normalizedScore);

  return (
    <div className="glass-panel p-5">
      <h3 className="text-sm font-medium text-slate-400 mb-4 flex items-center gap-2">
        <span className="text-lg">📊</span>
        Opportunity Score
      </h3>
      
      <div className="flex items-center gap-6">
        {/* Radial Progress Ring */}
        <div className="relative w-28 h-28">
          <svg className="w-full h-full transform -rotate-90">
            {/* Background circle */}
            <circle
              cx="56"
              cy="56"
              r={radius}
              stroke="currentColor"
              strokeWidth="8"
              fill="none"
              className="text-slate-700"
            />
            {/* Progress circle */}
            <circle
              cx="56"
              cy="56"
              r={radius}
              stroke={isLoading ? '#475569' : scoreColor}
              strokeWidth="8"
              fill="none"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={isLoading ? circumference : strokeDashoffset}
              className="transition-all duration-1000 ease-out"
              style={{
                filter: isLoading ? 'none' : `drop-shadow(0 0 8px ${scoreColor}80)`,
              }}
            />
          </svg>
          
          {/* Center text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            {isLoading ? (
              <div className="w-8 h-8 border-2 border-slate-600 border-t-primary-glow rounded-full animate-spin" />
            ) : (
              <>
                <span 
                  className="text-3xl font-bold transition-colors duration-500"
                  style={{ color: scoreColor }}
                >
                  {normalizedScore}
                </span>
                <span className="text-xs text-slate-500">/100</span>
              </>
            )}
          </div>
        </div>
        
        {/* Score details */}
        <div className="flex-1 space-y-2">
          {isLoading ? (
            <div className="space-y-2">
              <div className="h-5 bg-slate-700 rounded animate-pulse w-24" />
              <div className="h-4 bg-slate-700/50 rounded animate-pulse w-32" />
            </div>
          ) : (
            <>
              <p 
                className="text-lg font-semibold transition-colors duration-500"
                style={{ color: scoreColor }}
              >
                {scoreLabel}
              </p>
              {label && (
                <p className="text-sm text-slate-400">{label}</p>
              )}
            </>
          )}
        </div>
      </div>
      
      {/* Score breakdown hint */}
      {!isLoading && score !== undefined && (
        <div className="mt-4 pt-4 border-t border-surface-border">
          <p className="text-xs text-slate-500">
            Based on footfall, competitor density & nearby landmarks
          </p>
        </div>
      )}
    </div>
  );
}
