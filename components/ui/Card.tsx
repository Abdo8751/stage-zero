import { type HTMLAttributes } from 'react'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  padding?: 'sm' | 'md' | 'lg'
  hoverable?: boolean
}

const paddingMap = {
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
}

export function Card({ padding = 'md', hoverable = false, className = '', children, ...props }: CardProps) {
  return (
    <div
      className={`glass-card ${hoverable ? 'glass-card-hover cursor-pointer' : ''} ${paddingMap[padding]} ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}
