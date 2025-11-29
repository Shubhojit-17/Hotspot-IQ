/**
 * Competitor Card Component
 * Displays nearby competitors with distance information
 */

export default function CompetitorCard({ competitors = [], isLoading }) {
  // Ensure competitors is an array
  const competitorList = Array.isArray(competitors) ? competitors : [];
  
  // Sort by distance (closest first)
  const sortedCompetitors = [...competitorList].sort((a, b) => 
    (a.distance || 9999) - (b.distance || 9999)
  );

  const getDistanceColor = (distance) => {
    if (distance <= 200) return 'text-destructive-glow';
    if (distance <= 500) return 'text-warning-glow';
    return 'text-slate-400';
  };

  const getDistanceLabel = (distance) => {
    if (distance >= 1000) {
      return `${(distance / 1000).toFixed(1)}km`;
    }
    return `${distance}m`;
  };

  return (
    <div className="glass-panel p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-slate-400 flex items-center gap-2">
          <span className="text-lg">🏪</span>
          Nearby Competitors
        </h3>
        {!isLoading && (
          <span className="text-xs bg-destructive-glow/20 text-destructive-glow px-2 py-1 rounded-full">
            {competitors.length} found
          </span>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-8 h-8 bg-slate-700 rounded-full animate-pulse" />
              <div className="flex-1">
                <div className="h-4 bg-slate-700 rounded animate-pulse w-3/4 mb-1" />
                <div className="h-3 bg-slate-700/50 rounded animate-pulse w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : competitors.length === 0 ? (
        <div className="text-center py-6">
          <span className="text-2xl mb-2 block">🎉</span>
          <p className="text-slate-400 text-sm">No competitors nearby!</p>
          <p className="text-slate-500 text-xs mt-1">Great opportunity zone</p>
        </div>
      ) : (
        <div className="space-y-3 max-h-64 overflow-y-auto">
          {sortedCompetitors.slice(0, 10).map((competitor, index) => (
            <div 
              key={index}
              className="flex items-start gap-3 p-2 rounded-lg hover:bg-surface-secondary transition-colors"
            >
              {/* Index badge */}
              <div className="w-6 h-6 bg-destructive-glow/20 text-destructive-glow rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0">
                {index + 1}
              </div>
              
              {/* Competitor info */}
              <div className="flex-1 min-w-0">
                <p className="text-slate-200 text-sm truncate">{competitor.name}</p>
                <p className="text-slate-500 text-xs truncate">{competitor.category}</p>
              </div>
              
              {/* Distance */}
              {competitor.distance !== undefined && (
                <span className={`text-xs font-mono flex-shrink-0 ${getDistanceColor(competitor.distance)}`}>
                  {getDistanceLabel(competitor.distance)}
                </span>
              )}
            </div>
          ))}
          
          {competitors.length > 10 && (
            <p className="text-center text-xs text-slate-500 pt-2">
              +{competitors.length - 10} more competitors
            </p>
          )}
        </div>
      )}
      
      {/* Competition density indicator */}
      {!isLoading && competitors.length > 0 && (
        <div className="mt-4 pt-4 border-t border-surface-border">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500">Competition Level</span>
            <span className={
              competitors.length >= 10 ? 'text-destructive-glow' :
              competitors.length >= 5 ? 'text-warning-glow' :
              'text-primary-glow'
            }>
              {competitors.length >= 10 ? 'High' : competitors.length >= 5 ? 'Medium' : 'Low'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
