import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{js,ts,jsx,tsx,mdx}', './components/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        berry: '#ec4899',
        honey: '#facc15',
        meadow: '#86efac',
        lagoon: '#67e8f9',
        story: '#fff7ed',
      },
      fontFamily: {
        rounded: ['var(--font-rounded)', 'Nunito', 'Comic Sans MS', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 22px 55px rgba(74, 54, 124, 0.18)',
      },
      keyframes: {
        floaty: {
          '0%, 100%': { transform: 'translateY(0) rotate(-2deg)' },
          '50%': { transform: 'translateY(-10px) rotate(2deg)' },
        },
        sparkle: {
          '0%': { transform: 'scale(.7)', opacity: '.45' },
          '50%': { transform: 'scale(1.15)', opacity: '1' },
          '100%': { transform: 'scale(.7)', opacity: '.45' },
        },
        rewardPop: {
          '0%': { transform: 'scale(.3) rotate(-12deg)', opacity: '0' },
          '70%': { transform: 'scale(1.08) rotate(3deg)', opacity: '1' },
          '100%': { transform: 'scale(1) rotate(0)' },
        },
      },
      animation: {
        floaty: 'floaty 4s ease-in-out infinite',
        sparkle: 'sparkle 1.8s ease-in-out infinite',
        rewardPop: 'rewardPop .7s cubic-bezier(.2,1,.2,1) both',
      },
    },
  },
  plugins: [],
};

export default config;
