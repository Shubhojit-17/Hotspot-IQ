/**
 * LoadingProgress Component - Compact Top-Right Loader
 * Glass-morphic floating card showing dynamic step-by-step progress
 */

// Define all analysis steps in order
const ANALYSIS_STEPS = [
  { id: 'validation', label: 'Validating location', icon: '🛡️' },
  { id: 'boundary', label: 'Area boundary loaded', icon: '🗺️' },
  { id: 'analysis', label: 'Analyzing location', icon: '🔍' },
  { id: 'competitors', label: 'Competitors found', icon: '🏪' },
  { id: 'landmarks', label: 'Landmarks identified', icon: '🏛️' },
  { id: 'digipin', label: 'Location code retrieved', icon: '📌' },
  { id: 'spots', label: 'Optimal spots found', icon: '🎯' },
];

// Get step index for comparison
const getStepIndex = (stepId) => {
  const index = ANALYSIS_STEPS.findIndex(s => s.id === stepId);
  return index === -1 ? -1 : index;
};

export default function LoadingProgress({ status, isLoading }) {
  if (!isLoading && status.step === '') return null;

  const { step, message, progress, details } = status;

  // Don't render if complete and not loading
  if (step === 'complete' && !isLoading) return null;

  const currentStepIndex = getStepIndex(step);

  return (
    <div className="fixed top-6 right-6 z-50 animate-fadeIn">
      <div className="backdrop-blur-xl bg-slate-900/90 border border-white/10 rounded-2xl p-4 shadow-2xl shadow-black/30 min-w-[300px] max-w-[340px]">
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

        {/* Step-by-step checklist */}
        <div className="space-y-1.5 max-h-[200px] overflow-y-auto">
          {ANALYSIS_STEPS.map((analysisStep, index) => {
            const stepIndex = getStepIndex(analysisStep.id);
            const isCompleted = currentStepIndex > stepIndex || step === 'complete';
            const isCurrent = currentStepIndex === stepIndex && step !== 'complete' && step !== 'error';
            const isPending = currentStepIndex < stepIndex && step !== 'complete';
            
            // Get dynamic detail from the details array for completed steps
            const detail = details.find(d => d.includes(analysisStep.icon));
            const displayLabel = detail ? detail.replace(analysisStep.icon, '').trim() : analysisStep.label;
            
            return (
              <div 
                key={analysisStep.id} 
                className={`flex items-center gap-2.5 text-xs py-1 px-2 rounded-lg transition-all duration-300 ${
                  isCompleted ? 'bg-emerald-500/10 text-emerald-400' :
                  isCurrent ? 'bg-cyan-500/10 text-cyan-400' :
                  'bg-transparent text-slate-500'
                }`}
              >
                {/* Status indicator */}
                <div className="flex-shrink-0 w-5 h-5 flex items-center justify-center">
                  {isCompleted ? (
                    <div className="w-4 h-4 rounded-full bg-emerald-500/30 border border-emerald-400/50 flex items-center justify-center">
                      <svg className="w-2.5 h-2.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  ) : isCurrent ? (
                    <div className="w-4 h-4 rounded-full border-2 border-cyan-400/50 border-t-cyan-400 animate-spin" />
                  ) : (
                    <div className="w-3 h-3 rounded-full border border-slate-600 bg-slate-800/50" />
                  )}
                </div>
                
                {/* Icon */}
                <span className="flex-shrink-0">{analysisStep.icon}</span>
                
                {/* Label */}
                <span className={`truncate ${isCompleted ? 'font-medium' : ''}`}>
                  {displayLabel}
                </span>
              </div>
            );
          })}
        </div>

        {/* Completion hint */}
        {step === 'complete' && (
          <p className="text-xs text-emerald-400/80 mt-3 pt-2 border-t border-white/5">
            ✨ Click anywhere to view detailed results →
          </p>
        )}
        
        {/* Error hint */}
        {step === 'error' && (
          <p className="text-xs text-rose-400/80 mt-3 pt-2 border-t border-white/5">
            ⚠️ Please try again with a different location.
          </p>
        )}
      </div>
    </div>
  );
}
