/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Civic design palette specified in requirements
        primary: {
          DEFAULT: '#1769C2',
          dark: '#123B68',
          light: '#EAF3FF',
          hover: '#1358a3',
          50: '#F0F7FF',
          100: '#EAF3FF',
          200: '#BAE0FF',
          300: '#7CC4FA',
          400: '#38A3F8',
          500: '#1769C2',
          600: '#1358a3',
          700: '#0E4A8E',
          800: '#123B68',
          900: '#0D2E56',
        },
        brand: {
          50: '#F0F7FF',
          100: '#E0EFFF',
          200: '#BAE0FF',
          300: '#7CC4FA',
          400: '#38A3F8',
          500: '#1769C2',
          600: '#0E52A0',
          700: '#0C4182',
          800: '#0B366B',
          900: '#0D2E56',
          DEFAULT: '#1769C2',
        },
        civic: {
          bg: '#FFFFFF',
          text: '#25364A',
          muted: '#64748B',
          card: '#FFFFFF',
          border: '#E2E8F0',
        },
        status: {
          success: '#16A36A',
          warning: '#E6A23C',
          error: '#DC4545',
        },
      },
      boxShadow: {
        '2xs': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        'xs': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
      },
      fontFamily: {
        sans: [
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          '"Noto Sans Devanagari"',
          'sans-serif',
        ],
      },
      screens: {
        'xs': '360px', // Extra small mobile screens common in rural smartphones
      },
    },
  },
  plugins: [],
};
