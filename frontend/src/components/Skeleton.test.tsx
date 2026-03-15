import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { Skeleton } from './Skeleton'

describe('Skeleton', () => {
  it('renderizza un div con classe animate-pulse', () => {
    const { container } = render(<Skeleton />)
    const div = container.firstChild as HTMLElement
    expect(div).toHaveClass('animate-pulse')
  })

  it('renderizza un div con classe bg-white/10', () => {
    const { container } = render(<Skeleton />)
    const div = container.firstChild as HTMLElement
    expect(div.className).toContain('bg-white/10')
  })

  it('applica className aggiuntivo passato come prop', () => {
    const { container } = render(<Skeleton className="h-20 w-full" />)
    const div = container.firstChild as HTMLElement
    expect(div).toHaveClass('h-20')
    expect(div).toHaveClass('w-full')
  })

  it('combina correttamente le classi base e la className prop', () => {
    const { container } = render(<Skeleton className="h-20" />)
    const div = container.firstChild as HTMLElement
    expect(div).toHaveClass('animate-pulse')
    expect(div).toHaveClass('h-20')
  })

  it('non ha testo visibile se non passato contenuto', () => {
    const { container } = render(<Skeleton />)
    const div = container.firstChild as HTMLElement
    expect(div.textContent).toBe('')
  })

  it('renderizza senza className senza errori', () => {
    const { container } = render(<Skeleton />)
    expect(container.firstChild).toBeTruthy()
  })
})
