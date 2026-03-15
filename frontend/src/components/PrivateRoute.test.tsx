import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { PrivateRoute } from './PrivateRoute'

vi.mock('@/context/AuthContext', () => ({
  useAuth: vi.fn(),
}))

import { useAuth } from '@/context/AuthContext'

const mockUser = {
  name: 'Alice',
  address: '0xabc1230000000000000000000000000000000001',
  balance_wei: '1000000000000000000',
  balance_eth: 1.0,
  nonce: 0,
  tokens: [],
}

function renderWithRouter(
  currentUser: typeof mockUser | null,
  initialPath = '/protected'
) {
  vi.mocked(useAuth).mockReturnValue({
    currentUser,
    setCurrentUser: vi.fn(),
    refreshCurrentUser: vi.fn(),
    logout: vi.fn(),
  })

  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path="/" element={<div>Home Page</div>} />
        <Route
          path="/protected"
          element={
            <PrivateRoute>
              <div>Protected Content</div>
            </PrivateRoute>
          }
        />
      </Routes>
    </MemoryRouter>
  )
}

describe('PrivateRoute', () => {
  it('renderizza children quando currentUser non è null', () => {
    renderWithRouter(mockUser)
    expect(screen.getByText('Protected Content')).toBeInTheDocument()
  })

  it('non renderizza children quando currentUser è null', () => {
    renderWithRouter(null)
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument()
  })

  it('redirige a "/" quando currentUser è null', () => {
    renderWithRouter(null)
    expect(screen.getByText('Home Page')).toBeInTheDocument()
  })

  it('non redirige se currentUser è valorizzato', () => {
    renderWithRouter(mockUser)
    expect(screen.queryByText('Home Page')).not.toBeInTheDocument()
  })

  it('renderizza qualsiasi tipo di children valido', () => {
    vi.mocked(useAuth).mockReturnValue({
      currentUser: mockUser,
      setCurrentUser: vi.fn(),
      refreshCurrentUser: vi.fn(),
      logout: vi.fn(),
    })

    render(
      <MemoryRouter>
        <PrivateRoute>
          <span>Span Child</span>
          <p>Paragraph Child</p>
        </PrivateRoute>
      </MemoryRouter>
    )

    expect(screen.getByText('Span Child')).toBeInTheDocument()
    expect(screen.getByText('Paragraph Child')).toBeInTheDocument()
  })
})
