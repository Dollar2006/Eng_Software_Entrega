import { useState } from 'react'
import { NavLink, Outlet, useLoaderData, useNavigate } from 'react-router'
import { IconLogout, IconSettings, IconUserCircle } from '@tabler/icons-react'

import { Button } from '@/components/ui/button'
import { logoutAccount } from '@/features/auth/authApi'
import type { SessionData } from '@/features/auth/requireSession'
import { cn } from '@/lib/utils'

type SettingsNavItem = {
  label: string
  to: string
  icon: typeof IconUserCircle
  disabled?: boolean
  badge?: string
}

const settingsNav: SettingsNavItem[] = [
  { label: 'Perfil', to: 'perfil', icon: IconUserCircle },
  {
    label: 'Conta',
    to: 'conta',
    icon: IconSettings,
    disabled: true,
    badge: 'Em breve',
  },
]

export default function SettingsLayout() {
  const { user } = useLoaderData() as SessionData
  const navigate = useNavigate()
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  async function handleLogout() {
    setIsLoggingOut(true)
    try {
      await logoutAccount()
    } catch {
      // O logout e local-only: mesmo se a chamada falhar, os cookies foram
      // limpos no navegador e a sessao termina aqui.
    }
    setIsLoggingOut(false)
    // Sai da area protegida em vez de ficar em /settings, que voltaria a
    // rodar o loader e cair no login de qualquer jeito.
    navigate('/login', { replace: true })
  }

  return (
    <main className="min-h-svh bg-neutral-50 text-neutral-900">
      <div className="mx-auto max-w-5xl px-6 py-10">
        <header className="mb-8">
          <h1 className="text-2xl font-semibold">Configurações</h1>
        </header>

        <div className="grid gap-8 lg:grid-cols-[13rem_1fr]">
          <div className="flex flex-col gap-6">
            <nav
              aria-label="Seções das configurações"
              className="flex gap-1 overflow-x-auto lg:flex-col"
            >
              {settingsNav.map((item) =>
                item.disabled ? (
                  <span
                    key={item.label}
                    aria-disabled="true"
                    className="flex cursor-not-allowed items-center gap-2 rounded-lg px-3 py-2 text-sm text-neutral-400"
                  >
                    <item.icon className="size-4 shrink-0" />
                    {item.label}
                    {item.badge && (
                      <span className="rounded-full bg-neutral-200 px-2 py-0.5 text-xs text-neutral-500">
                        {item.badge}
                      </span>
                    )}
                  </span>
                ) : (
                  <NavLink
                    key={item.label}
                    to={item.to}
                    className={({ isActive }) =>
                      cn(
                        'flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors',
                        isActive
                          ? 'bg-neutral-900 text-white'
                          : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900',
                      )
                    }
                  >
                    <item.icon className="size-4 shrink-0" />
                    {item.label}
                  </NavLink>
                ),
              )}
            </nav>

            <div className="border-t border-neutral-200 pt-4">
              <p className="truncate px-3 text-xs text-neutral-500">
                Usuário: {user.email}
              </p>
              <Button
                variant="outline"
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="mt-2 w-full cursor-pointer justify-start gap-2 px-3"
              >
                <IconLogout className="size-4" />
                {isLoggingOut ? 'Saindo...' : 'Sair'}
              </Button>
            </div>
          </div>

          <div className="min-w-0">
            <Outlet />
          </div>
        </div>
      </div>
    </main>
  )
}