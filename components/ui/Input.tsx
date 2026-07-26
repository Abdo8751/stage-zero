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
          <label htmlFor={inputId} className="mb-2 block text-[13px] font-semibold text-ink/75">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={`
            w-full bg-warm-cream/80
            border rounded-[10px] px-4 py-3.5
            text-[14px] font-medium text-ink placeholder:text-ink/35
            transition-all duration-150 outline-none
            ${error
              ? 'border-[rgba(180,30,20,0.35)] focus:border-[rgba(180,30,20,0.60)] focus:ring-2 focus:ring-[rgba(180,30,20,0.08)]'
              : 'border-ink/15 focus:border-blue-accent focus:ring-2 focus:ring-blue-accent/20'
            }
            ${className}
          `}
          {...props}
        />
        {error && <p className="mt-1.5 text-[12px] text-red-700">{error}</p>}
      </div>
    )
  }
)

Input.displayName = 'Input'
