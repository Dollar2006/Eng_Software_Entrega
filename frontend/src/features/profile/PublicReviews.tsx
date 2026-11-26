import { useEffect, useState } from 'react'
import { Link } from 'react-router'

import GameCard from '@/components/game/GameCard'
import StarsDisplay from '@/components/game/StarsDisplay'
import { Button } from '@/components/ui/button'
import { listUserReviews, type MyReviewItem } from '@/lib/games'

const PAGE_SIZE = 12

type Props = {
  gamertag: string
}

export default function PublicReviews({ gamertag }: Props) {
  const [items, setItems] = useState<MyReviewItem[]>([])
  const [status, setStatus] = useState<'loading' | 'ok' | 'error'>('loading')
  const [hasMore, setHasMore] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)

  useEffect(() => {
    let cancelled = false
    setStatus('loading')
    setItems([])
    listUserReviews(gamertag, 0, PAGE_SIZE)
      .then((data) => {
        if (cancelled) return
        setItems(data)
        setHasMore(data.length === PAGE_SIZE)
        setStatus('ok')
      })
      .catch(() => {
        if (!cancelled) setStatus('error')
      })
    return () => {
      cancelled = true
    }
  }, [gamertag])

  async function loadMore() {
    setLoadingMore(true)
    try {
      const data = await listUserReviews(gamertag, items.length, PAGE_SIZE)
      setItems((prev) => [...prev, ...data])
      setHasMore(data.length === PAGE_SIZE)
    } finally {
      setLoadingMore(false)
    }
  }

  if (status === 'loading') return <p className="text-sm text-neutral-500">Carregando reviews...</p>
  if (status === 'error') return <p className="text-sm text-neutral-500">Não foi possível carregar as reviews.</p>
  if (items.length === 0) {
    return (
      <p className="text-sm text-neutral-500">
        Nenhuma review pública ainda.{' '}
        <Link to="/bonfirehub" className="font-medium underline">
          Explorar jogos
        </Link>
      </p>
    )
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <GameCard key={item.game.id} game={item.game}>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <StarsDisplay value={item.rating} />
                <span className="text-xs text-neutral-500">{item.rating}/5</span>
              </div>
              <p className="line-clamp-4 text-sm leading-relaxed whitespace-pre-wrap text-neutral-700">
                {item.text}
              </p>
              <p className="text-xs text-neutral-500">{item.likes_count} curtidas</p>
            </div>
          </GameCard>
        ))}
      </div>
      {hasMore && (
        <Button variant="outline" onClick={loadMore} disabled={loadingMore} className="cursor-pointer">
          {loadingMore ? 'Carregando...' : 'Carregar mais'}
        </Button>
      )}
    </div>
  )
}
