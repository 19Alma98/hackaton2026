import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { AuthProvider } from '@/context/AuthContext'
import { SelectIdentityPage } from '@/pages/SelectIdentityPage'
import { DashboardPage } from '@/pages/DashboardPage'
import { TokenHistoryPage } from '@/pages/TokenHistoryPage'
import { SalesHistoryPage } from '@/pages/SalesHistoryPage'
import { NotFoundPage } from '@/pages/NotFoundPage'
import { PrivateRoute } from '@/components/PrivateRoute'

const router = createBrowserRouter([
  { path: '/', element: <SelectIdentityPage /> },
  { path: '/history', element: <SalesHistoryPage /> },
  { path: '/dashboard', element: <PrivateRoute><DashboardPage /></PrivateRoute> },
  { path: '/token/:tokenId', element: <PrivateRoute><TokenHistoryPage /></PrivateRoute> },
  { path: '*', element: <NotFoundPage /> },
])

export function App() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  )
}
