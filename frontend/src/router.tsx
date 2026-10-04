import { createBrowserRouter, Navigate } from 'react-router'
import App from '@/App'
import CadastroPage from '@/pages/CadastroPage'
import ErrorPage from '@/pages/ErrorPage'
import HomePage from '@/pages/HomePage'
import LoginPage from '@/pages/LoginPage'
import Bonfirehub from '@/pages/Bonfirehub'
import GameDetailsPage from '@/pages/GameDetailsPage'
import NotFoundPage from '@/pages/NotFoundPage'
import PerfilPage from '@/pages/settings/PerfilPage'
import SettingsLayout from '@/pages/settings/SettingsLayout'
import ContaPage from '@/pages/settings/ContaPage'
import { requireSession } from '@/features/auth/requireSession'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    errorElement: <ErrorPage />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'login', element: <LoginPage /> },
      { path: 'cadastro', element: <CadastroPage /> },
      {path: 'bonfirehub', element: <Bonfirehub />},
      { path: 'conta', element: <ContaPage /> },
      {path: 'jogos/:id', element: <GameDetailsPage />},
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
