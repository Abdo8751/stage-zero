import { type InputHTMLAttributes, forwardRef } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = '', id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="mb-2 block text-sm font-medium text-navy">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={`w-full border border-muted/40 bg-white/60 px-4 py-3 font-body text-navy placeholder:text-muted/70 focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold ${error ? 'border-red-500' : ''} ${className}`}
          {...props}
        />
        {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
      </div>
    )
  }
)

Input.displayName = 'Input'
