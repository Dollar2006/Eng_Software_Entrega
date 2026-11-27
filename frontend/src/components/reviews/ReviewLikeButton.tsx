import { useState } from 'react'
import { IconHeart } from '@tabler/icons-react'

type ReviewLikeButtonProps = {
  reviewId: number
  className?: string
}

export default function ReviewLikeButton({
  reviewId,
  className = '',
}: ReviewLikeButtonProps) {
  const storageKey = `review-like:${reviewId}`
  const [liked, setLiked] = useState(() => {
    try {
      return window.localStorage.getItem(storageKey) === 'true'
    } catch {
      return false
    }
  })
  const [likeCount, setLikeCount] = useState(() => {
    try {
      const stored = Number(window.localStorage.getItem(`${storageKey}:count`))
      return Number.isFinite(stored) && stored > 0 ? stored : 0
    } catch {
      return 0
    }
  })

  function toggleLike() {
    const nextLiked = !liked
    const nextCount = Math.max(0, likeCount + (nextLiked ? 1 : -1))

    setLiked(nextLiked)
    setLikeCount(nextCount)

    try {
      window.localStorage.setItem(storageKey, String(nextLiked))
      window.localStorage.setItem(`${storageKey}:count`, String(nextCount))
    } catch {
      // O botão continua funcionando mesmo quando o armazenamento local não está disponível.
    }
  }

  return (
    <button
      type="button"
      aria-label={liked ? 'Descurtir review' : 'Curtir review'}
      aria-pressed={liked}
      onClick={toggleLike}
      className={[
        'inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-sm font-medium transition-colors',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900',
        liked
          ? 'bg-rose-50 text-rose-600'
          : 'text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900',
        className,
      ].join(' ')}
    >
      <IconHeart
        className="size-4"
        fill={liked ? 'currentColor' : 'none'}
        aria-hidden="true"
      />
      <span>{likeCount > 0 ? `${likeCount} curtida${likeCount === 1 ? '' : 's'}` : 'Curtir'}</span>
    </button>
  )
}
