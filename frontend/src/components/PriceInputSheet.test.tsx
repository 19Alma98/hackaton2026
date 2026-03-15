import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { PriceInputSheet } from './PriceInputSheet'

describe('PriceInputSheet', () => {
  it('mostra "Metti in vendita #42" con tokenId corretto', () => {
    render(<PriceInputSheet tokenId={42} onConfirm={vi.fn()} onCancel={vi.fn()} />)
    expect(screen.getByText(/Metti in vendita #42/)).toBeInTheDocument()
  })

  it('click Annulla chiama onCancel', () => {
    const onCancel = vi.fn()
    render(<PriceInputSheet tokenId={42} onConfirm={vi.fn()} onCancel={onCancel} />)
    fireEvent.click(screen.getByRole('button', { name: /Annulla/i }))
    expect(onCancel).toHaveBeenCalledTimes(1)
  })

  it('pulsante Conferma disabilitato quando input è vuoto', () => {
    render(<PriceInputSheet tokenId={42} onConfirm={vi.fn()} onCancel={vi.fn()} />)
    expect(screen.getByRole('button', { name: /Conferma/i })).toBeDisabled()
  })

  it('pulsante Conferma disabilitato quando input è 0', () => {
    render(<PriceInputSheet tokenId={42} onConfirm={vi.fn()} onCancel={vi.fn()} />)
    fireEvent.change(screen.getByRole('spinbutton'), { target: { value: '0' } })
    expect(screen.getByRole('button', { name: /Conferma/i })).toBeDisabled()
  })

  it('con input valido "0.5", Conferma è abilitato', () => {
    render(<PriceInputSheet tokenId={42} onConfirm={vi.fn()} onCancel={vi.fn()} />)
    fireEvent.change(screen.getByRole('spinbutton'), { target: { value: '0.5' } })
    expect(screen.getByRole('button', { name: /Conferma/i })).not.toBeDisabled()
  })

  it('click Conferma con "1.0" chiama onConfirm con "1000000000000000000"', () => {
    const onConfirm = vi.fn()
    render(<PriceInputSheet tokenId={42} onConfirm={onConfirm} onCancel={vi.fn()} />)
    fireEvent.change(screen.getByRole('spinbutton'), { target: { value: '1.0' } })
    fireEvent.click(screen.getByRole('button', { name: /Conferma/i }))
    expect(onConfirm).toHaveBeenCalledWith('1000000000000000000')
  })

  it('gestisce input non numerico senza crash', () => {
    render(<PriceInputSheet tokenId={42} onConfirm={vi.fn()} onCancel={vi.fn()} />)
    expect(() => {
      fireEvent.change(screen.getByRole('spinbutton'), { target: { value: 'abc' } })
    }).not.toThrow()
    expect(screen.getByRole('button', { name: /Conferma/i })).toBeDisabled()
  })
})
