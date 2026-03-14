import { useLocation, Outlet } from 'react-router-dom'
import { useWeb3 } from '../hooks/useWeb3'
import BottomNav from '../components/BottomNav'
import WrongNetworkBanner from '../components/WrongNetworkBanner'

export default function AppLayout() {
  const { isWrongNetwork } = useWeb3()
  const location = useLocation()

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {isWrongNetwork && <WrongNetworkBanner />}
      <main key={location.pathname} className="max-w-lg mx-auto pb-20 page-fade">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  )
}
