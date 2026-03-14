import { useLocation, Outlet } from 'react-router-dom'
import BottomNav from '../components/BottomNav'

export default function AppLayout() {
  const location = useLocation()

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <main key={location.pathname} className="max-w-lg mx-auto pb-20 page-fade">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  )
}
