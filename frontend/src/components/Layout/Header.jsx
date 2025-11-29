/**
 * Header Component - Floating Island Design
 * Glass-morphic Command Center aesthetic
 */

export default function Header({ isDarkMode, onToggleTheme }) {
  return (
    <header className="fixed top-4 left-1/2 -translate-x-1/2 w-[92%] max-w-6xl z-50">
      <div className={`backdrop-blur-xl ${isDarkMode ? 'bg-slate-900/80 border-white/10' : 'bg-white/80 border-slate-200'} border rounded-full px-4 py-2 flex items-center justify-between shadow-xl ${isDarkMode ? 'shadow-black/20' : 'shadow-slate-300/30'}`}>
        {/* Left: Logo & Brand */}
        <div className="flex items-center gap-2">
          {/* Logo Image */}
          <div className="w-8 h-8 flex items-center justify-center">
            <img
              src="/hotspot-logo.png"
              alt="Hotspot IQ"
              className="w-8 h-8 object-contain"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'flex';
              }}
            />
            {/* Fallback gradient icon */}
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-cyan-500 items-center justify-center hidden">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
          </div>

          {/* Brand Text */}
          <div className="leading-tight">
            <h1 className="text-base font-bold tracking-tight">
              <span className="bg-gradient-to-r from-emerald-400 via-cyan-400 to-emerald-400 bg-clip-text text-transparent">
                Hotspot
              </span>
              <span className={isDarkMode ? 'text-white' : 'text-slate-800'}>IQ</span>
            </h1>
            <p className={`text-[9px] ${isDarkMode ? 'text-slate-500' : 'text-slate-400'} tracking-wider uppercase -mt-0.5`}>
              Location Intelligence
            </p>
          </div>
        </div>

        {/* Right: Navigation & Links */}
        <div className="flex items-center gap-3">
          {/* Nav Links */}
          <nav className="hidden md:flex items-center">
            <a href="#" className={`px-3 py-1.5 text-xs ${isDarkMode ? 'text-slate-400 hover:text-white hover:bg-white/5' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'} rounded-full transition-all duration-200`}>
              Dashboard
            </a>
            <a href="#" className={`px-3 py-1.5 text-xs ${isDarkMode ? 'text-slate-400 hover:text-white hover:bg-white/5' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'} rounded-full transition-all duration-200`}>
              Analytics
            </a>
            <a href="https://apihub.latlong.ai/Documentation" target="_blank" rel="noopener noreferrer" className="px-3 py-1.5 text-xs text-slate-400 hover:text-white hover:bg-white/5 rounded-full transition-all duration-200">
              API Docs
            </a>
          </nav>

          {/* Divider */}
          <div className={`hidden md:block w-px h-5 ${isDarkMode ? 'bg-white/10' : 'bg-slate-200'}`} />

          {/* Powered By */}
          <div className="hidden sm:flex items-center gap-1.5 text-[11px]">
            <span className={isDarkMode ? 'text-slate-500' : 'text-slate-400'}>Powered by</span>
            <span className="text-emerald-500 font-semibold">LatLong.ai</span>
          </div>

          {/* Theme Toggle Button */}
          <button
            onClick={onToggleTheme}
            className={`w-8 h-8 flex items-center justify-center rounded-full ${isDarkMode ? 'bg-white/5 hover:bg-white/10 border-white/10 hover:border-white/20' : 'bg-slate-100 hover:bg-slate-200 border-slate-200 hover:border-slate-300'} border transition-all duration-200 group`}
            title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {isDarkMode ? (
              // Sun icon for light mode
              <svg className="w-4 h-4 text-amber-400 group-hover:text-amber-300 transition-colors" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2.25a.75.75 0 01.75.75v2.25a.75.75 0 01-1.5 0V3a.75.75 0 01.75-.75zM7.5 12a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM18.894 6.166a.75.75 0 00-1.06-1.06l-1.591 1.59a.75.75 0 101.06 1.061l1.591-1.59zM21.75 12a.75.75 0 01-.75.75h-2.25a.75.75 0 010-1.5H21a.75.75 0 01.75.75zM17.834 18.894a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 10-1.061 1.06l1.59 1.591zM12 18a.75.75 0 01.75.75V21a.75.75 0 01-1.5 0v-2.25A.75.75 0 0112 18zM7.758 17.303a.75.75 0 00-1.061-1.06l-1.591 1.59a.75.75 0 001.06 1.061l1.591-1.59zM6 12a.75.75 0 01-.75.75H3a.75.75 0 010-1.5h2.25A.75.75 0 016 12zM6.697 7.757a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 00-1.061 1.06l1.59 1.591z" />
              </svg>
            ) : (
              // Moon icon for dark mode
              <svg className="w-4 h-4 text-slate-500 group-hover:text-slate-700 transition-colors" fill="currentColor" viewBox="0 0 24 24">
                <path fillRule="evenodd" d="M9.528 1.718a.75.75 0 01.162.819A8.97 8.97 0 009 6a9 9 0 009 9 8.97 8.97 0 003.463-.69.75.75 0 01.981.98 10.503 10.503 0 01-9.694 6.46c-5.799 0-10.5-4.701-10.5-10.5 0-4.368 2.667-8.112 6.46-9.694a.75.75 0 01.818.162z" clipRule="evenodd" />
              </svg>
            )}
          </button>

          {/* GitHub Link */}
          <a
            href="https://github.com/Shubhojit-17/Hotspot-IQ"
            target="_blank"
            rel="noopener noreferrer"
            className={`w-7 h-7 flex items-center justify-center rounded-full ${isDarkMode ? 'bg-white/5 hover:bg-white/10 border-white/10 hover:border-white/20' : 'bg-slate-100 hover:bg-slate-200 border-slate-200 hover:border-slate-300'} border transition-all duration-200 group`}
          >
            <svg className={`w-4 h-4 ${isDarkMode ? 'text-slate-400 group-hover:text-white' : 'text-slate-500 group-hover:text-slate-800'} transition-colors`} fill="currentColor" viewBox="0 0 24 24">
              <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.87 8.17 6.84 9.5.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34-.46-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.87 1.52 2.34 1.07 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.92 0-1.11.38-2 1.03-2.71-.1-.25-.45-1.29.1-2.64 0 0 .84-.27 2.75 1.02.79-.22 1.65-.33 2.5-.33.85 0 1.71.11 2.5.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.35.2 2.39.1 2.64.65.71 1.03 1.6 1.03 2.71 0 3.82-2.34 4.66-4.57 4.91.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0012 2z" />
            </svg>
          </a>
        </div>
      </div>
    </header>
  );
}
