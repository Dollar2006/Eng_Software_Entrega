import { useId, useRef, useState, type KeyboardEvent } from 'react'

import MyReviews from '@/features/profile/MyReviews'
import CustomLists from '@/features/profile/CustomLists'
import { cn } from '@/lib/utils'

const TABS = [
  { id: 'reviews', label: 'Reviews' },
  { id: 'listas', label: 'Listas' },
] as const

type TabId = (typeof TABS)[number]['id']

// Abas do perfil. Feitas à mão (role=tab) para não depender de um componente
// Tabs do components/ui: setas esquerda/direita trocam de aba.
export default function ProfileTabs() {
  const [active, setActive] = useState<TabId>('reviews')
  const baseId = useId()
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([])

  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return
    event.preventDefault()

    const step = event.key === 'ArrowRight' ? 1 : -1
    const next = (index + step + TABS.length) % TABS.length
    setActive(TABS[next].id)
    tabRefs.current[next]?.focus()
  }

  return (
    <section className="flex flex-col gap-6 p-2">
      <div
        role="tablist"
        aria-label="Seções do perfil"
        className="grid grid-cols-2 gap-1 rounded-xl border border-neutral-300 bg-white p-1"
      >
        {TABS.map((tab, index) => {
          const isActive = active === tab.id

          return (
            <button
              key={tab.id}
              ref={(element) => {
                tabRefs.current[index] = element
              }}
              type="button"
              role="tab"
              id={`${baseId}-tab-${tab.id}`}
              aria-selected={isActive}
              aria-controls={`${baseId}-panel-${tab.id}`}
              tabIndex={isActive ? 0 : -1}
              onClick={() => setActive(tab.id)}
              onKeyDown={(event) => handleKeyDown(event, index)}
              className={cn(
                'cursor-pointer rounded-lg py-1.5 text-sm transition-colors focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:outline-none',
                isActive
                  ? 'bg-neutral-200 font-medium text-neutral-900'
                  : 'text-neutral-500 hover:text-neutral-900',
              )}
            >
              {tab.label}
            </button>
          )
        })}
      </div>

      <div
        role="tabpanel"
        id={`${baseId}-panel-reviews`}
        aria-labelledby={`${baseId}-tab-reviews`}
        hidden={active !== 'reviews'}
        className="space-y-4"
      >
        <h2 className="text-base font-medium">Minhas Reviews de Jogos</h2>
        <MyReviews />
      </div>

      <div
        role="tabpanel"
        id={`${baseId}-panel-listas`}
        aria-labelledby={`${baseId}-tab-listas`}
        hidden={active !== 'listas'}
        className="space-y-4"
      >
        <h2 className="text-base font-medium">Minhas Listas</h2>
        <CustomLists />
      </div>
    </section>
  )
}