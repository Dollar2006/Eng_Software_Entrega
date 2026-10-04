import { useRef, useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router'
import {
  IconDeviceGamepad2,
  IconLogin2,
  IconLogout,
  IconMenu2,
  IconUserCircle,
  IconX,
} from '@tabler/icons-react'

import { Button } from '@/components/ui/button'
import {
  getCurrentUser,
  logoutAccount,
  type AuthUser,
} from '@/features/auth/authApi'
import { cn } from '@/lib/utils'

const navItems = [
  { label: 'Jogos', to: '/bonfirehub', icon: IconDeviceGamepad2 },
  { label: 'Perfil', to: '/settings/perfil', icon: IconUserCircle },
]

export default function AppNav() {
  const navigate = useNavigate()
  const dialogRef = useRef<HTMLDialogElement>(null)
  // undefined = consultando a sessão; null = sem login
  const [user, setUser] = useState<AuthUser | null | undefined>(undefined)
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  function openMenu() {
    dialogRef.current?.showModal()
    // A sessão só é consultada quando o menu abre, não ao carregar a página.
    getCurrentUser()
      .then(setUser)
      .catch(() => setUser(null))
  }

  function closeMenu() {
    dialogRef.current?.close()
  }

  async function handleLogout() {
    setIsLoggingOut(true)
    try {
      await logoutAccount()
    } catch {
      // O logout é local: mesmo se a chamada falhar, a sessão termina aqui.
    }
    setIsLoggingOut(false)
    setUser(null)
    closeMenu()
    navigate('/login', { replace: true })
  }

  return (
    <>
      <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-neutral-200 bg-white/90 px-4 backdrop-blur">
        <Button
          variant="outline"
          size="sm"
          aria-label="Abrir menu"
          aria-haspopup="dialog"
          onClick={openMenu}
          className="cursor-pointer px-2"
        >
          <IconMenu2 className="size-5" />
        </Button>
        <Link to="/bonfirehub" className="font-semibold tracking-tight">
          Bonfire
        </Link>
      </header>

      <dialog
        ref={dialogRef}
        aria-label="Menu de navegação"
        // Clicar fora do painel (na área escurecida) fecha o menu.
        onClick={(event) => {
          if (event.target === event.currentTarget) closeMenu()
        }}
        className="m-0 h-dvh max-h-none w-screen max-w-none border-0 bg-transparent p-0 backdrop:bg-black/40"
      >
        <aside className="flex h-full w-72 max-w-[85vw] flex-col bg-white shadow-xl">
          <div className="flex h-14 shrink-0 items-center justify-between border-b border-neutral-200 px-4">
            <span className="font-semibold tracking-tight">Bonfire</span>
            <Button
              variant="outline"
              size="sm"
              aria-label="Fechar menu"
              onClick={closeMenu}
              className="cursor-pointer px-2"
            >
              <IconX className="size-5" />
            </Button>
          </div>

          <nav
            aria-label="Navegação principal"
            className="flex flex-1 flex-col gap-1 overflow-y-auto p-3"
          >
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={closeMenu}
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
            ))}
          </nav>

          <div className="shrink-0 border-t border-neutral-200 p-3">
            {user === undefined && (
              <p className="px-3 text-xs text-neutral-500">Carregando...</p>
            )}

            {user && (
              <>
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
              </>
            )}

            {user === null && (
              <Link
                to="/login"
                onClick={closeMenu}
                className="flex h-9 items-center justify-center gap-2 rounded-lg border border-neutral-200 bg-white px-3 text-sm font-medium hover:bg-neutral-100"
              >
                <IconLogin2 className="size-4" />
                Entrar
              </Link>
            )}
          </div>
        </aside>
      </dialog>
    </>
  )
}
