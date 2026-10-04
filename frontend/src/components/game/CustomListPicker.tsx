import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { IconCheck, IconChevronDown, IconPlus } from '@tabler/icons-react'

import { ApiError } from '@/lib/api'
import {
  addListItem,
  createCustomList,
  getListItems,
  getMyLists,
  removeListItem,
  type ListRef,
} from '@/lib/lists'

type Props = {
  gameId: string | number
}

type ListWithGame = ListRef & { containsGame: boolean }

type State =
  | { status: 'loading' }
  | { status: 'anonymous' }
  | { status: 'error' }
  | { status: 'ready'; lists: ListWithGame[] }

export default function CustomListPicker({ gameId }: Props) {
  const navigate = useNavigate()
  const [state, setState] = useState<State>({ status: 'loading' })
  const [savingId, setSavingId] = useState<number | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [newListName, setNewListName] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [actionError, setActionError] = useState('')

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const lists = (await getMyLists()).filter((list) => list.kind === 'custom')
        const listsWithGame = await Promise.all(
          lists.map(async (list) => {
            const items = await getListItems(list.id)
            return { ...list, containsGame: items.some((item) => item.game_id === Number(gameId)) }
          }),
        )
        if (!cancelled) {
          setState({ status: 'ready', lists: listsWithGame })
        }
      } catch (error) {
        if (cancelled) return
        setState({ status: error instanceof ApiError && error.status === 401 ? 'anonymous' : 'error' })
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [gameId])

  async function toggleList(list: ListWithGame) {
    setIsOpen(false)
    setActionError('')
    setSavingId(list.id)
    try {
      if (list.containsGame) {
        await removeListItem(list.id, Number(gameId))
      } else {
        await addListItem(list.id, Number(gameId))
      }
      setState((current) =>
        current.status === 'ready'
          ? {
              status: 'ready',
              lists: current.lists.map((currentList) =>
                currentList.id === list.id
                  ? { ...currentList, containsGame: !currentList.containsGame }
                  : currentList,
              ),
            }
          : current,
      )
    } catch {
      // Mantém o estado anterior quando a operação não é concluída.
    } finally {
      setSavingId(null)
    }
  }

  async function handleCreateList(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const name = newListName.trim()
    if (!name || state.status !== 'ready') return

    setIsCreating(true)
    setActionError('')
    try {
      const list = await createCustomList(name)
      await addListItem(list.id, Number(gameId))
      setState((current) =>
        current.status === 'ready'
          ? {
              status: 'ready',
              lists: [...current.lists, { ...list, containsGame: true }],
            }
          : current,
      )
      setNewListName('')
    } catch (error) {
      setActionError(
        error instanceof ApiError ? error.message : 'Não foi possível criar a lista.',
      )
    } finally {
      setIsCreating(false)
    }
  }

  if (state.status === 'loading') {
    return <p className="text-sm text-neutral-500">Carregando listas...</p>
  }

  if (state.status === 'anonymous') {
    return (
      <p className="text-sm text-neutral-600">
        <button
          type="button"
          className="cursor-pointer underline underline-offset-4 hover:text-neutral-900"
          onClick={() => navigate(`/login?redirect=${encodeURIComponent(`/jogos/${gameId}`)}`)}
        >
          Faça login
        </button>{' '}
        para adicionar o jogo a uma lista personalizada.
      </p>
    )
  }

  if (state.status === 'error') {
    return <p className="text-sm text-neutral-500">Não foi possível carregar suas listas.</p>
  }

  if (state.lists.length === 0) {
    return (
      <p className="text-sm text-neutral-500">
        Crie uma lista personalizada no seu perfil para organizar este jogo.
      </p>
    )
  }

  return (
    <div className="relative max-w-sm">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label="Selecionar lista personalizada"
        disabled={savingId !== null}
        onClick={() => setIsOpen((open) => !open)}
        className="flex h-9 w-full cursor-pointer items-center justify-between gap-3 rounded-lg border border-neutral-200 bg-white px-3 text-sm text-neutral-900 outline-none hover:border-neutral-400 focus-visible:ring-2 focus-visible:ring-neutral-900 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <span>{savingId !== null ? 'Salvando...' : 'Selecionar lista...'}</span>
        <IconChevronDown className="size-4 shrink-0 text-neutral-500" aria-hidden="true" />
      </button>

      {isOpen && savingId === null && (
        <div
          role="listbox"
          aria-label="Listas personalizadas"
          className="absolute z-20 mt-1 w-full overflow-hidden rounded-lg border border-neutral-200 bg-white py-1 shadow-lg"
        >
          {state.lists.map((list) => (
            <button
              key={list.id}
              type="button"
              role="option"
              aria-selected={list.containsGame}
              onClick={() => void toggleList(list)}
              className="flex w-full cursor-pointer items-center justify-between gap-3 px-3 py-2 text-left text-sm text-neutral-800 hover:bg-neutral-100 focus-visible:bg-neutral-100 focus-visible:outline-none"
            >
              <span className="truncate">{list.name}</span>
              {list.containsGame && (
                <IconCheck className="size-4 shrink-0 text-neutral-900" aria-label="Jogo adicionado" />
              )}
            </button>
          ))}
          <form
            onSubmit={(event) => void handleCreateList(event)}
            className="flex gap-2 border-t border-neutral-200 p-2"
          >
            <input
              value={newListName}
              onChange={(event) => setNewListName(event.target.value)}
              placeholder="Nova lista"
              maxLength={50}
              aria-label="Nome da nova lista"
              disabled={isCreating}
              className="h-8 min-w-0 flex-1 rounded-md border border-neutral-200 px-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 disabled:opacity-60"
            />
            <button
              type="submit"
              disabled={isCreating || !newListName.trim()}
              aria-label="Criar lista"
              title="Criar lista"
              className="flex size-8 cursor-pointer items-center justify-center rounded-md text-neutral-700 hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <IconPlus className="size-4" aria-hidden="true" />
            </button>
          </form>
          {actionError && (
            <p className="px-3 pb-2 text-xs text-red-600" role="alert">
              {actionError}
            </p>
          )}
        </div>
      )}
    </div>
  )
}