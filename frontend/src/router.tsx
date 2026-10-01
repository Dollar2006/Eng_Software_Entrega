import { createBrowserRouter } from 'react-router'
import App from '@/App'
import CadastroPage from '@/pages/CadastroPage'
import ErrorPage from '@/pages/ErrorPage'
import HomePage from '@/pages/HomePage'
import LoginPage from '@/pages/LoginPage'
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
      { path: '*', element: <NotFoundPage /> },
    ],
  },
])
