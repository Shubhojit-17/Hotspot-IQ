/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Canvas - Background layers
        canvas: {
          deep: '#020617',  // slate-950
          base: '#0f172a',  // slate-900
        },
        // Surface - Glass layers
        surface: {
          primary: 'rgba(15, 23, 42, 0.8)',
          secondary: 'rgba(30, 41, 59, 0.7)',
          elevated: 'rgba(51, 65, 85, 0.6)',
          border: 'rgba(255, 255, 255, 0.08)',
        },
        // Primary - Neon Emerald
        primary: {
          glow: '#10b981',     // emerald-500
          bright: '#34d399',   // emerald-400
          soft: 'rgba(16, 185, 129, 0.2)',
          pulse: 'rgba(16, 185, 129, 0.5)',
        },
        // Warning - Amber
        warning: {
          glow: '#f59e0b',     // amber-500
          soft: 'rgba(245, 158, 11, 0.2)',
        },
        // Destructive - Rose
        destructive: {
          glow: '#f43f5e',     // rose-500
          bright: '#fb7185',   // rose-400
          soft: 'rgba(244, 63, 94, 0.2)',
        },
        // Accent
        accent: {
          cyan: '#06b6d4',     // cyan-500
          violet: '#8b5cf6',   // violet-500
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'monospace'],
      },
      boxShadow: {
        'glow-primary': '0 0 20px rgba(16, 185, 129, 0.4), 0 0 40px rgba(16, 185, 129, 0.2)',
        'glow-warning': '0 0 20px rgba(245, 158, 11, 0.4), 0 0 40px rgba(245, 158, 11, 0.2)',
        'glow-destructive': '0 0 20px rgba(244, 63, 94, 0.4), 0 0 40px rgba(244, 63, 94, 0.2)',
        'glow-violet': '0 0 20px rgba(139, 92, 246, 0.4), 0 0 40px rgba(139, 92, 246, 0.2)',
        'glass': '0 8px 32px rgba(0, 0, 0, 0.4)',
      },
      backdropBlur: {
        'glass': '12px',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'slide-in-right': 'slideInRight 0.4s ease-out',
        'slide-in-up': 'slideInUp 0.3s ease-out',
        'fade-in': 'fadeIn 0.2s ease-out',
        'glow-pulse': 'glowPulse 2s ease-in-out infinite',
      },
      keyframes: {
        slideInRight: {
          '0%': { transform: 'translateX(20px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        slideInUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        glowPulse: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(16, 185, 129, 0.4)' },
          '50%': { boxShadow: '0 0 30px rgba(16, 185, 129, 0.6), 0 0 60px rgba(16, 185, 129, 0.3)' },
        },
      },
    },
  },
  plugins: [],
}
