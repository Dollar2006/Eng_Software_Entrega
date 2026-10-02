import { useState } from 'react'
import { useOutletContext } from 'react-router'
import { IconCircleCheckFilled, IconPencil } from '@tabler/icons-react'

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
import ProfileForm, { type ProfileDraft } from '@/features/profile/ProfileForm'

const EMPTY_PROFILE: ProfileDraft = {
  displayName: '',
  bio: '',
  avatarUrl: null,
}

export default function PerfilPage() {
  // O loader de sessão fica na rota pai /settings, então o dado chega pelo
  // outlet context. useLoaderData aqui devolveria undefined.
  const { user } = useOutletContext<SessionData>()
  const [profile, setProfile] = useState<ProfileDraft>(EMPTY_PROFILE)
  const [isEditing, setIsEditing] = useState(false)
  const [saved, setSaved] = useState(false)

  function handleSave(draft: ProfileDraft) {
    // Ainda não existe PATCH /users/me: o perfil vive só nesta tela e some no
    // F5. Quando a API entrar, a troca é esta linha por uma chamada.
    setProfile(draft)
    setIsEditing(false)
    setSaved(true)
  }

  // Sem nome de exibição, a identidade é a parte antes do @ do e-mail — a
  // mesma que o AvatarPicker usa para as iniciais.
  const identity = profile.displayName.trim() || user.email.split('@')[0]

  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle>Perfil</CardTitle>
        <CardDescription>Como os outros usuários te veem.</CardDescription>
        {!isEditing && (
          <CardAction>
            <Button
              variant="outline"
              size="sm"
              className="cursor-pointer"
              onClick={() => {
                setSaved(false)
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
        {saved && (
          <Alert>
            <IconCircleCheckFilled />
            <AlertTitle>Perfil atualizado</AlertTitle>
            <AlertDescription>
              As alterações valem só nesta sessão — ainda não há salvamento no
              servidor.
            </AlertDescription>
          </Alert>
        )}

        {isEditing ? (
          <ProfileForm
            profile={profile}
            email={user.email}
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
      </CardContent>
    </Card>
  )
}