import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'

interface PrivateRouteProps {
  readonly children: ReactNode
}

export function PrivateRoute({ children }: PrivateRouteProps) {
  const { currentUser } = useAuth()

  if (currentUser === null) {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}
