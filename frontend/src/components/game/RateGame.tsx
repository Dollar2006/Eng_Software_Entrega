import { useEffect, useState } from 'react'
import { Link } from 'react-router'

import StarRating from '@/components/game/StarRating'
import { ApiError } from '@/lib/api'
import { getMyRating, rateGame } from '@/lib/games'

const isUnauthorized = (err: unknown) =>
  err instanceof ApiError && err.status === 401

type Status = 'loading' | 'anonymous' | 'ready' | 'error'

type RateGameProps = {
  gameId: string | number
  // Chamado depois de salvar, para a página atualizar a média.
  onRated?: () => void
}

export default function RateGame({ gameId, onRated }: RateGameProps) {
  const [status, setStatus] = useState<Status>('loading')
  const [rating, setRating] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    setStatus('loading')

    getMyRating(gameId)
      .then((value) => {
        if (cancelled) return
        setRating(value)
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
        para avaliar este jogo.
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
  )
}
