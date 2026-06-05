import { type ButtonHTMLAttributes } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive'
  size?: 'sm' | 'md' | 'lg'
  fullWidth?: boolean
}

const variants = {
  // Dark navy fill + white text — stands out boldly on the cream background
  primary:
    'relative overflow-hidden ' +
    'bg-[#040B1A] ' +
    'text-white font-black tracking-[-0.02em] ' +
    'border border-[rgba(255,255,255,0.18)] rounded-btn ' +
    'shadow-[0_0_0_1px_rgba(240,230,208,0.10)_inset,0_6px_24px_rgba(0,0,0,0.65),0_1px_0_rgba(255,255,255,0.18)_inset] ' +
    'hover:bg-[#061228] hover:border-[rgba(240,218,150,0.50)] ' +
    'hover:shadow-[0_0_28px_rgba(240,218,150,0.28),0_6px_24px_rgba(0,0,0,0.60)] ' +
    'active:scale-[0.97] transition-all duration-150',

  // Cream-glass — secondary action, clearly defined
  secondary:
    'bg-[rgba(255,255,255,0.12)] backdrop-blur-[20px] ' +
    'border border-[rgba(255,255,255,0.35)] rounded-btn ' +
    'text-white font-black tracking-[-0.02em] ' +
    'shadow-[0_1px_0_rgba(255,255,255,0.20)_inset,0_4px_16px_rgba(0,0,0,0.30)] ' +
    'hover:bg-[rgba(255,255,255,0.20)] hover:border-[rgba(255,255,255,0.55)] ' +
    'hover:shadow-[0_1px_0_rgba(255,255,255,0.28)_inset,0_6px_20px_rgba(0,0,0,0.28)] ' +
    'active:scale-[0.97] transition-all duration-150',

  // Outline — third-tier action
  outline:
    'bg-transparent border-2 border-[rgba(255,255,255,0.32)] rounded-btn ' +
    'text-white font-bold tracking-[-0.02em] ' +
    'hover:bg-[rgba(255,255,255,0.08)] hover:border-[rgba(255,255,255,0.55)] ' +
    'active:scale-[0.97] transition-all duration-150',

  ghost:
    'bg-transparent border border-transparent rounded-btn ' +
    'text-[rgba(255,255,255,0.65)] font-semibold ' +
    'hover:text-white hover:bg-[rgba(255,255,255,0.07)] ' +
    'active:scale-[0.97] transition-all duration-150',

  destructive:
    'bg-[rgba(255,69,58,0.10)] border border-[rgba(255,69,58,0.35)] rounded-btn ' +
    'text-[#FF6B6B] font-bold ' +
    'hover:bg-[rgba(255,69,58,0.18)] hover:border-[rgba(255,69,58,0.55)] ' +
    'active:scale-[0.97] transition-all duration-150',
}

const sizes = {
  sm: 'px-4 py-2.5 text-[12px] gap-1.5',
  md: 'px-5 py-3 text-[14px] gap-2',
  lg: 'px-8 py-4 text-[15px] gap-2',
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
      className={`
        inline-flex items-center justify-center font-sans cursor-pointer
        disabled:opacity-40 disabled:cursor-not-allowed
        ${variants[variant]} ${sizes[size]} ${fullWidth ? 'w-full' : ''} ${className}
      `}
      {...props}
    >
      {children}
    </button>
  )
}
