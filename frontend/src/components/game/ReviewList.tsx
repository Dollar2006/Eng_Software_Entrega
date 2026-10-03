import { useEffect, useState } from 'react'
import { IconStar, IconStarFilled } from '@tabler/icons-react'

import Avatar from '@/components/profile/Avatar'
import { Button } from '@/components/ui/button'
import { listReviews, type Review } from '@/lib/games'

const PAGE_SIZE = 10

type ReviewListProps = {
  gameId: string | number
  // Muda quando o usuário salva uma review, para a lista recarregar.
  refreshKey?: number
}

function Stars({ value }: { value: number }) {
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

export default function ReviewList({ gameId, refreshKey = 0 }: ReviewListProps) {
  const [reviews, setReviews] = useState<Review[]>([])
  const [status, setStatus] = useState<'loading' | 'ok' | 'error'>('loading')
  const [hasMore, setHasMore] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)

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
                    <span className="text-sm font-medium">{authorName}</span>
                    <Stars value={review.rating} />
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
