import { useEffect, useState } from 'react'
import { IconCheck, IconDotsVertical, IconPlus, IconX } from '@tabler/icons-react'

import GameCard from '@/components/game/GameCard'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ApiError } from '@/lib/api'
import { getGame, type GameDetail } from '@/lib/games'
import {
  createCustomList,
  deleteCustomList,
  getListItems,
  getMyLists,
  updateCustomList,
  type ListRef,
} from '@/lib/lists'

type ListState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; lists: ListRef[]; counts: Record<number, number> }

export default function CustomLists() {
  const [state, setState] = useState<ListState>({ status: 'loading' })
  const [name, setName] = useState('')
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [updatingId, setUpdatingId] = useState<number | null>(null)
  const [menuId, setMenuId] = useState<number | null>(null)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editName, setEditName] = useState('')
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [loadingItemsId, setLoadingItemsId] = useState<number | null>(null)
  const [gamesByList, setGamesByList] = useState<Record<number, GameDetail[]>>({})
  const [formError, setFormError] = useState('')

  async function fetchLists() {
    const lists = (await getMyLists()).filter((list) => list.kind === 'custom')
    const entries = await Promise.all(
      lists.map(async (list) => [list.id, (await getListItems(list.id)).length] as const),
    )
    return { lists, counts: Object.fromEntries(entries) }
  }

  useEffect(() => {
    let cancelled = false
    fetchLists()
      .then(({ lists, counts }) => {
        if (!cancelled) setState({ status: 'ready', lists, counts })
      })
      .catch(() => {
        if (!cancelled) {
          setState({
            status: 'error',
            message: 'Não foi possível carregar suas listas.',
          })
        }
      })
    return () => {
      cancelled = true
    }
  }, [])

  async function handleCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const trimmedName = name.trim()
    if (!trimmedName) {
      setFormError('Digite um nome para a lista.')
      return
    }

    setSaving(true)
    setFormError('')
    try {
      await createCustomList(trimmedName)
      setName('')
      const { lists, counts } = await fetchLists()
      setState({ status: 'ready', lists, counts })
    } catch (error) {
      setFormError(
        error instanceof ApiError ? error.message : 'Não foi possível criar a lista.',
      )
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(list: ListRef) {
    setMenuId(null)
    setDeletingId(list.id)
    setFormError('')
    try {
      await deleteCustomList(list.id)
      setGamesByList((current) => {
        const next = { ...current }
        delete next[list.id]
        return next
      })
      if (expandedId === list.id) setExpandedId(null)
      const { lists, counts } = await fetchLists()
      setState({ status: 'ready', lists, counts })
    } catch (error) {
      setFormError(
        error instanceof ApiError ? error.message : 'Não foi possível excluir a lista.',
      )
    } finally {
      setDeletingId(null)
    }
  }

  function startEditing(list: ListRef) {
    setMenuId(null)
    setEditingId(list.id)
    setEditName(list.name)
    setFormError('')
  }

  function cancelEditing() {
    setEditingId(null)
    setEditName('')
  }

  async function handleUpdate(event: React.FormEvent<HTMLFormElement>, list: ListRef) {
    event.preventDefault()
    const trimmedName = editName.trim()
    if (!trimmedName) {
      setFormError('Digite um nome para a lista.')
      return
    }

    setUpdatingId(list.id)
    setFormError('')
    try {
      await updateCustomList(list.id, trimmedName)
      const { lists, counts } = await fetchLists()
      setState({ status: 'ready', lists, counts })
      cancelEditing()
    } catch (error) {
      setFormError(
        error instanceof ApiError ? error.message : 'Não foi possível editar a lista.',
      )
    } finally {
      setUpdatingId(null)
    }
  }

  async function handleToggleList(list: ListRef) {
    if (expandedId === list.id) {
      setExpandedId(null)
      return
    }

    setExpandedId(list.id)
    if (gamesByList[list.id]) return

    setLoadingItemsId(list.id)
    setFormError('')
    try {
      const items = await getListItems(list.id)
      const games = (
        await Promise.all(
          items.map(async (item) => {
            try {
              return await getGame(String(item.game_id))
            } catch {
              return null
            }
          }),
        )
      ).filter((game): game is GameDetail => game !== null)
      setGamesByList((current) => ({ ...current, [list.id]: games }))
    } catch {
      setFormError('Não foi possível carregar os jogos da lista.')
    } finally {
      setLoadingItemsId(null)
    }
  }

  return (
    <div className="space-y-5">
      <form onSubmit={handleCreate} className="flex flex-col gap-2 sm:flex-row">
        <Input
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Nome da nova lista"
          maxLength={50}
          aria-label="Nome da nova lista"
          disabled={saving}
        />
        <Button type="submit" disabled={saving} className="shrink-0 cursor-pointer">
          <IconPlus aria-hidden="true" />
          {saving ? 'Criando...' : 'Criar lista'}
        </Button>
      </form>

      {formError && <p className="text-sm text-red-600">{formError}</p>}

      {state.status === 'loading' && (
        <p className="text-sm text-neutral-500" aria-live="polite">
          Carregando listas...
        </p>
      )}

      {state.status === 'error' && (
        <p className="text-sm text-red-600" role="alert">
          {state.message}
        </p>
      )}

      {state.status === 'ready' && state.lists.length === 0 && (
        <p className="text-sm text-neutral-500">
          Você ainda não criou uma lista personalizada.
        </p>
      )}

      {state.status === 'ready' && state.lists.length > 0 && (
        <ul className="divide-y divide-neutral-200 rounded-lg border border-neutral-200 bg-white">
          {state.lists.map((list) => (
            <li key={list.id}>
              <div className="flex items-center justify-between gap-4 p-4">
                {editingId === list.id ? (
                  <form
                    onSubmit={(event) => void handleUpdate(event, list)}
                    className="flex min-w-0 flex-1 items-center gap-2"
                  >
                    <Input
                      value={editName}
                      onChange={(event) => setEditName(event.target.value)}
                      maxLength={50}
                      aria-label="Novo nome da lista"
                      disabled={updatingId === list.id}
                      autoFocus
                    />
                    <Button
                      type="submit"
                      variant="ghost"
                      size="icon-sm"
                      disabled={updatingId === list.id}
                      aria-label="Salvar nome da lista"
                      title="Salvar"
                      className="cursor-pointer"
                    >
                      <IconCheck aria-hidden="true" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      disabled={updatingId === list.id}
                      onClick={cancelEditing}
                      aria-label="Cancelar edição"
                      title="Cancelar"
                      className="cursor-pointer"
                    >
                      <IconX aria-hidden="true" />
                    </Button>
                  </form>
                ) : (
                  <button
                    type="button"
                    aria-expanded={expandedId === list.id}
                    onClick={() => void handleToggleList(list)}
                    className="min-w-0 flex-1 cursor-pointer text-left focus-visible:outline-2 focus-visible:outline-neutral-900"
                  >
                    <p className="truncate text-sm font-medium">{list.name}</p>
                    <p className="text-xs text-neutral-500">
                      {state.counts[list.id] ?? 0}{' '}
                      {state.counts[list.id] === 1 ? 'jogo' : 'jogos'}
                    </p>
                  </button>
                )}

                {editingId !== list.id && (
                  <div className="relative">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      disabled={deletingId === list.id}
                      onClick={() => setMenuId((current) => (current === list.id ? null : list.id))}
                      aria-label={`Ações da lista ${list.name}`}
                      aria-haspopup="menu"
                      aria-expanded={menuId === list.id}
                      title="Ações da lista"
                      className="cursor-pointer"
                    >
                      <IconDotsVertical aria-hidden="true" />
                    </Button>
                    {menuId === list.id && (
                      <div
                        role="menu"
                        className="absolute right-0 z-20 mt-1 w-32 rounded-lg border border-neutral-200 bg-white py-1 shadow-lg"
                      >
                        <button
                          type="button"
                          role="menuitem"
                          onClick={() => startEditing(list)}
                          className="w-full cursor-pointer px-3 py-2 text-left text-sm hover:bg-neutral-100 focus-visible:bg-neutral-100 focus-visible:outline-none"
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          role="menuitem"
                          onClick={() => void handleDelete(list)}
                          className="w-full cursor-pointer px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 focus-visible:bg-red-50 focus-visible:outline-none"
                        >
                          Excluir
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {expandedId === list.id && (
                <div className="border-t border-neutral-200 p-4">
                  {loadingItemsId === list.id && (
                    <p className="text-sm text-neutral-500" aria-live="polite">
                      Carregando jogos...
                    </p>
                  )}
                  {loadingItemsId !== list.id && gamesByList[list.id]?.length === 0 && (
                    <p className="text-sm text-neutral-500">
                      Esta lista ainda não tem jogos.
                    </p>
                  )}
                  {loadingItemsId !== list.id && gamesByList[list.id]?.length > 0 && (
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
      )}
    </div>
  )
}
