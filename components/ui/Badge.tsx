import { type HTMLAttributes } from 'react'

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'gold' | 'success' | 'warning' | 'muted'
}

const variants = {
  default: 'bg-navy/10 text-navy',
  gold: 'bg-gold/20 text-navy border border-gold/40',
  success: 'bg-emerald-100 text-emerald-800',
  warning: 'bg-amber-100 text-amber-800',
  muted: 'bg-muted/20 text-muted',
}

export function Badge({ variant = 'default', className = '', children, ...props }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 text-xs font-medium uppercase tracking-wider ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </span>
  )
}
