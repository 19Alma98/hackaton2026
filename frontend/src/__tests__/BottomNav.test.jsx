import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import BottomNav from '../components/BottomNav.jsx'

function renderWithRouter(initialEntries = ['/home']) {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <BottomNav />
    </MemoryRouter>
  )
}

describe('BottomNav — rendering', () => {
  it('renders without crashing', () => {
    expect(() => renderWithRouter()).not.toThrow()
  })

  it('renders all three navigation labels', () => {
    renderWithRouter()
    expect(screen.getByText('Scopri')).toBeInTheDocument()
    expect(screen.getByText('Biglietti')).toBeInTheDocument()
    expect(screen.getByText('Profilo')).toBeInTheDocument()
  })

  it('renders exactly three nav links', () => {
    renderWithRouter()
    const links = screen.getAllByRole('link')
    expect(links).toHaveLength(3)
  })

  it('nav links point to correct routes', () => {
    renderWithRouter()
    const links = screen.getAllByRole('link')
    const hrefs = links.map(l => l.getAttribute('href'))
    expect(hrefs).toContain('/home')
    expect(hrefs).toContain('/tickets')
    expect(hrefs).toContain('/profile')
  })

  it('renders SVG icons for each tab', () => {
    const { container } = renderWithRouter()
    const svgs = container.querySelectorAll('svg')
    expect(svgs.length).toBe(3)
  })

  it('is fixed at the bottom of the viewport', () => {
    const { container } = renderWithRouter()
    const nav = container.querySelector('nav')
    expect(nav.className).toContain('fixed')
    expect(nav.className).toContain('bottom-0')
  })
})

describe('BottomNav — active state', () => {
  it('applies violet color class to the active link', () => {
    renderWithRouter(['/home'])
    const homeLink = screen.getByRole('link', { name: /Scopri/i })
    expect(homeLink.className).toContain('violet')
  })

  it('applies gray color class to inactive links', () => {
    renderWithRouter(['/home'])
    const ticketsLink = screen.getByRole('link', { name: /Biglietti/i })
    expect(ticketsLink.className).toContain('gray')
  })

  it('highlights Biglietti when on /tickets route', () => {
    renderWithRouter(['/tickets'])
    const ticketsLink = screen.getByRole('link', { name: /Biglietti/i })
    expect(ticketsLink.className).toContain('violet')
  })
})
