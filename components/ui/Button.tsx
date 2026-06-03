import { type ButtonHTMLAttributes } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'destructive'
  size?: 'sm' | 'md' | 'lg'
  fullWidth?: boolean
}

const variants = {
  primary:
    'btn-cream-gloss ' +
    'bg-gradient-to-b from-[#F5EDDB] to-[#DDD0B4] ' +
    'text-[#040B1A] font-semibold ' +
    'border border-[rgba(255,255,255,0.35)] rounded-btn ' +
    'shadow-[0_2px_12px_rgba(0,0,0,0.4),0_1px_0_rgba(255,255,255,0.35)_inset] ' +
    'hover:from-[#FAF3E4] hover:to-[#E5D8BE] ' +
    'active:scale-[0.97] transition-all duration-150',
  secondary:
    'bg-glass-bg backdrop-blur-[20px] ' +
    'border border-glass-border rounded-btn ' +
    'text-cream font-medium ' +
    'shadow-[0_1px_0_rgba(240,230,208,0.05)_inset] ' +
    'hover:bg-glass-bg-hover hover:border-glass-border-bright ' +
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
  lg: 'px-7 py-3.5 text-[15px] tracking-[-0.01em]',
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
