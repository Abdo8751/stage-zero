import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './hooks/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        navy:           '#040B1A',
        'navy-surface': '#070F24',
        cream:          '#F0E6D0',
        'cream-muted':  'rgba(240,230,208,0.60)',
        'cream-subtle': 'rgba(240,230,208,0.32)',
        'blue-accent':  '#4B7CF6',
        'blue-bright':  '#7BA4FF',
        amber:          '#E8A53C',
        'glass-bg':     'rgba(6,14,36,0.55)',
        'glass-bg-hover': 'rgba(10,20,50,0.70)',
        'glass-border': 'rgba(255,255,255,0.08)',
        'glass-border-bright': 'rgba(255,255,255,0.16)',
        /* legacy aliases so existing pages don't break */
        gold:           '#E8A53C',
        'text-primary': '#F0E6D0',
        'text-secondary': 'rgba(240,230,208,0.60)',
        'text-tertiary':  'rgba(240,230,208,0.32)',
        'bg-base':      '#040B1A',
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
      },
      letterSpacing: {
        tightest: '-0.05em',
        tighter:  '-0.035em',
        tight:    '-0.02em',
      },
      borderRadius: {
        card:  '20px',
        input: '12px',
        btn:   '10px',
      },
    },
  },
  plugins: [],
}

export default config
