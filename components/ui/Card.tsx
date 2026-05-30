import { type HTMLAttributes } from 'react'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  padding?: 'sm' | 'md' | 'lg'
}

const paddingMap = {
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
}

export function Card({ padding = 'md', className = '', children, ...props }: CardProps) {
  return (
    <div
      className={`border border-muted/30 bg-white/40 backdrop-blur-sm ${paddingMap[padding]} ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}
