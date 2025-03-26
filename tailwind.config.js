module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      animation: {
        'float-slow': 'float 8s ease-in-out infinite',
        'float-medium': 'float 6s ease-in-out infinite',
        'float-fast': 'float 4s ease-in-out infinite',
        'float': 'float 6s ease-in-out infinite',
        'float-slower': 'float 10s ease-in-out infinite',
        'pulse-slow': 'pulse 6s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'pulse-slower': 'pulse 8s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'draw': 'draw 3s ease-in-out infinite',
        'particle-1': 'particle 5s ease-in-out infinite',
        'particle-2': 'particle 7s ease-in-out infinite alternate',
        'particle-3': 'particle 6s ease-in-out infinite',
        'particle-4': 'particle 8s ease-in-out infinite alternate',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0) rotate(var(--tw-rotate, 0))' },
          '50%': { transform: 'translateY(-10px) rotate(var(--tw-rotate, 0))' },
        },
        draw: {
          '0%': { 'stroke-dasharray': '1, 150', 'stroke-dashoffset': '0' },
          '50%': { 'stroke-dasharray': '90, 150', 'stroke-dashoffset': '-35' },
          '100%': { 'stroke-dasharray': '90, 150', 'stroke-dashoffset': '-124' },
        },
        particle: {
          '0%': { transform: 'scale(1) translateY(0)', opacity: '0.3' },
          '50%': { transform: 'scale(1.5) translateY(-20px)', opacity: '0.8' },
          '100%': { transform: 'scale(1) translateY(0)', opacity: '0.3' },
        },
        pulse: {
          '0%, 100%': { opacity: 1 },
          '50%': { opacity: 0.5 },
        },
      },
      backgroundImage: {
        'radial-gradient': 'radial-gradient(circle at center, transparent 0%, rgba(0, 0, 0, 0.8) 70%)',
      },
    },
  },
  plugins: [],
}