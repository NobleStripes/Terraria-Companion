import { useRef } from 'react'
import { Search, X } from 'lucide-react'
import { cn } from '@/lib/cn'

interface SearchBarProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  autoFocus?: boolean
}

export function SearchBar({ value, onChange, placeholder = 'Search…', className, autoFocus }: SearchBarProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  return (
    <div className={cn('relative flex items-center', className)}>
      <Search className="absolute left-3 w-4 h-4 text-gray-500 pointer-events-none" />
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        className="w-full bg-terra-bg border border-terra-border rounded-lg pl-9 pr-9 py-2 text-sm text-white placeholder-gray-500 focus:border-terra-gold focus:outline-none transition-colors"
      />
      {value && (
        <button
          onClick={() => {
            onChange('')
            inputRef.current?.focus()
          }}
          className="absolute right-3 text-gray-500 hover:text-white transition-colors"
          aria-label="Clear search"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  )
}
