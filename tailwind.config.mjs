/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,ts,tsx,md,mdx}'],
  theme: {
    // knowledge.md §6 — colors are given roles, not used as even blocks.
    // Only Folly/Byzantine are wired as broad utility colors; the four
    // "tag" colors are exposed too but meant for small accents (badges,
    // activity icons), enforced by convention/review, not by Tailwind.
    colors: {
      transparent: 'transparent',
      current: 'currentColor',
      white: '#FFFFFF',
      black: '#000000',
      folly: { DEFAULT: '#FF0659', dark: '#D6004A' },
      byzantine: '#BC22B8',
      yellow: '#F7E500',
      pumpkin: '#FF7110',
      teal: '#00DDC2',
      kiwi: '#73D832',
      ivory: '#FFF9F3',
      surface: '#FFFFFF',
      ink: { DEFAULT: '#2B1B26', soft: '#6B5A66' },
      border: '#F0E4DC',
    },
    fontFamily: {
      // knowledge.md §6 typography: Fredoka = primary display, Baloo 2 =
      // alternate display (small badges/eyebrows), Human Sans = body/UI.
      display: ['Fredoka', 'sans-serif'],
      accent: ['"Baloo 2"', 'sans-serif'],
      body: ['"Human Sans"', 'system-ui', 'sans-serif'],
    },
    fontSize: {
      xs: ['0.8rem', { lineHeight: '1.5' }],
      sm: ['0.9rem', { lineHeight: '1.5' }],
      base: ['1rem', { lineHeight: '1.65' }],
      lg: ['1.125rem', { lineHeight: '1.6' }],
      h3: ['1.375rem', { lineHeight: '1.3' }],
      h2: ['1.9rem', { lineHeight: '1.2' }],
      h1: ['2.75rem', { lineHeight: '1.08' }],
      display: ['3.25rem', { lineHeight: '1.03' }],
    },
    borderRadius: {
      none: '0',
      sm: '12px',
      md: '20px',
      lg: '32px',
      full: '9999px',
    },
    boxShadow: {
      soft: '0 8px 30px -8px rgba(43, 27, 38, 0.15)',
      lift: '0 16px 40px -12px rgba(43, 27, 38, 0.22)',
      none: 'none',
    },
    screens: {
      sm: '640px',
      md: '768px',
      lg: '1024px',
      xl: '1280px',
    },
    extend: {
      maxWidth: {
        content: '1180px',
      },
    },
  },
  plugins: [],
};
