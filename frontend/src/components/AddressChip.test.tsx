import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { AddressChip } from './AddressChip'

describe('AddressChip', () => {
  const address = '0xabcdef1234567890abcdef1234567890abcdef12'

  beforeEach(() => {
    Object.assign(navigator, {
      clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
    })
  })

  it('mostra indirizzo troncato in formato font-mono', () => {
    render(<AddressChip address={address} />)
    expect(screen.getByText('0xabcd...ef12')).toBeInTheDocument()
  })

  it('click sul pulsante copia chiama clipboard.writeText con indirizzo completo', async () => {
    render(<AddressChip address={address} />)
    const btn = screen.getByRole('button')
    fireEvent.click(btn)
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(address)
  })

  it('mostra feedback "Copiato!" dopo click', async () => {
    render(<AddressChip address={address} />)
    const btn = screen.getByRole('button')
    fireEvent.click(btn)
    await waitFor(() => expect(screen.getByText('Copiato!')).toBeInTheDocument())
  })

  it('gestisce errore clipboard senza crash', async () => {
    Object.assign(navigator, {
      clipboard: { writeText: vi.fn().mockRejectedValue(new Error('denied')) },
    })
    render(<AddressChip address={address} />)
    const btn = screen.getByRole('button')
    expect(() => fireEvent.click(btn)).not.toThrow()
  })

  it('ha un elemento button accessibile', () => {
    render(<AddressChip address={address} />)
    expect(screen.getByRole('button')).toBeInTheDocument()
  })
})
