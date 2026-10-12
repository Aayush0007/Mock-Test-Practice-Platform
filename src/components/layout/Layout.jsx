import { Outlet } from 'react-router-dom'
import Header from './Header'
import ToastContainer from './ToastContainer'

export default function Layout() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <ToastContainer />
    </div>
  )
}
