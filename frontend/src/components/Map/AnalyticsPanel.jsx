import React from 'react';

const AnalyticsPanel = ({
  stats = { spots: 0, competitors: 0, landmarks: 0 },
  toggles = {
    showLandmarks: false,
    setShowLandmarks: () => {},
    showCompetitors: false,
    setShowCompetitors: () => {},
    heatmapEnabled: false,
    setHeatmapEnabled: () => {},
    contextualVisibility: false,
    setContextualVisibility: () => {},
    showSpots: false,
    setShowSpots: () => {},
  },
  businessType = 'Business',
  onOpenPanel,
  isDarkMode = true
}) => {
  return (
    <div className={`fixed bottom-6 right-6 w-96 backdrop-blur-md border shadow-xl rounded-2xl overflow-hidden z-[1000] flex flex-col gap-4 p-4 transition-colors duration-300 ${
      isDarkMode 
        ? 'bg-slate-900/90 border-white/10' 
        : 'bg-white/95 border-slate-200'
    }`}>
      
      {/* Section A: Key Metrics */}
      <div className="grid grid-cols-2 gap-4 items-center cursor-pointer" onClick={onOpenPanel}>
        {/* Left: Spots Found */}
        <div className={`text-center border-r pr-4 ${isDarkMode ? 'border-white/10' : 'border-slate-100'}`}>
          <p className="text-4xl font-bold text-emerald-500 leading-none">
            {stats.spots}
          </p>
          <p className={`text-xs font-medium mt-1 uppercase tracking-wide ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
            Spots Found
          </p>
        </div>

        {/* Right: Competitors & Landmarks */}
        <div className="flex flex-col gap-2 pl-2">
          <div className="flex items-center gap-2">
            <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${isDarkMode ? 'bg-rose-500/10' : 'bg-rose-50'}`}>
              <img src="/icons/store.svg" alt="" className={`w-3 h-3 ${isDarkMode ? 'opacity-80 invert' : 'opacity-60'}`} />
            </div>
            <div>
              <p className={`text-sm font-semibold leading-none ${isDarkMode ? 'text-slate-200' : 'text-slate-700'}`}>
                {stats.competitors}
              </p>
              <p className={`text-[10px] font-medium ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>Competitors</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${isDarkMode ? 'bg-cyan-500/10' : 'bg-cyan-50'}`}>
              <img src="/icons/building.svg" alt="" className={`w-3 h-3 ${isDarkMode ? 'opacity-80 invert' : 'opacity-60'}`} />
            </div>
            <div>
              <p className={`text-sm font-semibold leading-none ${isDarkMode ? 'text-slate-200' : 'text-slate-700'}`}>
                {stats.landmarks}
              </p>
              <p className={`text-[10px] font-medium ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>Landmarks</p>
            </div>
          </div>
        </div>
      </div>

      <div className={`h-px w-full ${isDarkMode ? 'bg-white/10' : 'bg-slate-100'}`} />

      {/* Section B: View Controls */}
      <div className="flex flex-col gap-3">
        {/* Main Toggles: Landmarks & Competitors */}
        <div className={`p-1 rounded-xl flex ${isDarkMode ? 'bg-slate-800/50' : 'bg-slate-100'}`}>
          <button
            onClick={() => toggles.setShowLandmarks(!toggles.showLandmarks)}
            className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-2 ${
              toggles.showLandmarks
                ? isDarkMode ? 'bg-slate-700 text-cyan-400 shadow-sm' : 'bg-white text-cyan-600 shadow-sm'
                : isDarkMode ? 'text-slate-400 hover:text-slate-300' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${toggles.showLandmarks ? 'bg-cyan-500' : isDarkMode ? 'bg-slate-600' : 'bg-slate-300'}`} />
            Landmarks
          </button>
          <button
            onClick={() => toggles.setShowCompetitors(!toggles.showCompetitors)}
            className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-2 ${
              toggles.showCompetitors
                ? isDarkMode ? 'bg-slate-700 text-rose-400 shadow-sm' : 'bg-white text-rose-600 shadow-sm'
                : isDarkMode ? 'text-slate-400 hover:text-slate-300' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${toggles.showCompetitors ? 'bg-rose-500' : isDarkMode ? 'bg-slate-600' : 'bg-slate-300'}`} />
            Competitors
          </button>
        </div>

        {/* Secondary Toggles: Heatmap, Spots & Smart */}
        <div className="flex gap-2">
          <button
            onClick={() => toggles.setHeatmapEnabled(!toggles.heatmapEnabled)}
            className={`flex-1 py-2 px-2 rounded-lg border text-[10px] font-medium transition-all flex items-center justify-center gap-1.5 ${
              toggles.heatmapEnabled
                ? isDarkMode 
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' 
                  : 'bg-amber-50 border-amber-200 text-amber-700'
                : isDarkMode
                  ? 'bg-slate-800/30 border-white/5 text-slate-400 hover:bg-slate-800/50'
                  : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
            }`}
          >
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
            Heatmap
          </button>
          
          <button
            onClick={() => toggles.setShowSpots(!toggles.showSpots)}
            className={`flex-1 py-2 px-2 rounded-lg border text-[10px] font-medium transition-all flex items-center justify-center gap-1.5 ${
              toggles.showSpots
                ? isDarkMode
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                  : 'bg-emerald-50 border-emerald-200 text-emerald-700'
                : isDarkMode
                  ? 'bg-slate-800/30 border-white/5 text-slate-400 hover:bg-slate-800/50'
                  : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
            }`}
          >
            <img src="/icons/star.svg" alt="" className={`w-3 h-3 ${toggles.showSpots ? (isDarkMode ? 'invert brightness-0' : '') : 'opacity-50 grayscale'}`} style={isDarkMode && toggles.showSpots ? { filter: 'brightness(0) invert(1) sepia(1) saturate(5) hue-rotate(90deg)' } : {}} />
            Spots
          </button>

          <button
            onClick={() => toggles.setContextualVisibility(!toggles.contextualVisibility)}
            className={`flex-1 py-2 px-2 rounded-lg border text-[10px] font-medium transition-all flex items-center justify-center gap-1.5 ${
              toggles.contextualVisibility
                ? isDarkMode
                  ? 'bg-violet-500/10 border-violet-500/30 text-violet-400'
                  : 'bg-violet-50 border-violet-200 text-violet-700'
                : isDarkMode
                  ? 'bg-slate-800/30 border-white/5 text-slate-400 hover:bg-slate-800/50'
                  : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
            }`}
            title="Adjusts landmark visibility based on relevance"
          >
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            Smart View
          </button>
        </div>
      </div>

      {/* Section C: Legends */}
      {(toggles.heatmapEnabled || toggles.contextualVisibility) && (
        <>
          <div className={`h-px w-full ${isDarkMode ? 'bg-white/10' : 'bg-slate-100'}`} />
          <div className="space-y-3">
            {/* Heatmap Legend */}
            {toggles.heatmapEnabled && (
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className={`text-[10px] font-semibold uppercase tracking-wider ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>Competition Density</span>
                </div>
                <div className="h-2 w-full rounded-full bg-gradient-to-r from-emerald-400 via-yellow-400 to-rose-500" />
                <div className={`flex justify-between text-[10px] mt-1 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                  <span>Low</span>
                  <span>High</span>
                </div>
              </div>
            )}

            {/* Smart View Legend */}
            {toggles.contextualVisibility && (
              <div className={`rounded-lg p-2 border ${isDarkMode ? 'bg-violet-500/10 border-violet-500/20' : 'bg-violet-50/50 border-violet-100'}`}>
                <div className="flex items-center gap-2 mb-1">
                  <svg className={`w-3 h-3 ${isDarkMode ? 'text-violet-400' : 'text-violet-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className={`text-[10px] font-medium ${isDarkMode ? 'text-violet-300' : 'text-violet-700'}`}>Smart Relevance: {businessType}</span>
                </div>
                <div className="flex gap-4">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-cyan-500" />
                    <span className={`text-[10px] ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>High Relevance</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-cyan-500/30" />
                    <span className={`text-[10px] ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Low Relevance</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default AnalyticsPanel;