import { type ButtonHTMLAttributes } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive'
  size?: 'sm' | 'md' | 'lg'
  fullWidth?: boolean
}

const variants = {
  primary:
    'bg-blue-accent text-white font-semibold rounded-full border border-blue-accent ' +
    'shadow-[0_8px_24px_rgba(75,124,246,.20)] hover:bg-blue-bright hover:border-blue-bright ' +
    'active:scale-[0.98] transition-all duration-150',
  secondary:
    'bg-paper border border-ink/15 rounded-full text-ink font-semibold ' +
    'shadow-[0_4px_16px_rgba(8,10,20,.06)] hover:bg-warm-cream hover:border-ink/25 ' +
    'active:scale-[0.98] transition-all duration-150',
  outline:
    'bg-transparent border border-ink/20 rounded-full text-ink font-semibold ' +
    'hover:bg-paper hover:border-ink/35 active:scale-[0.98] transition-all duration-150',
  ghost:
    'bg-transparent border border-transparent rounded-full text-ink/60 font-semibold ' +
    'hover:text-ink hover:bg-paper/70 active:scale-[0.98] transition-all duration-150',
  destructive:
    'bg-red-50 border border-red-700/25 rounded-full text-red-700 font-semibold ' +
    'hover:bg-red-100 active:scale-[0.98] transition-all duration-150',
}

const sizes = {
  sm: 'px-4 py-2.5 text-[12px] gap-1.5',
  md: 'px-5 py-3.5 text-[14px] gap-2',
  lg: 'px-7 py-4 text-[15px] gap-2',
}

export function Button({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  className = '',
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`inline-flex cursor-pointer items-center justify-center font-sans disabled:cursor-not-allowed disabled:opacity-40 ${variants[variant]} ${sizes[size]} ${fullWidth ? 'w-full' : ''} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
