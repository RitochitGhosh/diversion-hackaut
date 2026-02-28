import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['Space Grotesk', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        neo: {
          yellow: '#FDE047',
          pink: '#F9A8D4',
          blue: '#93C5FD',
          green: '#86EFAC',
          orange: '#FCA5A5',
          purple: '#C4B5FD',
          cream: '#FEFCE8',
          black: '#0A0A0A',
        },
      },
      boxShadow: {
        brutal: '4px 4px 0px 0px #0A0A0A',
        'brutal-lg': '8px 8px 0px 0px #0A0A0A',
        'brutal-sm': '2px 2px 0px 0px #0A0A0A',
        'brutal-yellow': '4px 4px 0px 0px #FDE047',
        'brutal-blue': '4px 4px 0px 0px #93C5FD',
        'brutal-pink': '4px 4px 0px 0px #F9A8D4',
        'brutal-green': '4px 4px 0px 0px #86EFAC',
      },
      borderWidth: {
        '3': '3px',
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'spin-slow': 'spin 8s linear infinite',
        'marquee': 'marquee 20s linear infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        marquee: {
          '0%': { transform: 'translateX(0%)' },
          '100%': { transform: 'translateX(-50%)' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
