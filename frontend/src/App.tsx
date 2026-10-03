import { Outlet } from 'react-router'
import AppNav  from './components/ui/AppNav'

export default function App() {
  return (
    <>
      <AppNav />
      <Outlet />
    </>
  )
}
