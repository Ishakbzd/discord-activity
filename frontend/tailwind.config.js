/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        discord: {
          blurple: '#5865F2',
          green: '#57F287',
          yellow: '#FEE75C',
          fuchsia: '#EB459E',
          red: '#ED4245',
          dark: '#1E1F22',
          darker: '#111214',
          sidebar: '#2B2D31',
          card: '#313338',
          hover: '#35373C',
          text: '#DBDEE1',
          muted: '#949BA4',
        },
      },
      fontFamily: {
        sans: ['"gg sans"', 'Whitney', 'Helvetica Neue', 'Helvetica', 'Arial', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
