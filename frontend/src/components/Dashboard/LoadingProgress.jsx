/**
 * LoadingProgress Component
 * Shows progressive loading status during analysis
 */

export default function LoadingProgress({ status, isLoading }) {
  if (!isLoading && status.step === '') return null;

  const { step, message, progress, details } = status;

  return (
    <div className="bg-surface-elevated border border-surface-border rounded-xl p-4 mb-4 animate-fadeIn">
      {/* Progress Bar */}
      <div className="mb-3">
        <div className="flex justify-between items-center mb-1">
          <span className="text-sm font-medium text-slate-300">{message}</span>
          <span className="text-xs text-slate-500">{progress}%</span>
        </div>
        <div className="w-full h-2 bg-surface-secondary rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-primary-glow to-emerald-400 transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Details List */}
      {details.length > 0 && (
        <div className="space-y-1 max-h-32 overflow-y-auto">
          {details.map((detail, index) => (
            <div 
              key={index}
              className="text-xs text-slate-400 flex items-center gap-2 animate-slideIn"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <span className="w-1.5 h-1.5 bg-primary-glow rounded-full" />
              {detail}
            </div>
          ))}
        </div>
      )}

      {/* Loading Spinner for active steps */}
      {isLoading && step !== 'complete' && step !== 'error' && (
        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-surface-border">
          <div className="w-4 h-4 border-2 border-primary-glow border-t-transparent rounded-full animate-spin" />
          <span className="text-xs text-slate-500">
            {step === 'analysis' ? 'This may take a moment...' : 'Processing...'}
          </span>
        </div>
      )}

      {/* Completion Message */}
      {step === 'complete' && (
        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-surface-border text-emerald-400">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span className="text-xs font-medium">Analysis ready! Scroll down to see results.</span>
        </div>
      )}

      {/* Error State */}
      {step === 'error' && (
        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-surface-border text-rose-400">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
          <span className="text-xs font-medium">Analysis failed. Please try again.</span>
        </div>
      )}
    </div>
  );
}
