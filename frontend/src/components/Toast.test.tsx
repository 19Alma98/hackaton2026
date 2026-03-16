import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Toast } from './Toast'

describe('Toast', () => {
  it('non renderizza quando visible è false', () => {
    const { container } = render(
      <Toast message="Test" type="success" visible={false} onDismiss={vi.fn()} />
    )
    expect(container.firstChild).toBeNull()
  })

  it('mostra il messaggio quando visible è true', () => {
    render(
      <Toast message="Acquisto completato!" type="success" visible={true} onDismiss={vi.fn()} />
    )
    expect(screen.getByText('Acquisto completato!')).toBeInTheDocument()
  })

  it('success applica classe text-emerald-400', () => {
    const { container } = render(
      <Toast message="Ok" type="success" visible={true} onDismiss={vi.fn()} />
    )
    const el = container.firstChild as HTMLElement
    expect(el.className).toContain('text-emerald-400')
  })

  it('error applica classe text-rose-400', () => {
    const { container } = render(
      <Toast message="Errore" type="error" visible={true} onDismiss={vi.fn()} />
    )
    const el = container.firstChild as HTMLElement
    expect(el.className).toContain('text-rose-400')
  })

  it('click chiama onDismiss', () => {
    const onDismiss = vi.fn()
    render(
      <Toast message="Messaggio" type="success" visible={true} onDismiss={onDismiss} />
    )
    fireEvent.click(screen.getByText('Messaggio'))
    expect(onDismiss).toHaveBeenCalledTimes(1)
  })
})
