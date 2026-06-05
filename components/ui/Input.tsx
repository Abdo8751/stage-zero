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
          <label htmlFor={inputId} className="mb-2 block text-[12px] font-semibold uppercase tracking-[0.08em] text-[rgba(240,230,208,0.55)]">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={`
            w-full bg-[rgba(240,228,200,0.07)] backdrop-blur-[20px]
            border rounded-input px-4 py-3
            text-[14px] text-cream placeholder:text-[rgba(240,230,208,0.35)]
            transition-all duration-150 outline-none
            ${error
              ? 'border-[rgba(255,69,58,0.40)] focus:border-[rgba(255,69,58,0.70)] focus:ring-2 focus:ring-[rgba(255,69,58,0.10)]'
              : 'border-[rgba(240,230,208,0.18)] focus:border-[rgba(240,230,208,0.50)] focus:ring-2 focus:ring-[rgba(240,230,208,0.08)]'
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
