/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      colors: {
        diwali: {
          gold: '#FFD700',
          amber: '#F59E0B',
          flame: '#DC2626',
          crimson: '#991B1B',
          night: '#0F172A',
          card: '#1E293B'
        }
      },
      fontFamily: {
        sans: ['Inter', 'Outfit', 'sans-serif'],
      },
      boxShadow: {
        'glow-gold': '0 0 25px rgba(245, 158, 11, 0.4)',
        'glow-red': '0 0 25px rgba(220, 38, 38, 0.4)',
      }
    },
  },
  plugins: [],
}
