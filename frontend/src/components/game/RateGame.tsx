import { useEffect, useState } from 'react'
import { Link } from 'react-router'

import StarRating from '@/components/game/StarRating'
import ReviewForm from '@/features/reviews/ReviewForm'
import { ApiError } from '@/lib/api'
import { getMyReview, rateGame } from '@/lib/games'

const isUnauthorized = (err: unknown) =>
  err instanceof ApiError && err.status === 401

type Status = 'loading' | 'anonymous' | 'ready' | 'error'

type RateGameProps = {
  gameId: string | number
  // Chamado depois de salvar a nota, para a página atualizar a média.
  onRated?: () => void
  // Chamado depois de salvar a review, para atualizar média e lista.
  onReviewed?: () => void
}

// "Sua avaliação": estrelas (REQ-07) + texto da review (REQ-08).
export default function RateGame({
  gameId,
  onRated,
  onReviewed,
}: RateGameProps) {
  const [status, setStatus] = useState<Status>('loading')
  const [rating, setRating] = useState<number | null>(null)
  const [text, setText] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    setStatus('loading')

    getMyReview(gameId)
      .then((mine) => {
        if (cancelled) return
        setRating(mine.rating)
        setText(mine.text ?? '')
        setStatus('ready')
      })
      .catch((err) => {
        if (cancelled) return
        setStatus(isUnauthorized(err) ? 'anonymous' : 'error')
      })

    return () => {
      cancelled = true
    }
  }, [gameId])

  async function handleChange(value: number) {
    const previous = rating
    setRating(value) // atualiza na hora; volta atrás se o servidor recusar
    setSaving(true)
    setError('')

    try {
      await rateGame(gameId, value)
      onRated?.()
    } catch (err) {
      setRating(previous)
      if (isUnauthorized(err)) {
        setStatus('anonymous')
      } else {
        setError('Não foi possível salvar sua nota. Tente de novo.')
      }
    } finally {
      setSaving(false)
    }
  }

  if (status === 'loading') {
    return <p className="text-sm text-neutral-500">Carregando...</p>
  }

  if (status === 'anonymous') {
    return (
      <p className="text-sm text-neutral-600">
        <Link
          to={`/login?redirect=${encodeURIComponent(`/jogos/${gameId}`)}`}
          className="font-medium underline"
        >
          Entre na sua conta
        </Link>{' '}
        para avaliar este jogo e escrever uma review.
      </p>
    )
  }

  if (status === 'error') {
    return (
      <p className="text-sm text-neutral-500">
        Não foi possível carregar sua avaliação.
      </p>
    )
  }

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <StarRating value={rating} onChange={handleChange} disabled={saving} />
        <p className="text-sm text-neutral-500" aria-live="polite">
          {rating
            ? `Você avaliou com ${rating} de 5.`
            : 'Clique em uma estrela para avaliar.'}
        </p>
        {error && (
          <p role="alert" className="text-sm text-red-600">
            {error}
          </p>
        )}
      </div>

      <ReviewForm
        gameId={gameId}
        rating={rating}
        initialText={text}
        onSaved={() => onReviewed?.()}
      />
    </div>
  )
}
