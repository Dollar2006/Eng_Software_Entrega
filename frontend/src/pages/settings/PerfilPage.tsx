import { useEffect, useState } from 'react'
import { useOutletContext } from 'react-router'
import { IconAlertCircleFilled, IconCircleCheckFilled, IconPencil } from '@tabler/icons-react'

import Avatar from '@/components/profile/Avatar'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import type { SessionData } from '@/features/auth/requireSession'
import ProfileForm from '@/features/profile/ProfileForm'
import { getProfile, toDraft, toPayload, updateProfile } from '@/features/profile/profileApi'
import type { ProfileDraft } from '@/features/profile/profileSchema'
import { ApiError } from '@/lib/api'

type State =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'ok'; profile: ProfileDraft }

export default function PerfilPage() {
  const { user } = useOutletContext<SessionData>()
  const [state, setState] = useState<State>({ status: 'loading' })
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    let cancelled = false

    getProfile()
      .then((profile) => {
        if (!cancelled) setState({ status: 'ok', profile: toDraft(profile) })
      })
      .catch(() => {
        if (!cancelled) setState({ status: 'error' })
      })

    return () => {
      cancelled = true
    }
  }, [])

  async function handleSave(draft: ProfileDraft) {
    setIsSaving(true)
    setSaveError(null)

    try {
      const profile = await updateProfile(toPayload(draft))
      // A resposta ja vem com o perfil salvo, entao o estado local e o que o
      // servidor gravou: sem GET de confirmacao e sem drift entre os dois.
      setState({ status: 'ok', profile: toDraft(profile) })
      setIsEditing(false)
      setSaved(true)
    } catch (error) {
      setSaveError(
        error instanceof ApiError
          ? error.message
          : 'Não foi possível salvar. Tente novamente.',
      )
    } finally {
      setIsSaving(false)
    }
  }

  const isLoading = state.status === 'loading'
  const profile = state.status === 'ok' ? state.profile : null

  // Sem nome de exibição, a identidade é a parte antes do @ do e-mail — a
  // mesma que o AvatarPicker usa para as iniciais.
  const identity = profile?.displayName.trim() || user.email.split('@')[0]

  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle>Perfil</CardTitle>
        <CardDescription>Como os outros usuários te veem.</CardDescription>
        {!isEditing && !isLoading && (
          <CardAction>
            <Button
              variant="outline"
              size="sm"
              className="cursor-pointer"
              onClick={() => {
                setSaved(false)
                setSaveError(null)
                setIsEditing(true)
              }}
            >
              <IconPencil className="size-4" />
              Editar
            </Button>
          </CardAction>
        )}
      </CardHeader>

      <CardContent className="flex flex-col gap-6">
        {isLoading && (
          <p className="text-sm text-neutral-500" aria-live="polite">
            Carregando...
          </p>
        )}

        {state.status === 'error' && (
          <Alert variant="destructive">
            <IconAlertCircleFilled />
            <AlertTitle>Não foi possível carregar o perfil</AlertTitle>
            <AlertDescription>
              Recarregue a página. Se persistir, o servidor pode estar fora do
              ar.
            </AlertDescription>
          </Alert>
        )}

        {profile && (
          <>
            {saveError && (
              <Alert variant="destructive">
                <IconAlertCircleFilled />
                <AlertTitle>Não foi possível salvar</AlertTitle>
                <AlertDescription>{saveError}</AlertDescription>
              </Alert>
            )}

            {saved && !isEditing && (
              <Alert>
                <IconCircleCheckFilled />
                <AlertTitle>Perfil atualizado</AlertTitle>
                <AlertDescription>
                  Suas alterações já estão salvas.
                </AlertDescription>
              </Alert>
            )}

            {isEditing ? (
              <ProfileForm
                profile={profile}
                email={user.email}
                isSaving={isSaving}
                onSave={handleSave}
                onCancel={() => setIsEditing(false)}
              />
            ) : (
              <div className="flex flex-col gap-6">
                <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
                  <Avatar src={profile.avatarUrl} name={identity} />

                  <div className="min-w-0">
                    <p className="font-medium">{identity}</p>
                    <p className="truncate text-sm text-neutral-500">{user.email}</p>
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <p className="text-xs font-medium text-neutral-500">Bio</p>
                  <p className="text-sm whitespace-pre-wrap">
                    {profile.bio.trim() || 'Você ainda não escreveu uma bio.'}
                  </p>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}