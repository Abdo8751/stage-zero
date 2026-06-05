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
          <label htmlFor={inputId} className="mb-2 block text-[12px] font-black uppercase tracking-[0.08em] text-cream-subtle">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={`
            w-full bg-[rgba(255,255,255,0.65)] backdrop-blur-[20px]
            border rounded-input px-4 py-3
            text-[14px] font-semibold text-cream placeholder:text-cream-subtle
            transition-all duration-150 outline-none
            ${error
              ? 'border-[rgba(180,30,20,0.35)] focus:border-[rgba(180,30,20,0.60)] focus:ring-2 focus:ring-[rgba(180,30,20,0.08)]'
              : 'border-[rgba(4,11,26,0.15)] focus:border-[rgba(4,11,26,0.40)] focus:ring-2 focus:ring-[rgba(4,11,26,0.06)]'
            }
            ${className}
          `}
          {...props}
        />
        {error && <p className="mt-1.5 text-[12px] text-[#FF453A]">{error}</p>}
      </div>
    )
  }
)

Input.displayName = 'Input'
