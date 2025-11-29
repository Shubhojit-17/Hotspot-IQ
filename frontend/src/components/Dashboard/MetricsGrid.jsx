/**
 * Metrics Grid Component
 * Displays key metrics in a compact grid layout
 */

export default function MetricsGrid({ analysis, isLoading }) {
  const metrics = [
    {
      id: 'footfall',
      label: 'Footfall Index',
      value: analysis?.footfall_index || 0,
      max: 100,
      icon: '👥',
      color: 'primary',
      description: 'Estimated foot traffic potential',
    },
    {
      id: 'competitors',
      label: 'Competitors',
      value: analysis?.competitors?.length || 0,
      suffix: ' nearby',
      icon: '🏪',
      color: 'destructive',
      description: 'Same category businesses',
    },
    {
      id: 'landmarks',
      label: 'Landmarks',
      value: analysis?.landmarks?.length || 0,
      suffix: ' found',
      icon: '🏛️',
      color: 'accent',
      description: 'Key locations nearby',
    },
    {
      id: 'density',
      label: 'Competition Density',
      value: analysis?.competitor_density?.toFixed(1) || '0.0',
      suffix: '/km²',
      icon: '📊',
      color: 'warning',
      description: 'Competitors per square km',
    },
  ];

  const getColorClasses = (color) => {
    const colors = {
      primary: 'text-primary-glow bg-primary-glow/10 border-primary-glow/30',
      destructive: 'text-destructive-glow bg-destructive-glow/10 border-destructive-glow/30',
      accent: 'text-accent-glow bg-accent-glow/10 border-accent-glow/30',
      warning: 'text-warning-glow bg-warning-glow/10 border-warning-glow/30',
    };
    return colors[color] || colors.primary;
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="glass-card p-4 animate-pulse">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 bg-slate-700 rounded-lg" />
              <div className="h-4 bg-slate-700 rounded w-20" />
            </div>
            <div className="h-6 bg-slate-700 rounded w-16 mb-1" />
            <div className="h-3 bg-slate-700/50 rounded w-24" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3">
      {metrics.map((metric) => (
        <div
          key={metric.id}
          className="glass-card p-4 hover:bg-surface-elevated transition-colors group"
        >
          {/* Header */}
          <div className="flex items-center gap-2 mb-2">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-lg border ${getColorClasses(metric.color)}`}>
              {metric.icon}
            </div>
            <span className="text-xs text-slate-500 font-medium uppercase tracking-wide">
              {metric.label}
            </span>
          </div>
          
          {/* Value */}
          <div className="flex items-baseline gap-1">
            <span className={`text-2xl font-bold ${getColorClasses(metric.color).split(' ')[0]}`}>
              {metric.value}
            </span>
            {metric.suffix && (
              <span className="text-sm text-slate-500">{metric.suffix}</span>
            )}
            {metric.max && (
              <span className="text-sm text-slate-600">/{metric.max}</span>
            )}
          </div>
          
          {/* Description (on hover) */}
          <p className="text-xs text-slate-600 mt-1 group-hover:text-slate-500 transition-colors">
            {metric.description}
          </p>
        </div>
      ))}
    </div>
  );
}
