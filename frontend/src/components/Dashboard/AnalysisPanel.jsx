/**
 * Analysis Panel Component
 * Combines all analysis cards in a slide-out panel
 */

import RecommendedSpotsCard from './RecommendedSpotsCard';
import CompetitorCard from './CompetitorCard';
import LandmarksCard from './LandmarksCard';

export default function AnalysisPanel({
  analysis,
  isLoading,
  isOpen,
  onClose,
  onViewSpot,
  onOpenChat
}) {
  if (!isOpen) return null;

  return (
    <>
      {/* Clickable backdrop - transparent, no blur to keep map visible */}
      <div
        className="fixed inset-0 z-40"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-slate-950/95 backdrop-blur-md border-l border-white/10 z-50 overflow-hidden flex flex-col animate-slide-in-right shadow-2xl shadow-black/50">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10 bg-slate-900">
          <div>
            <h2 className="text-lg font-semibold text-slate-100">
              Location Analysis
            </h2>
            {analysis?.location && (
              <p className="text-sm text-slate-400 truncate max-w-[280px]">
                {analysis.location.name || analysis.address?.formatted_address || `${analysis.location.lat?.toFixed(4)}, ${analysis.location.lng?.toFixed(4)}`}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-surface-secondary transition-colors text-slate-400 hover:text-slate-200"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Summary stats */}
          {!isLoading && analysis && (
            <div className="grid grid-cols-3 gap-2">
              <div className="glass-panel p-3 text-center">
                <div className="text-2xl font-bold text-emerald-400">
                  {analysis?.recommended_spots?.length || 0}
                </div>
                <div className="text-[10px] text-slate-500 uppercase tracking-wide">
                  Optimal Spots
                </div>
              </div>
              <div className="glass-panel p-3 text-center">
                <div className="text-2xl font-bold text-rose-400">
                  {analysis?.competitors?.count || 0}
                </div>
                <div className="text-[10px] text-slate-500 uppercase tracking-wide">
                  Competitors
                </div>
              </div>
              <div className="glass-panel p-3 text-center">
                <div className="text-2xl font-bold text-cyan-400">
                  {analysis?.landmarks?.total || 0}
                </div>
                <div className="text-[10px] text-slate-500 uppercase tracking-wide">
                  Landmarks
                </div>
              </div>
            </div>
          )}

          {/* Recommended Spots - Primary focus */}
          <RecommendedSpotsCard
            spots={analysis?.recommended_spots || []}
            isLoading={isLoading}
            onViewSpot={onViewSpot}
          />

          {/* Competitors */}
          <CompetitorCard
            competitors={analysis?.competitors?.nearby || []}
            isLoading={isLoading}
          />

          {/* Landmarks */}
          <LandmarksCard
            landmarks={analysis?.landmarks?.list || []}
            isLoading={isLoading}
          />

          {/* DIGIPIN */}
          {!isLoading && analysis?.location?.digipin && (
            <div className="glass-panel p-4">
              <h3 className="text-sm font-medium text-slate-400 mb-2 flex items-center gap-2">
                <img src="/icons/location-pin.svg" alt="" className="w-5 h-5" style={{ filter: 'invert(68%) sepia(51%) saturate(1016%) hue-rotate(359deg) brightness(101%) contrast(96%)' }} />
                DIGIPIN
              </h3>
              <div className="bg-surface-secondary rounded-lg p-3">
                <p className="font-mono text-primary-glow text-lg tracking-wider text-center">
                  {analysis.location.digipin}
                </p>
              </div>
              <p className="text-xs text-slate-500 mt-2 text-center">
                India Post digital address
              </p>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="p-4 border-t border-surface-border bg-surface-elevated">
          <div className="grid grid-cols-2 gap-3">
            <button className="px-4 py-2 bg-surface-secondary text-slate-300 rounded-lg hover:bg-slate-700 transition-colors text-sm">
              Export Report
            </button>
            <button
              onClick={onOpenChat}
              className="btn-primary text-sm"
            >
              Ask AI Assistant
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
