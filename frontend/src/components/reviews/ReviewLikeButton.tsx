import { useEffect, useState } from 'react'
import { IconHeart } from '@tabler/icons-react'
import { ApiError, api } from '@/lib/api'

type ReviewLikeButtonProps = {
  reviewId: number
  likes: number
  likedByMe: boolean
  isOwnReview?: boolean
  className?: string
}

export default function ReviewLikeButton({
  reviewId,
  likes,
  likedByMe,
  isOwnReview = false,
  className = '',
}: ReviewLikeButtonProps) {
  const [liked, setLiked] = useState(likedByMe)
  const [likeCount, setLikeCount] = useState(likes)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    setLiked(likedByMe)
    setLikeCount(likes)
  }, [likedByMe, likes])

  async function toggleLike() {
    setLoading(true)
    setError('')

    try {
      const response = liked
        ? await api.delete<{ likes: number; liked_by_me: boolean }>(
            `/reviews/${reviewId}/like`,
          )
        : await api.post<{ likes: number; liked_by_me: boolean }>(
            `/reviews/${reviewId}/like`,
          )
      setLiked(response.data.liked_by_me)
      setLikeCount(response.data.likes)
    } catch (requestError) {
      setError(
        requestError instanceof ApiError && requestError.status === 401
          ? 'Entre na sua conta para curtir reviews.'
          : 'Não foi possível atualizar a curtida. Tente novamente.',
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <button
        type="button"
        aria-label={
          isOwnReview
            ? 'Não é possível curtir sua própria review'
            : liked
              ? 'Descurtir review'
              : 'Curtir review'
        }
        aria-pressed={liked}
        onClick={toggleLike}
        disabled={loading || isOwnReview}
        className={[
          'inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-sm font-medium transition-colors',
          'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900',
          'disabled:cursor-not-allowed disabled:opacity-50',
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
        <span>
          {isOwnReview
            ? 'Sua review'
            : likeCount > 0
              ? `${likeCount} curtida${likeCount === 1 ? '' : 's'}`
              : 'Curtir'}
        </span>
      </button>
      {error && (
        <p role="alert" className="mt-1 text-xs text-rose-600">
          {error}
        </p>
      )}
    </div>
  )
}
