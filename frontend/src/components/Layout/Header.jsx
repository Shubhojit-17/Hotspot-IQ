/**
 * Header Component
 * App header with branding
 */

export default function Header() {
  return (
    <header className="bg-surface-elevated/80 backdrop-blur-sm border-b border-surface-border px-4 py-3 flex items-center justify-between">
      <div className="flex items-center gap-3">
        {/* Logo */}
        <div className="w-10 h-10 flex items-center justify-center">
          <img src="/logo.svg" alt="Hotspot IQ" className="w-10 h-10" />
        </div>
        
        {/* Brand */}
        <div>
          <h1 className="text-lg font-bold text-slate-100 tracking-tight">
            Hotspot<span className="text-primary-glow">IQ</span>
          </h1>
          <p className="text-xs text-slate-500">
            Location Intelligence Platform
          </p>
        </div>
      </div>
      
      {/* Powered by */}
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <span>Powered by</span>
        <span className="text-primary-glow font-medium">LatLong.ai</span>
      </div>
    </header>
  );
}
