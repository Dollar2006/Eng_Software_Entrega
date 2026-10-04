import { useState } from 'react'
import { IconStar, IconStarFilled } from '@tabler/icons-react'

import { cn } from '@/lib/utils'

type StarRatingProps = {
  value: number | null
  onChange: (value: number) => void
  disabled?: boolean
  name?: string
}

const STARS = [1, 2, 3, 4, 5]

// Radios nativos escondidos: teclado (setas) e leitor de tela funcionam sem
// código extra. As estrelas são só a parte visual.
export default function StarRating({
  value,
  onChange,
  disabled = false,
  name = 'rating',
}: StarRatingProps) {
  const [hover, setHover] = useState<number | null>(null)
  const shown = hover ?? value ?? 0

  return (
    <fieldset
      disabled={disabled}
      className="flex items-center gap-1"
      onMouseLeave={() => setHover(null)}
    >
      <legend className="sr-only">Sua nota de 1 a 5 estrelas</legend>

      {STARS.map((n) => (
        <label
          key={n}
          onMouseEnter={() => !disabled && setHover(n)}
          className={cn(
            'cursor-pointer rounded p-0.5 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-neutral-900',
            disabled && 'cursor-not-allowed opacity-50',
          )}
        >
          <input
            type="radio"
            name={name}
            value={n}
            checked={value === n}
            onChange={() => onChange(n)}
            className="sr-only"
          />
          <span className="sr-only">
            {n} {n === 1 ? 'estrela' : 'estrelas'}
          </span>
          {n <= shown ? (
            <IconStarFilled className="size-7 text-neutral-900" />
          ) : (
            <IconStar className="size-7 text-neutral-400" />
          )}
        </label>
      ))}
    </fieldset>
  )
}
