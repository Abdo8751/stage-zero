import { type HTMLAttributes } from 'react'

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'gold' | 'pending' | 'success' | 'approved' | 'warning' | 'rejected' | 'muted' | 'blue'
}

const variants = {
  default:  'bg-[rgba(240,230,208,0.08)] border-[rgba(240,230,208,0.14)] text-cream-muted',
  gold:     'bg-[rgba(232,165,60,0.12)]  border-[rgba(232,165,60,0.28)]  text-amber',
  pending:  'bg-[rgba(232,165,60,0.12)]  border-[rgba(232,165,60,0.28)]  text-amber',
  success:  'bg-[rgba(52,199,89,0.10)]   border-[rgba(52,199,89,0.25)]   text-[#30D158]',
  approved: 'bg-[rgba(52,199,89,0.10)]   border-[rgba(52,199,89,0.25)]   text-[#30D158]',
  warning:  'bg-[rgba(255,159,10,0.10)]  border-[rgba(255,159,10,0.25)]  text-[#FF9F0A]',
  rejected: 'bg-[rgba(255,69,58,0.10)]   border-[rgba(255,69,58,0.25)]   text-[#FF453A]',
  muted:    'bg-[rgba(255,255,255,0.04)] border-[rgba(255,255,255,0.08)] text-cream-subtle',
  blue:     'bg-[rgba(75,124,246,0.12)]  border-[rgba(75,124,246,0.28)]  text-blue-bright',
}

export function Badge({ variant = 'default', className = '', children, ...props }: BadgeProps) {
  return (
    <span
      className={`
        inline-flex items-center px-2.5 py-0.5 rounded-[6px] border
        text-[10px] font-semibold tracking-[0.09em] uppercase
        ${variants[variant]} ${className}
      `}
      {...props}
    >
      {children}
    </span>
  )
}
