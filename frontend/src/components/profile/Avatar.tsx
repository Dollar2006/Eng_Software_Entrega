import { IconUser } from '@tabler/icons-react'

import { cn } from '@/lib/utils'

type AvatarProps = {
  src?: string | null
  name?: string
  className?: string
}

function getInitials(name: string): string {
  // '  ' ou '' chega aqui quando não há nome: split devolve [''] e não um
  // array vazio, então o filtro dos pedaços é o que garante o fallback.
  const parts = name.trim().split(/\s+/).filter(Boolean)

  if (parts.length === 0) return ''

  const firstInitial = parts[0].charAt(0).toUpperCase()

  if (parts.length > 1) {
    const lastInitial = parts[parts.length - 1].charAt(0).toUpperCase()
    return `${firstInitial}${lastInitial}`
  }

  return firstInitial
}

export default function Avatar({ src, name, className }: AvatarProps) {
  const letter = getInitials(name || '')

  return (
    <div
      className={cn(
        'flex size-24 shrink-0 items-center justify-center overflow-hidden rounded-full bg-neutral-200',
        className,
      )}
    >
      {src ? (
        // alt com o nome e não vazio: se a foto falhar ao carregar, o leitor de
        // tela ainda anuncia quem é. Sem name, cai no texto decorativo.
        <img src={src} alt={name ?? ''} className="h-full w-full object-cover" />
      ) : (
        <span className="flex size-full items-center justify-center text-2xl font-medium text-neutral-500">
          {letter || <IconUser className="size-8" />}
        </span>
      )}
    </div>
  )
}