import { type ButtonHTMLAttributes } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive'
  size?: 'sm' | 'md' | 'lg'
  fullWidth?: boolean
}

const variants = {
  primary:
    'btn-cream-gloss ' +
    'bg-gradient-to-b from-[#FDF6E4] to-[#E2CF9E] ' +
    'text-[#040B1A] font-bold ' +
    'border border-[rgba(255,255,255,0.45)] rounded-btn ' +
    'shadow-[0_0_24px_rgba(232,185,80,0.30),0_4px_16px_rgba(0,0,0,0.45),0_1px_0_rgba(255,255,255,0.50)_inset] ' +
    'hover:from-[#FFFFFF] hover:to-[#EEE0B8] hover:shadow-[0_0_32px_rgba(232,185,80,0.45),0_6px_20px_rgba(0,0,0,0.40)] ' +
    'active:scale-[0.97] transition-all duration-150',
  secondary:
    'bg-[rgba(240,230,208,0.09)] backdrop-blur-[20px] ' +
    'border border-[rgba(240,230,208,0.28)] rounded-btn ' +
    'text-cream font-semibold ' +
    'shadow-[0_1px_0_rgba(240,230,208,0.10)_inset] ' +
    'hover:bg-[rgba(240,230,208,0.16)] hover:border-[rgba(240,230,208,0.42)] ' +
    'active:scale-[0.97] transition-all duration-150',
  outline:
    'bg-transparent border border-[rgba(240,230,208,0.30)] rounded-btn ' +
    'text-cream font-medium ' +
    'hover:bg-[rgba(240,230,208,0.07)] hover:border-[rgba(240,230,208,0.50)] ' +
    'active:scale-[0.97] transition-all duration-150',
  ghost:
    'bg-transparent border border-transparent rounded-btn ' +
    'text-cream-muted hover:text-cream hover:bg-[rgba(255,255,255,0.05)] ' +
    'active:scale-[0.97] transition-all duration-150',
  destructive:
    'bg-[rgba(255,69,58,0.08)] border border-[rgba(255,69,58,0.25)] rounded-btn ' +
    'text-[#FF453A] hover:bg-[rgba(255,69,58,0.14)] ' +
    'active:scale-[0.97] transition-all duration-150',
}

const sizes = {
  sm: 'px-4 py-2 text-[13px] tracking-[-0.01em]',
  md: 'px-5 py-2.5 text-[14px] tracking-[-0.01em]',
  lg: 'px-8 py-4 text-[15px] tracking-[-0.01em]',
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
        inline-flex items-center justify-center font-sans font-medium cursor-pointer
        disabled:opacity-40 disabled:cursor-not-allowed
        ${variants[variant]} ${sizes[size]} ${fullWidth ? 'w-full' : ''} ${className}
      `}
      {...props}
    >
      {children}
    </button>
  )
}
