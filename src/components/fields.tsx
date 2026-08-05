import { useEffect, useRef, useState } from 'react'

/**
 * Number input that tolerates in-progress typing ("0.", "") and only
 * dispatches parseable values; re-syncs from the store when not focused.
 */
export function NumField({
  value,
  onCommit,
  min,
  max,
  step,
  id,
  className = 'input',
  suffix,
}: {
  value: number
  onCommit: (v: number) => void
  min?: number
  max?: number
  step?: number | 'any'
  id?: string
  className?: string
  suffix?: string
}) {
  const [text, setText] = useState(String(value))
  const focused = useRef(false)

  useEffect(() => {
    if (!focused.current) setText(String(value))
  }, [value])

  return (
    <span className="relative inline-flex items-center w-full">
      <input
        id={id}
        type="number"
        inputMode="decimal"
        className={className}
        value={text}
        min={min}
        max={max}
        step={step ?? 'any'}
        onFocus={() => (focused.current = true)}
        onBlur={() => {
          focused.current = false
          setText(String(value))
        }}
        onChange={(e) => {
          setText(e.target.value)
          const v = parseFloat(e.target.value)
          if (!Number.isNaN(v) && (min === undefined || v >= min)) onCommit(v)
        }}
      />
      {suffix && (
        <span className="absolute right-2 text-[0.68rem] text-ink-2 pointer-events-none">
          {suffix}
        </span>
      )}
    </span>
  )
}
