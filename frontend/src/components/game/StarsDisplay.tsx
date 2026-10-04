import { IconStar, IconStarFilled } from '@tabler/icons-react'

// Estrelas só de leitura (para escolher a nota, use o StarRating).
export default function StarsDisplay({ value }: { value: number }) {
  return (
    <span role="img" aria-label={`Nota ${value} de 5`} className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((n) =>
        n <= value ? (
          <IconStarFilled key={n} className="size-4 text-neutral-900" />
        ) : (
          <IconStar key={n} className="size-4 text-neutral-400" />
        ),
      )}
    </span>
  )
}