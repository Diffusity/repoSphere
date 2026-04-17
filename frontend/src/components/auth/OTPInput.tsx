import { useEffect, useMemo, useRef, useState } from 'react'

interface OTPInputProps {
  length?: number
  value: string
  onChange: (value: string) => void
  onComplete?: (value: string) => void
  disabled?: boolean
}

export function OTPInput({ length = 6, value, onChange, onComplete, disabled = false }: OTPInputProps) {
  const [activeIndex, setActiveIndex] = useState(0)
  const inputsRef = useRef<Array<HTMLInputElement | null>>([])

  const digits = useMemo(
    () =>
      Array.from({ length }, (_, index) => {
        return value[index] ?? ''
      }),
    [length, value]
  )

  useEffect(() => {
    if (value.length === length && onComplete) {
      onComplete(value)
    }
  }, [length, onComplete, value])

  const focusAt = (index: number) => {
    const bounded = Math.max(0, Math.min(length - 1, index))
    setActiveIndex(bounded)
    inputsRef.current[bounded]?.focus()
    inputsRef.current[bounded]?.select()
  }

  const updateAt = (index: number, char: string) => {
    const next = digits.slice()
    next[index] = char
    onChange(next.join('').replace(/\D/g, '').slice(0, length))
  }

  return (
    <div className="flex items-center justify-center gap-2">
      {digits.map((digit, index) => (
        <input
          key={index}
          ref={(el) => {
            inputsRef.current[index] = el
          }}
          className={`h-11 w-10 rounded-md border bg-rs-bg text-center text-lg font-semibold outline-none transition ${
            activeIndex === index ? 'border-rs-link ring-1 ring-rs-link/40' : 'border-rs-border'
          }`}
          inputMode="numeric"
          pattern="[0-9]*"
          autoComplete={index === 0 ? 'one-time-code' : 'off'}
          maxLength={1}
          value={digit}
          disabled={disabled}
          onFocus={() => setActiveIndex(index)}
          onChange={(e) => {
            const char = e.target.value.replace(/\D/g, '').slice(-1)
            updateAt(index, char)
            if (char && index < length - 1) focusAt(index + 1)
          }}
          onKeyDown={(e) => {
            if (e.key === 'Backspace') {
              if (digits[index]) {
                updateAt(index, '')
                return
              }
              if (index > 0) {
                updateAt(index - 1, '')
                focusAt(index - 1)
              }
            }
            if (e.key === 'ArrowLeft' && index > 0) focusAt(index - 1)
            if (e.key === 'ArrowRight' && index < length - 1) focusAt(index + 1)
          }}
          onPaste={(e) => {
            e.preventDefault()
            const pasted = e.clipboardData
              .getData('text')
              .replace(/\D/g, '')
              .slice(0, length)
            onChange(pasted)
            if (pasted.length < length) focusAt(pasted.length)
          }}
          aria-label={`OTP digit ${index + 1}`}
        />
      ))}
    </div>
  )
}
