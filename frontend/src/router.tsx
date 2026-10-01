import { createBrowserRouter } from 'react-router'
import App from '@/App'
import ErrorPage from '@/pages/ErrorPage'
import HomePage from '@/pages/HomePage'
import Bonfirehub from '@/pages/Bonfirehub'
import NotFoundPage from '@/pages/NotFoundPage'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    errorElement: <ErrorPage />,
    children: [
      { index: true, element: <HomePage /> },
      {path: 'bonfirehub', element: <Bonfirehub />},
      { path: '*', element: <NotFoundPage /> },
    ],
  },
])
