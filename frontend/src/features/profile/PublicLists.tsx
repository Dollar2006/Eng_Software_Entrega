import { useEffect, useState } from 'react'

import GameCard from '@/components/game/GameCard'
import { getPublicListItems, getPublicLists, type ListRef } from '@/lib/lists'
import type { Game } from '@/lib/games'

type Props = {
  gamertag: string
}

type ListState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; lists: ListRef[] }

export default function PublicLists({ gamertag }: Props) {
  const [state, setState] = useState<ListState>({ status: 'loading' })
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [loadingItemsId, setLoadingItemsId] = useState<number | null>(null)
  const [gamesByList, setGamesByList] = useState<Record<number, Game[]>>({})
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    setState({ status: 'loading' })
    setExpandedId(null)
    setGamesByList({})
    getPublicLists(gamertag)
      .then((lists) => {
        if (!cancelled) setState({ status: 'ready', lists })
      })
      .catch(() => {
        if (!cancelled) setState({ status: 'error', message: 'Não foi possível carregar as listas.' })
      })
    return () => {
      cancelled = true
    }
  }, [gamertag])

  async function handleToggle(list: ListRef) {
    if (expandedId === list.id) {
      setExpandedId(null)
      return
    }
    setExpandedId(list.id)
    if (gamesByList[list.id]) return
    setLoadingItemsId(list.id)
    setError('')
    try {
      const items = await getPublicListItems(gamertag, list.id)
      setGamesByList((current) => ({ ...current, [list.id]: items.map((item) => item.game) }))
    } catch {
      setError('Não foi possível carregar os jogos da lista.')
    } finally {
      setLoadingItemsId(null)
    }
  }

  if (state.status === 'loading') return <p className="text-sm text-neutral-500">Carregando listas...</p>
  if (state.status === 'error') return <p className="text-sm text-red-600">{state.message}</p>
  if (state.lists.length === 0) return <p className="text-sm text-neutral-500">Nenhuma lista pública ainda.</p>

  return (
    <div className="space-y-4">
      {error && <p className="text-sm text-red-600">{error}</p>}
      <ul className="divide-y divide-neutral-200 rounded-lg border border-neutral-200 bg-white">
        {state.lists.map((list) => (
          <li key={list.id}>
            <button
              type="button"
              aria-expanded={expandedId === list.id}
              onClick={() => void handleToggle(list)}
              className="flex w-full cursor-pointer items-center justify-between gap-4 p-4 text-left focus-visible:outline-2 focus-visible:outline-neutral-900"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{list.name}</p>
                <p className="text-xs text-neutral-500">{list.kind === 'system' ? 'Lista do sistema' : 'Lista personalizada'}</p>
              </div>
            </button>
            {expandedId === list.id && (
              <div className="border-t border-neutral-200 p-4">
                {loadingItemsId === list.id && <p className="text-sm text-neutral-500">Carregando jogos...</p>}
                {loadingItemsId !== list.id && gamesByList[list.id]?.length === 0 && (
                  <p className="text-sm text-neutral-500">Esta lista ainda não tem jogos.</p>
                )}
                {loadingItemsId !== list.id && (gamesByList[list.id]?.length ?? 0) > 0 && (
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {gamesByList[list.id].map((game) => (
                      <GameCard key={game.id} game={game} />
                    ))}
                  </div>
                )}
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}
