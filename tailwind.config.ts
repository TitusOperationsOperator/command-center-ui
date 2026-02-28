import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Burnt orange — primary system accent
        neon: {
          DEFAULT: '#e8721a',
          dim: '#c45f14',
          glow: 'rgba(232, 114, 26, 0.15)',
          border: 'rgba(232, 114, 26, 0.25)',
        },
        // Gold stays for warnings/highlights
        gold: {
          DEFAULT: '#ffd700',
          dim: '#ccac00',
          glow: 'rgba(255, 215, 0, 0.15)',
          border: 'rgba(255, 215, 0, 0.25)',
        },
        // Burnt orange variants for direct use
        orange: {
          DEFAULT: '#e8721a',
          light: '#f09030',
          dim: '#c45f14',
          dark: '#a04d10',
          glow: 'rgba(232, 114, 26, 0.15)',
          border: 'rgba(232, 114, 26, 0.30)',
        },
        space: {
          DEFAULT: '#0a0c14',
          light: '#12151f',
          card: '#0e1018',
          hover: '#181c28',
        },
        agent: {
          titus: '#3b82f6',
          looty: '#ffd700',
          bolt: '#22c55e',
        },
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        chart: {
          '1': 'hsl(var(--chart-1))',
          '2': 'hsl(var(--chart-2))',
          '3': 'hsl(var(--chart-3))',
          '4': 'hsl(var(--chart-4))',
          '5': 'hsl(var(--chart-5))',
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
        pulse_glow: {
          '0%, 100%': { boxShadow: '0 0 8px rgba(232, 114, 26, 0.4)' },
          '50%': { boxShadow: '0 0 20px rgba(232, 114, 26, 0.8)' },
        },
        pulse_dot: {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.6', transform: 'scale(1.3)' },
        },
        scanline: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100%)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'pulse-glow': 'pulse_glow 2s ease-in-out infinite',
        'pulse-dot': 'pulse_dot 2s ease-in-out infinite',
        scanline: 'scanline 8s linear infinite',
        shimmer: 'shimmer 2s ease-in-out infinite',
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};
export default config;
