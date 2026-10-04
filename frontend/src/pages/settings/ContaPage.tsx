import { useState } from 'react'
import { useOutletContext, useRevalidator } from 'react-router'
import { IconCircleCheckFilled, IconPencil } from '@tabler/icons-react'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import type { EmailChangeResult } from '@/features/account/accountApi'
import ChangeEmailForm from '@/features/account/ChangeEmailForm'
import ChangePasswordForm from '@/features/account/ChangePasswordForm'
import type { SessionData } from '@/features/auth/requireSession'

type Editing = 'email' | 'password' | null
type Notice = { title: string; description: string }

export default function ContaPage() {
  // O usuário vem do loader de sessão da rota pai /settings (outlet context).
  const { user } = useOutletContext<SessionData>()
  const revalidator = useRevalidator()
  const [editing, setEditing] = useState<Editing>(null)
  const [notice, setNotice] = useState<Notice | null>(null)

  function startEditing(section: Exclude<Editing, null>) {
    setNotice(null)
    setEditing(section)
  }

  function handleEmailChanged(result: EmailChangeResult) {
    setEditing(null)

    if (result.pending_email) {
      setNotice({
        title: 'Confirme o novo e-mail',
        description: `Enviamos um link de confirmação para ${result.pending_email}. O e-mail da conta só muda depois que você confirmar.`,
      })
      return
    }

    // Sem confirmação pendente o e-mail já mudou: recarrega a sessão da tela.
    setNotice({
      title: 'E-mail atualizado',
      description: 'Use o novo e-mail no próximo login.',
    })
    revalidator.revalidate()
  }

  function handlePasswordChanged() {
    setEditing(null)
    setNotice({
      title: 'Senha atualizada',
      description: 'Use a nova senha no próximo login.',
    })
  }

  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle>Conta</CardTitle>
        <CardDescription>
          Seus dados de acesso. Só você vê esta área.
        </CardDescription>
      </CardHeader>

      <CardContent className="flex flex-col gap-8">
        {notice && (
          <Alert>
            <IconCircleCheckFilled />
            <AlertTitle>{notice.title}</AlertTitle>
            <AlertDescription>{notice.description}</AlertDescription>
          </Alert>
        )}

        <section
          aria-labelledby="account-email-title"
          className="flex flex-col gap-4"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h2 id="account-email-title" className="font-medium">
                E-mail
              </h2>
              <p className="truncate text-sm text-neutral-500">{user.email}</p>
            </div>

            {editing !== 'email' && (
              <Button
                variant="outline"
                size="sm"
                className="cursor-pointer"
                onClick={() => startEditing('email')}
              >
                <IconPencil className="size-4" />
                Alterar
              </Button>
            )}
          </div>

          {editing === 'email' && (
            <ChangeEmailForm
              onSuccess={handleEmailChanged}
              onCancel={() => setEditing(null)}
            />
          )}
        </section>

        <hr className="border-neutral-200" />

        <section
          aria-labelledby="account-password-title"
          className="flex flex-col gap-4"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h2 id="account-password-title" className="font-medium">
                Senha
              </h2>
              <p className="text-sm text-neutral-500">
                Use uma senha forte que você não usa em outros sites.
              </p>
            </div>

            {editing !== 'password' && (
              <Button
                variant="outline"
                size="sm"
                className="cursor-pointer"
                onClick={() => startEditing('password')}
              >
                <IconPencil className="size-4" />
                Alterar
              </Button>
            )}
          </div>

          {editing === 'password' && (
            <ChangePasswordForm
              onSuccess={handlePasswordChanged}
              onCancel={() => setEditing(null)}
            />
          )}
        </section>
      </CardContent>
    </Card>
  )
}
