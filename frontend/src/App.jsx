import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useWeb3 } from './hooks/useWeb3'
import AppLayout from './layouts/AppLayout'
import ConnectPage from './pages/ConnectPage'
import HomePage from './pages/HomePage'
import MyTicketsPage from './pages/MyTicketsPage'
import ProfilePage from './pages/ProfilePage'
import EventPage from './pages/EventPage'
import TicketDetailPage from './pages/TicketDetailPage'

export default function App() {
  const { isConnected } = useWeb3()

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={isConnected ? <Navigate to="/home" replace /> : <ConnectPage />}
        />

        <Route element={isConnected ? <AppLayout /> : <Navigate to="/" replace />}>
          <Route path="/home" element={<HomePage />} />
          <Route path="/event/:id" element={<EventPage />} />
          <Route path="/tickets" element={<MyTicketsPage />} />
          <Route path="/ticket/:tokenId" element={<TicketDetailPage />} />
          <Route path="/profile" element={<ProfilePage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
