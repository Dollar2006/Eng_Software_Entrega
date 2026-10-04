import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { IconPencil, IconTrash } from '@tabler/icons-react'

import GameCard from '@/components/game/GameCard'
import StarRating from '@/components/game/StarRating'
import StarsDisplay from '@/components/game/StarsDisplay'
import { Button } from '@/components/ui/button'
import ReviewForm from '@/features/reviews/ReviewForm'
import { deleteReview, listMyReviews, type MyReviewItem } from '@/lib/games'

const PAGE_SIZE = 12

type Status = 'loading' | 'ok' | 'error'

type EditInlineProps = {
  item: MyReviewItem
  onSaved: (rating: number, text: string) => void
  onCancel: () => void
}

// Edição dentro do próprio card: estrelas + o mesmo formulário da página do jogo.
function EditInline({ item, onSaved, onCancel }: EditInlineProps) {
  const [rating, setRating] = useState<number | null>(item.rating)

  return (
    <div className="space-y-4">
      <StarRating
        value={rating}
        onChange={setRating}
        name={`edit-rating-${item.game.id}`}
      />
      <ReviewForm
        gameId={item.game.id}
        rating={rating}
        initialText={item.text}
        onSaved={(text) => {
          if (rating) onSaved(rating, text)
        }}
        onCancel={onCancel}
      />
    </div>
  )
}

export default function MyReviews() {
  const [items, setItems] = useState<MyReviewItem[]>([])
  const [status, setStatus] = useState<Status>('loading')
  const [hasMore, setHasMore] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [confirmingId, setConfirmingId] = useState<number | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [actionError, setActionError] = useState('')

  useEffect(() => {
    let cancelled = false

    listMyReviews(0, PAGE_SIZE)
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
  }, [])

  async function loadMore() {
    setLoadingMore(true)
    try {
      const data = await listMyReviews(items.length, PAGE_SIZE)
      setItems((prev) => [...prev, ...data])
      setHasMore(data.length === PAGE_SIZE)
    } catch {
      setActionError('Não foi possível carregar mais reviews.')
    } finally {
      setLoadingMore(false)
    }
  }

  async function handleDelete(gameId: number) {
    setDeletingId(gameId)
    setActionError('')
    try {
      await deleteReview(gameId)
      setItems((prev) => prev.filter((item) => item.game.id !== gameId))
      setConfirmingId(null)
    } catch {
      setActionError('Não foi possível excluir a review. Tente novamente.')
    } finally {
      setDeletingId(null)
    }
  }

  function handleSaved(gameId: number, rating: number, text: string) {
    setItems((prev) =>
      prev.map((item) =>
        item.game.id === gameId
          ? { ...item, rating, text, updated_at: new Date().toISOString() }
          : item,
      ),
    )
    setEditingId(null)
  }

  if (status === 'loading') {
    return <p className="text-sm text-neutral-500">Carregando suas reviews...</p>
  }

  if (status === 'error') {
    return (
      <p className="text-sm text-neutral-500">
        Não foi possível carregar suas reviews.
      </p>
    )
  }

  if (items.length === 0) {
    return (
      <p className="text-sm text-neutral-500">
        Você ainda não escreveu nenhuma review.{' '}
        <Link to="/bonfirehub" className="font-medium underline">
          Escolha um jogo
        </Link>{' '}
        e conte o que achou.
      </p>
    )
  }

  return (
    <div className="space-y-4">
      {actionError && (
        <p role="alert" className="text-sm text-red-600">
          {actionError}
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => {
          const id = item.game.id
          const isEditing = editingId === id
          const isConfirming = confirmingId === id

          return (
            // Editando, o card ocupa a linha toda para o formulário caber.
            <div
              key={id}
              className={isEditing ? 'sm:col-span-2 lg:col-span-3' : undefined}
            >
              <GameCard game={item.game}>
                {isEditing ? (
                  <EditInline
                    item={item}
                    onSaved={(rating, text) => handleSaved(id, rating, text)}
                    onCancel={() => setEditingId(null)}
                  />
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <StarsDisplay value={item.rating} />
                      <span className="text-xs text-neutral-500">
                        {item.rating}/5
                      </span>
                    </div>

                    <p className="line-clamp-4 text-sm leading-relaxed whitespace-pre-wrap text-neutral-700">
                      {item.text}
                    </p>

                    {isConfirming ? (
                      <div className="space-y-2">
                        <p className="text-sm">
                          Excluir esta review e a sua nota deste jogo?
                        </p>
                        <div className="flex gap-2">
                          <Button
                            variant="destructive"
                            size="sm"
                            className="cursor-pointer"
                            disabled={deletingId === id}
                            onClick={() => handleDelete(id)}
                          >
                            {deletingId === id ? 'Excluindo...' : 'Confirmar'}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="cursor-pointer"
                            onClick={() => setConfirmingId(null)}
                          >
                            Cancelar
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="cursor-pointer"
                          onClick={() => {
                            setActionError('')
                            setConfirmingId(null)
                            setEditingId(id)
                          }}
                        >
                          <IconPencil className="size-4" />
                          Editar
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="cursor-pointer"
                          onClick={() => {
                            setActionError('')
                            setEditingId(null)
                            setConfirmingId(id)
                          }}
                        >
                          <IconTrash className="size-4" />
                          Excluir
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </GameCard>
            </div>
          )
        })}
      </div>

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