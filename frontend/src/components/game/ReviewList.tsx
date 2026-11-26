import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { IconHeart, IconHeartFilled } from '@tabler/icons-react'

import StarsDisplay from '@/components/game/StarsDisplay'
import Avatar from '@/components/profile/Avatar'
import { Button } from '@/components/ui/button'
import { hasSession } from '@/features/auth/requireSession'
import { likeReview, listReviews, unlikeReview, type Review } from '@/lib/games'

const PAGE_SIZE = 10

type ReviewListProps = {
  gameId: string | number
  // Muda quando o usuário salva uma review, para a lista recarregar.
  refreshKey?: number
}

export default function ReviewList({ gameId, refreshKey = 0 }: ReviewListProps) {
  const navigate = useNavigate()
  const [reviews, setReviews] = useState<Review[]>([])
  const [status, setStatus] = useState<'loading' | 'ok' | 'error'>('loading')
  const [hasMore, setHasMore] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [likingIds, setLikingIds] = useState<Set<number>>(new Set())
  const [likeError, setLikeError] = useState('')

  useEffect(() => {
    let cancelled = false

    listReviews(gameId, 0, PAGE_SIZE)
      .then((data) => {
        if (cancelled) return
        setReviews(data)
        setHasMore(data.length === PAGE_SIZE)
        setStatus('ok')
      })
      .catch(() => {
        if (!cancelled) setStatus('error')
      })

    return () => {
      cancelled = true
    }
  }, [gameId, refreshKey])

  async function loadMore() {
    setLoadingMore(true)
    try {
      const data = await listReviews(gameId, reviews.length, PAGE_SIZE)
      setReviews((prev) => [...prev, ...data])
      setHasMore(data.length === PAGE_SIZE)
    } catch {
      setStatus('error')
    } finally {
      setLoadingMore(false)
    }
  }

  async function toggleLike(review: Review) {
    if (!(await hasSession())) {
      navigate(`/login?redirect=${encodeURIComponent(window.location.pathname)}`)
      return
    }
    if (likingIds.has(review.id)) return

    const prev = { liked: review.liked_by_me, count: review.likes_count }
    const nextLiked = !review.liked_by_me
    setLikeError('')
    setLikingIds((s) => new Set(s).add(review.id))
    setReviews((rs) =>
      rs.map((r) =>
        r.id === review.id
          ? { ...r, liked_by_me: nextLiked, likes_count: r.likes_count + (nextLiked ? 1 : -1) }
          : r,
      ),
    )

    try {
      const res = nextLiked ? await likeReview(review.id) : await unlikeReview(review.id)
      setReviews((rs) => rs.map((r) => (r.id === review.id ? { ...r, ...res } : r)))
    } catch {
      setReviews((rs) =>
        rs.map((r) =>
          r.id === review.id ? { ...r, liked_by_me: prev.liked, likes_count: prev.count } : r,
        ),
      )
      setLikeError('Não foi possível atualizar a curtida.')
    } finally {
      setLikingIds((s) => {
        const n = new Set(s)
        n.delete(review.id)
        return n
      })
    }
  }

  if (status === 'loading') {
    return <p className="text-sm text-neutral-500">Carregando reviews...</p>
  }

  if (status === 'error') {
    return (
      <p className="text-sm text-neutral-500">
        Não foi possível carregar as reviews.
      </p>
    )
  }

  if (reviews.length === 0) {
    return (
      <p className="text-sm text-neutral-500">
        Ainda não há reviews. Seja o primeiro a escrever!
      </p>
    )
  }

  return (
    <div className="space-y-4">
      {likeError && (
        <p role="alert" className="text-sm text-red-600">
          {likeError}
        </p>
      )}
      <ul className="space-y-4">
        {reviews.map((review) => {
          const authorName = review.author_name ?? 'Usuário'

          return (
            <li
              key={review.id}
              className="flex gap-3 rounded-xl border border-neutral-200 bg-white p-4"
            >
              {/* Mesmo componente do perfil: sem foto, mostra as iniciais. */}
              <Avatar
                src={review.author_avatar}
                name={authorName}
                className="size-12"
              />

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    {review.author_gamertag ? (
                      <Link
                        to={`/u/${encodeURIComponent(review.author_gamertag)}`}
                        className="text-sm font-medium hover:underline"
                      >
                        {authorName}
                      </Link>
                    ) : (
                      <span className="text-sm font-medium">{authorName}</span>
                    )}
                    <StarsDisplay value={review.rating} />
                  </div>
                  <time
                    dateTime={review.updated_at}
                    className="text-xs text-neutral-500"
                  >
                    {new Date(review.updated_at).toLocaleDateString('pt-BR')}
                  </time>
                </div>

                <p className="mt-3 text-sm leading-relaxed whitespace-pre-wrap text-neutral-700">
                  {review.text}
                </p>

                <div className="mt-3">
                  <button
                    type="button"
                    onClick={() => toggleLike(review)}
                    disabled={likingIds.has(review.id)}
                    aria-pressed={review.liked_by_me}
                    aria-label={review.liked_by_me ? 'Descurtir review' : 'Curtir review'}
                    className="inline-flex cursor-pointer items-center gap-1.5 rounded-md px-2 py-1 text-sm text-neutral-600 transition hover:bg-neutral-100 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {review.liked_by_me ? (
                      <IconHeartFilled className="size-4 text-red-500" />
                    ) : (
                      <IconHeart className="size-4" />
                    )}
                    <span>{review.likes_count}</span>
                  </button>
                </div>
              </div>
            </li>
          )
        })}
      </ul>

      {hasMore && (
        <Button
          variant="outline"
          onClick={loadMore}
          disabled={loadingMore}
          className="cursor-pointer"
        >
          {loadingMore ? 'Carregando...' : 'Carregar mais'}
        </Button>
      )}
    </div>
  )
}