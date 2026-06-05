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
        cream:          '#0D0F1A',
        'cream-muted':  'rgba(13,15,26,0.68)',
        'cream-subtle': 'rgba(13,15,26,0.45)',
        'blue-accent':  '#4B7CF6',
        'blue-bright':  '#7BA4FF',
        amber:          '#E8A53C',
        'glass-bg':     'rgba(6,14,36,0.55)',
        'glass-bg-hover': 'rgba(10,20,50,0.70)',
        'glass-border': 'rgba(255,255,255,0.08)',
        'glass-border-bright': 'rgba(255,255,255,0.16)',
        /* legacy aliases so existing pages don't break */
        gold:           '#E8A53C',
        'text-primary': '#0D0F1A',
        'text-secondary': 'rgba(13,15,26,0.68)',
        'text-tertiary':  'rgba(13,15,26,0.42)',
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
