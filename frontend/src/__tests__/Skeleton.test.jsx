import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Skeleton, EventCardSkeleton, TicketCardSkeleton } from '../components/Skeleton.jsx'

describe('Skeleton base component', () => {
  it('renders a div with animate-pulse class', () => {
    const { container } = render(<Skeleton />)
    expect(container.firstChild.className).toContain('animate-pulse')
  })

  it('applies extra className via prop', () => {
    const { container } = render(<Skeleton className="w-12 h-12" />)
    expect(container.firstChild.className).toContain('w-12')
    expect(container.firstChild.className).toContain('h-12')
  })

  it('defaults to empty className without crashing', () => {
    expect(() => render(<Skeleton />)).not.toThrow()
  })
})

describe('EventCardSkeleton', () => {
  it('renders without crashing', () => {
    expect(() => render(<EventCardSkeleton />)).not.toThrow()
  })

  it('renders multiple skeleton blocks for the card layout', () => {
    const { container } = render(<EventCardSkeleton />)
    const pulseElements = container.querySelectorAll('.animate-pulse')
    expect(pulseElements.length).toBeGreaterThanOrEqual(4)
  })

  it('has a rounded-2xl wrapper', () => {
    const { container } = render(<EventCardSkeleton />)
    expect(container.firstChild.className).toContain('rounded-2xl')
  })
})

describe('TicketCardSkeleton', () => {
  it('renders without crashing', () => {
    expect(() => render(<TicketCardSkeleton />)).not.toThrow()
  })

  it('renders multiple skeleton blocks for the card layout', () => {
    const { container } = render(<TicketCardSkeleton />)
    const pulseElements = container.querySelectorAll('.animate-pulse')
    expect(pulseElements.length).toBeGreaterThanOrEqual(3)
  })

  it('has overflow-hidden for the card frame', () => {
    const { container } = render(<TicketCardSkeleton />)
    expect(container.firstChild.className).toContain('overflow-hidden')
  })
})
