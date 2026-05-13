'use client'

interface ToggleSwitchProps {
  checked: boolean
  onChange: (value: boolean) => void
  label: string
  helper?: string
  disabled?: boolean
}

/**
 * Premium iOS-style toggle switch for boolean fields.
 */
export default function ToggleSwitch({
  checked,
  onChange,
  label,
  helper,
  disabled = false,
}: ToggleSwitchProps) {
  return (
    <div className={`flex flex-col gap-1 ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
      <div className="flex items-center gap-3">
        <button
          type="button"
          role="switch"
          aria-checked={checked}
          disabled={disabled}
          onClick={() => !disabled && onChange(!checked)}
          className={`
            relative inline-flex h-[24px] w-[44px] shrink-0 cursor-pointer rounded-full border-2 border-transparent 
            transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary/20 
            ${checked ? 'bg-[#8b1a1a]' : 'bg-gray-200'}
            ${disabled ? 'cursor-not-allowed' : ''}
          `}
        >
          <span
            aria-hidden="true"
            className={`
              pointer-events-none inline-block h-[20px] w-[20px] transform rounded-full bg-white shadow ring-0 
              transition duration-200 ease-in-out
              ${checked ? 'translate-x-5' : 'translate-x-0'}
            `}
          />
        </button>
        <span className="text-sm font-medium text-text-main cursor-pointer" onClick={() => !disabled && onChange(!checked)}>
          {label}
        </span>
      </div>
      {helper && (
        <p className="text-[12px] text-gray-400 ml-[56px]">
          {helper}
        </p>
      )}
    </div>
  )
}
