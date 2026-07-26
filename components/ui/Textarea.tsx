import { type TextareaHTMLAttributes, forwardRef } from 'react'

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, className = '', id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="mb-2 block text-[13px] font-semibold text-ink/75">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={inputId}
          className={`
            min-h-[110px] w-full resize-y
            bg-warm-cream/80
            border rounded-[10px] px-4 py-3.5
            text-[14px] text-ink placeholder:text-ink/35
            transition-all duration-150 outline-none
            ${error
              ? 'border-[rgba(255,69,58,0.4)] focus:border-[rgba(255,69,58,0.7)] focus:ring-2 focus:ring-[rgba(255,69,58,0.10)]'
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

Textarea.displayName = 'Textarea'
