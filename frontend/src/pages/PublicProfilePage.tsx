import { useEffect, useState } from 'react'
import { useParams } from 'react-router'
import { IconAlertCircleFilled } from '@tabler/icons-react'

import Avatar from '@/components/profile/Avatar'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import PublicProfileTabs from '@/features/profile/PublicProfileTabs'
import { getPublicProfile, type PublicProfile } from '@/features/profile/profileApi'
import { followUser, getFollowStats, isFollowing, unfollowUser, type FollowStats } from '@/lib/follows'
import { hasSession } from '@/features/auth/requireSession'
import { ApiError } from '@/lib/api'

type State =
  | { status: 'loading' }
  | { status: 'not_found' }
  | { status: 'error' }
  | { status: 'ok'; profile: PublicProfile }

export default function PublicProfilePage() {
  const { gamertag = '' } = useParams()
  const [state, setState] = useState<State>({ status: 'loading' })
  const [stats, setStats] = useState<FollowStats | null>(null)
  const [following, setFollowing] = useState<boolean | null>(null)
  const [followBusy, setFollowBusy] = useState(false)
  const [meUserId, setMeUserId] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setState({ status: 'loading' })
    setStats(null)
    setFollowing(null)

    getPublicProfile(gamertag)
      .then(async (profile) => {
        if (cancelled) return
        setState({ status: 'ok', profile })
        getFollowStats(profile.user_id).then((s) => !cancelled && setStats(s)).catch(() => {})
        const session = await hasSession()
        if (cancelled) return
        if (session) {
          setMeUserId(session.user.id)
          if (session.user.id !== profile.user_id) {
            isFollowing(profile.user_id).then((v) => !cancelled && setFollowing(v)).catch(() => {})
          }
        }
      })
      .catch((error) => {
        if (cancelled) return
        if (error instanceof ApiError && error.status === 404) setState({ status: 'not_found' })
        else setState({ status: 'error' })
      })

    return () => {
      cancelled = true
    }
  }, [gamertag])

  async function handleFollowToggle() {
    if (state.status !== 'ok' || following === null) return
    setFollowBusy(true)
    try {
      if (following) {
        await unfollowUser(state.profile.user_id)
        setFollowing(false)
        setStats((s) => (s ? { ...s, followers: Math.max(0, s.followers - 1) } : s))
      } else {
        await followUser(state.profile.user_id)
        setFollowing(true)
        setStats((s) => (s ? { ...s, followers: s.followers + 1 } : s))
      }
    } finally {
      setFollowBusy(false)
    }
  }

  if (state.status === 'loading') return <p className="p-6 text-sm text-neutral-500">Carregando perfil...</p>
  if (state.status === 'not_found') {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <IconAlertCircleFilled />
          <AlertTitle>Usuário não encontrado</AlertTitle>
          <AlertDescription>Esse perfil não existe ou ainda não definiu uma gamertag.</AlertDescription>
        </Alert>
      </div>
    )
  }
  if (state.status === 'error') {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <IconAlertCircleFilled />
          <AlertTitle>Não foi possível carregar o perfil</AlertTitle>
          <AlertDescription>Tente novamente mais tarde.</AlertDescription>
        </Alert>
      </div>
    )
  }

  const { profile } = state
  const identity = profile.display_name?.trim() || profile.gamertag
  const isOwn = meUserId === profile.user_id

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <Card>
        <CardHeader className="border-b">
          <CardTitle>Perfil</CardTitle>
          <CardDescription>@{profile.gamertag}</CardDescription>
          {!isOwn && following !== null && (
            <CardAction>
              <Button
                variant={following ? 'outline' : 'default'}
                size="sm"
                className="cursor-pointer"
                disabled={followBusy}
                onClick={handleFollowToggle}
              >
                {followBusy ? '...' : following ? 'Deixar de seguir' : 'Seguir'}
              </Button>
            </CardAction>
          )}
        </CardHeader>
        <CardContent className="flex flex-col gap-6 pt-6">
          <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
            <Avatar src={profile.avatar} name={identity} />
            <div className="min-w-0">
              <p className="font-medium">{identity}</p>
              <p className="text-sm text-neutral-500">@{profile.gamertag}</p>
              {stats && (
                <p className="mt-1 text-sm text-neutral-500">
                  {stats.followers} seguidores · {stats.following} seguindo
                </p>
              )}
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <p className="text-xs font-medium text-neutral-500">Bio</p>
            <p className="text-sm whitespace-pre-wrap">
              {profile.bio?.trim() || 'Este usuário ainda não escreveu uma bio.'}
            </p>
          </div>
        </CardContent>
      </Card>
      <PublicProfileTabs gamertag={profile.gamertag} />
    </div>
  )
}
