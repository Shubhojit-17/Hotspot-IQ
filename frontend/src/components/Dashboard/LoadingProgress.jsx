/**
 * LoadingProgress Component - Compact Top-Right Loader
 * Glass-morphic floating card in the extreme top-right corner
 */

export default function LoadingProgress({ status, isLoading }) {
  if (!isLoading && status.step === '') return null;

  const { step, message, progress, details } = status;

  // Don't render if complete and not loading
  if (step === 'complete' && !isLoading) return null;

  return (
    <div className="fixed top-6 right-6 z-50 animate-fadeIn">
      <div className="backdrop-blur-xl bg-slate-900/90 border border-white/10 rounded-2xl p-4 shadow-2xl shadow-black/30 min-w-[280px] max-w-[320px]">
        {/* Header with spinner */}
        <div className="flex items-center gap-3 mb-3">
          {/* Spinning Emerald Ring */}
          {isLoading && step !== 'complete' && step !== 'error' && (
            <div className="relative w-10 h-10 flex-shrink-0">
              <div className="absolute inset-0 rounded-full border-2 border-emerald-500/20" />
              <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-emerald-400 animate-spin" />
              <div className="absolute inset-2 rounded-full bg-emerald-500/10 flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              </div>
            </div>
          )}
          
          {/* Completion icon */}
          {step === 'complete' && (
            <div className="w-10 h-10 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          )}
          
          {/* Error icon */}
          {step === 'error' && (
            <div className="w-10 h-10 rounded-full bg-rose-500/20 border border-rose-500/30 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
          )}

          {/* Status text */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">
              {step === 'complete' ? 'Analysis Complete!' : step === 'error' ? 'Analysis Failed' : 'Processing...'}
            </p>
            <p className="text-xs text-slate-400 truncate">{message}</p>
          </div>

          {/* Progress percentage */}
          <div className="text-right flex-shrink-0">
            <span className="text-lg font-bold text-emerald-400">{progress}%</span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden mb-3">
          <div 
            className="h-full bg-gradient-to-r from-emerald-500 via-cyan-400 to-emerald-500 transition-all duration-500 ease-out rounded-full"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* All details list */}
        {details.length > 0 && (
          <div className="space-y-1.5 max-h-[120px] overflow-y-auto">
            {details.map((detail, index) => (
              <div key={index} className="flex items-center gap-2 text-xs text-slate-400">
                <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${index === details.length - 1 ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'}`} />
                <span className="truncate">{detail}</span>
              </div>
            ))}
          </div>
        )}

        {/* Completion hint */}
        {step === 'complete' && (
          <p className="text-xs text-emerald-400/80 mt-2">Click the stats panel to view results →</p>
        )}
        
        {/* Error hint */}
        {step === 'error' && (
          <p className="text-xs text-rose-400/80 mt-2">Please try again with a different location.</p>
        )}
      </div>
    </div>
  );
}
