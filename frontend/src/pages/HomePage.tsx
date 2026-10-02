import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router'
import {
  IconAlertTriangleFilled,
  IconCircleCheckFilled,
  IconLoader2,
} from '@tabler/icons-react'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import {
  getCurrentUser,
  logoutAccount,
  type AuthUser,
} from '@/features/auth/authApi'
import { ApiError } from '@/lib/api'

type SessionState =
  | { status: 'loading' }
  | { status: 'authenticated'; user: AuthUser }
  | { status: 'anonymous' }
  | { status: 'error'; message: string }

export default function HomePage() {
  const [session, setSession] = useState<SessionState>({ status: 'loading' })
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  useEffect(() => {
    let active = true

    getCurrentUser()
      .then((user) => {
        if (active) setSession({ status: 'authenticated', user })
      })
      .catch((error: unknown) => {
        if (!active) return
        setSession(
          error instanceof ApiError && error.status !== 401
            ? { status: 'error', message: error.message }
            : { status: 'anonymous' },
        )
      })

    return () => {
      active = false
    }
  }, [])

  const handleLogout = useCallback(async () => {
    setIsLoggingOut(true)
    try {
      await logoutAccount()
      setSession({ status: 'anonymous' })
    } catch {
      // Se a chamada falhar, os cookies foram limpos no client e a sessao termina aqui.
      setSession({ status: 'anonymous' })
    } finally {
      setIsLoggingOut(false)
    }
  }, [])

  return (
    <main className="flex min-h-svh items-center justify-center bg-neutral-50 p-6">
      <Card className="w-full max-w-sm">
        {session.status === 'loading' && (
          <CardContent className="flex items-center justify-center gap-2 text-muted-foreground">
            <IconLoader2 className="size-4 animate-spin" />
            <span className="text-sm">Verificando sessão...</span>
          </CardContent>
        )}

        {session.status === 'authenticated' && (
          <>
            <CardContent className="flex flex-col gap-4">
              <Alert>
                <AlertTitle className="flex items-center gap-2">
                  <IconCircleCheckFilled className="size-4" /> Sessão ativa
                </AlertTitle>
                <AlertDescription>
                  Conectado como <strong>{session.user.email}</strong>
                </AlertDescription>
              </Alert>
            </CardContent>
            <CardFooter className="flex-col gap-2">
              <Button asChild className="w-full cursor-pointer">
                <Link to="/settings">Configurações</Link>
              </Button>
              <Button
                className="w-full cursor-pointer"
                disabled={isLoggingOut}
                onClick={handleLogout}
                variant="outline"
              >
                {isLoggingOut ? 'Saindo...' : 'Sair'}
              </Button>
            </CardFooter>
          </>
        )}

        {session.status === 'anonymous' && (
          <>
            <CardContent className="flex flex-col gap-4">
              <Alert>
                <AlertTitle className="flex items-center gap-2">
                  <IconAlertTriangleFilled className="size-4" /> Faça login
                </AlertTitle>
                <AlertDescription>
                  Você ainda não está conectado.
                </AlertDescription>
              </Alert>
            </CardContent>
            <CardFooter className="flex-col gap-2">
              <Button asChild className="w-full cursor-pointer">
                <Link to="/login">Entrar</Link>
              </Button>
              <Button asChild className="w-full cursor-pointer" variant="outline">
                <Link to="/cadastro">Criar conta</Link>
              </Button>
            </CardFooter>
          </>
        )}

        {session.status === 'error' && (
          <CardContent className="flex flex-col gap-4">
            <Alert variant="destructive">
              <AlertTitle className="flex items-center gap-2">
                <IconAlertTriangleFilled className="size-4" /> Falha ao
                consultar a sessão
              </AlertTitle>
              <AlertDescription>{session.message}</AlertDescription>
            </Alert>
          </CardContent>
        )}
      </Card>
    </main>
  )
}
