import { createBrowserRouter, Navigate, redirect } from 'react-router'
import App from '@/App'
import CadastroPage from '@/pages/CadastroPage'
import ErrorPage from '@/pages/ErrorPage'
import LoginPage from '@/pages/LoginPage'
import Bonfirehub from '@/pages/Bonfirehub'
import Feed from '@/pages/Feed'
import GameDetailsPage from '@/pages/GameDetailsPage'
import NotFoundPage from '@/pages/NotFoundPage'
import PublicProfilePage from '@/pages/PublicProfilePage'
import PerfilPage from '@/pages/settings/PerfilPage'
import SettingsLayout from '@/pages/settings/SettingsLayout'
import ContaPage from '@/pages/settings/ContaPage'
import { getCurrentUser } from '@/features/auth/authApi'
import { requireSession } from '@/features/auth/requireSession'

// Quem já está logado não precisa ver o login: vai direto para o feed.
async function redirectIfAuthenticated() {
  try {
    await getCurrentUser()
    return redirect('/feed')
  } catch {
    return null
  }
}

export const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    errorElement: <ErrorPage />,
    children: [
      { index: true, element: <LoginPage />, loader: redirectIfAuthenticated },
      { path: 'feed', element: <Feed />, loader: requireSession },
      { path: 'login', element: <LoginPage /> },
      { path: 'cadastro', element: <CadastroPage /> },
      { path: 'bonfirehub', element: <Bonfirehub /> },
      { path: 'u/:gamertag', element: <PublicProfilePage /> },
      { path: 'conta', element: <ContaPage /> },
      { path: 'jogos/:id', element: <GameDetailsPage /> },
      {
        path: 'settings',
        element: <SettingsLayout />,
        loader: requireSession,
        children: [
          { index: true, element: <Navigate to="perfil" replace /> },
          { path: 'perfil', element: <PerfilPage /> },
          { path: 'conta', element: <ContaPage /> },
        ],
      },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
])