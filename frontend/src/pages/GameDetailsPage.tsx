import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router'
import { GameNotFoundError, getGame, type GameDetail } from '@/lib/games'
import { label } from '@/lib/labels'

type State =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'not-found' }
  | { status: 'ok'; game: GameDetail }

const chipClass =
  'rounded-md border border-neutral-200 px-2 py-0.5 text-xs text-neutral-700'
const sectionTitleClass =
  'mb-2 text-xs font-medium uppercase tracking-wide text-neutral-500'

export function GameDetailsPage() {
  const { id = '' } = useParams()
  const [state, setState] = useState<State>({ status: 'loading' })

  useEffect(() => {
    let cancelled = false
    setState({ status: 'loading' })

    getGame(id)
      .then((game) => {
        if (!cancelled) setState({ status: 'ok', game })
      })
      .catch((err) => {
        if (cancelled) return
        setState({
          status: err instanceof GameNotFoundError ? 'not-found' : 'error',
        })
      })

    return () => {
      cancelled = true
    }
  }, [id])

  return (
    <main className="min-h-screen bg-neutral-50 text-neutral-900">
      <div className="mx-auto max-w-4xl px-6 py-12">
        <Link
          to="/bonfirehub"
          className="text-sm text-neutral-500 hover:text-neutral-900 focus-visible:outline-2 focus-visible:outline-neutral-900"
        >
          ← Voltar para os jogos
        </Link>

        {state.status === 'loading' && (
          <p className="mt-6 text-sm text-neutral-500" aria-live="polite">
            Carregando...
          </p>
        )}

        {state.status === 'not-found' && (
          <div
            role="alert"
            className="mt-6 rounded-xl border border-neutral-200 bg-white p-4"
          >
            <p className="text-sm font-medium">Jogo não encontrado</p>
            <p className="text-sm text-neutral-500">
              Esse jogo não existe ou foi removido.
            </p>
          </div>
        )}

        {state.status === 'error' && (
          <div
            role="alert"
            className="mt-6 rounded-xl border border-neutral-200 bg-white p-4"
          >
            <p className="text-sm font-medium">Atenção</p>
            <p className="text-sm text-neutral-500">
              Não foi possível carregar o jogo. Confira se a API está rodando.
            </p>
          </div>
        )}

        {state.status === 'ok' && (
          <article className="mt-6 overflow-hidden rounded-xl border border-neutral-200 bg-white md:grid md:grid-cols-[320px_1fr]">
            <div className="grid h-64 place-items-center bg-neutral-100 md:h-full">
              {state.game.cover_url ? (
                <img
                  src={state.game.cover_url}
                  alt={`Capa de ${state.game.name}`}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span
                  aria-hidden="true"
                  className="text-6xl font-semibold text-neutral-400"
                >
                  {state.game.name.charAt(0)}
                </span>
              )}
            </div>

            <div className="space-y-6 p-6">
              <h1 className="text-2xl font-semibold">{state.game.name}</h1>

              <section>
                <h2 className={sectionTitleClass}>Gêneros</h2>
                <ul className="flex flex-wrap gap-1.5">
                  {state.game.genres.map((g) => (
                    <li key={g} className={chipClass}>
                      {label(g)}
                    </li>
                  ))}
                </ul>
              </section>

              <section>
                <h2 className={sectionTitleClass}>Plataformas</h2>
                <ul className="flex flex-wrap gap-1.5">
                  {state.game.platforms.map((p) => (
                    <li key={p} className={chipClass}>
                      {label(p)}
                    </li>
                  ))}
                </ul>
              </section>

              <section>
                <h2 className={sectionTitleClass}>Sobre</h2>
                <p className="text-sm leading-relaxed text-neutral-700">
                  {state.game.description ?? 'Este jogo ainda não tem descrição.'}
                </p>
              </section>
            </div>
          </article>
        )}
      </div>
    </main>
  )
}

export default GameDetailsPage
