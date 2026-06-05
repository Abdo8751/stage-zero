import { type HTMLAttributes } from 'react'

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'gold' | 'pending' | 'success' | 'approved' | 'warning' | 'rejected' | 'muted' | 'blue'
}

const variants = {
  default:  'bg-[rgba(4,11,26,0.07)]   border-[rgba(4,11,26,0.15)]   text-cream-muted',
  gold:     'bg-[rgba(180,110,10,0.10)] border-[rgba(180,110,10,0.25)] text-[#A06800]',
  pending:  'bg-[rgba(180,110,10,0.10)] border-[rgba(180,110,10,0.25)] text-[#A06800]',
  success:  'bg-[rgba(20,140,60,0.10)]  border-[rgba(20,140,60,0.25)]  text-[#0D7A35]',
  approved: 'bg-[rgba(20,140,60,0.10)]  border-[rgba(20,140,60,0.25)]  text-[#0D7A35]',
  warning:  'bg-[rgba(180,100,0,0.10)]  border-[rgba(180,100,0,0.22)]  text-[#9A5A00]',
  rejected: 'bg-[rgba(180,30,20,0.10)]  border-[rgba(180,30,20,0.22)]  text-[#C0231A]',
  muted:    'bg-[rgba(4,11,26,0.05)]   border-[rgba(4,11,26,0.10)]   text-cream-subtle',
  blue:     'bg-[rgba(40,80,200,0.10)]  border-[rgba(40,80,200,0.22)]  text-[#2A50C8]',
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
