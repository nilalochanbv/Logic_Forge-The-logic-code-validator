/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cyber: {
          bg: "#09090b", // zinc-950
          dark: "#18181b", // zinc-900
          light: "#a1a1aa", // zinc-400
          cyan: "#3b82f6", // blue-500
          teal: "#71717a", // zinc-500
          purple: "#6366f1", // indigo-500
          pink: "#ef4444", // red-500
          green: "#10b981", // emerald-500
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      boxShadow: {
        'neon-cyan': '0 4px 12px rgba(0, 0, 0, 0.5)',
        'neon-pink': '0 4px 12px rgba(0, 0, 0, 0.5)',
        'neon-green': '0 4px 12px rgba(0, 0, 0, 0.5)',
        'neon-purple': '0 4px 12px rgba(0, 0, 0, 0.5)',
      }
    },
  },
  plugins: [],
}
