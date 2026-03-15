import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { BottomSheet } from './BottomSheet'

describe('BottomSheet', () => {
  it('non renderizza nulla quando isOpen è false', () => {
    const { container } = render(
      <BottomSheet isOpen={false} onClose={vi.fn()}>
        <p>Content</p>
      </BottomSheet>
    )
    expect(container.firstChild).toBeNull()
  })

  it('renderizza children quando isOpen è true', () => {
    render(
      <BottomSheet isOpen={true} onClose={vi.fn()}>
        <p>Hello World</p>
      </BottomSheet>
    )
    expect(screen.getByText('Hello World')).toBeInTheDocument()
  })

  it('mostra il titolo quando fornito', () => {
    render(
      <BottomSheet isOpen={true} onClose={vi.fn()} title="My Title">
        <p>Content</p>
      </BottomSheet>
    )
    expect(screen.getByText('My Title')).toBeInTheDocument()
  })

  it('click sull overlay chiama onClose', () => {
    const onClose = vi.fn()
    render(
      <BottomSheet isOpen={true} onClose={onClose}>
        <p>Content</p>
      </BottomSheet>
    )
    const overlay = document.querySelector('.bg-black\\/60')
    expect(overlay).toBeTruthy()
    fireEvent.click(overlay!)
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('tasto Escape chiama onClose', () => {
    const onClose = vi.fn()
    render(
      <BottomSheet isOpen={true} onClose={onClose}>
        <p>Content</p>
      </BottomSheet>
    )
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('il pannello ha classe glass-card', () => {
    render(
      <BottomSheet isOpen={true} onClose={vi.fn()}>
        <p>Content</p>
      </BottomSheet>
    )
    const panel = document.querySelector('.glass-card')
    expect(panel).toBeTruthy()
  })
})
