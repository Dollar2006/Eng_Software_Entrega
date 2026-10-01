import { createBrowserRouter } from 'react-router'
import App from '@/App'
import CadastroPage from '@/pages/CadastroPage'
import ErrorPage from '@/pages/ErrorPage'
import HomePage from '@/pages/HomePage'
import LoginPage from '@/pages/LoginPage'
import Bonfirehub from '@/pages/Bonfirehub'
import GameDetailsPage from '@/pages/GameDetailsPage'
import NotFoundPage from '@/pages/NotFoundPage'

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
      {path: 'jogos/:id', element: <GameDetailsPage />},
      { path: '*', element: <NotFoundPage /> },
    ],
  },
])
