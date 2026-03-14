import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import WrongNetworkBanner from '../components/WrongNetworkBanner.jsx'

describe('WrongNetworkBanner — rendering', () => {
  it('renders the wrong network message', () => {
    render(<WrongNetworkBanner />)
    expect(screen.getByText(/Rete non corretta/i)).toBeInTheDocument()
  })

  it('renders the "Cambia rete" button', () => {
    render(<WrongNetworkBanner />)
    expect(screen.getByRole('button', { name: /Cambia rete/i })).toBeInTheDocument()
  })

  it('button is enabled by default', () => {
    render(<WrongNetworkBanner />)
    expect(screen.getByRole('button')).not.toBeDisabled()
  })

  it('renders a warning SVG icon', () => {
    const { container } = render(<WrongNetworkBanner />)
    expect(container.querySelector('svg')).not.toBeNull()
  })

  it('has amber background styling', () => {
    const { container } = render(<WrongNetworkBanner />)
    expect(container.firstChild.className).toContain('amber')
  })
})

describe('WrongNetworkBanner — handleSwitch with no window.ethereum', () => {
  beforeEach(() => {
    // Ensure no ethereum provider is injected
    Object.defineProperty(window, 'ethereum', {
      value: undefined,
      writable: true,
      configurable: true,
    })
  })

  it('does not throw when button is clicked and window.ethereum is absent', async () => {
    render(<WrongNetworkBanner />)
    await expect(
      act(async () => {
        fireEvent.click(screen.getByRole('button'))
      })
    ).resolves.not.toThrow()
  })

  it('button label stays "Cambia rete" after click without ethereum', async () => {
    render(<WrongNetworkBanner />)
    await act(async () => {
      fireEvent.click(screen.getByRole('button'))
    })
    expect(screen.getByRole('button')).toHaveTextContent('Cambia rete')
  })
})

describe('WrongNetworkBanner — handleSwitch with mock ethereum (successful switch)', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'ethereum', {
      value: {
        request: vi.fn().mockResolvedValue(null),
      },
      writable: true,
      configurable: true,
    })
  })

  afterEach(() => {
    Object.defineProperty(window, 'ethereum', {
      value: undefined,
      writable: true,
      configurable: true,
    })
  })

  it('calls wallet_switchEthereumChain when button is clicked', async () => {
    render(<WrongNetworkBanner />)
    await act(async () => {
      fireEvent.click(screen.getByRole('button'))
    })
    expect(window.ethereum.request).toHaveBeenCalledWith(
      expect.objectContaining({ method: 'wallet_switchEthereumChain' })
    )
  })

  it('button is re-enabled after successful switch', async () => {
    render(<WrongNetworkBanner />)
    await act(async () => {
      fireEvent.click(screen.getByRole('button'))
    })
    expect(screen.getByRole('button')).not.toBeDisabled()
    expect(screen.getByRole('button')).toHaveTextContent('Cambia rete')
  })
})

describe('WrongNetworkBanner — handleSwitch with mock ethereum (error 4902 — chain not added)', () => {
  beforeEach(() => {
    const switchError = Object.assign(new Error('chain not found'), { code: 4902 })
    Object.defineProperty(window, 'ethereum', {
      value: {
        request: vi.fn()
          .mockRejectedValueOnce(switchError)  // wallet_switchEthereumChain fails
          .mockResolvedValueOnce(null),          // wallet_addEthereumChain succeeds
      },
      writable: true,
      configurable: true,
    })
  })

  afterEach(() => {
    Object.defineProperty(window, 'ethereum', {
      value: undefined,
      writable: true,
      configurable: true,
    })
  })

  it('calls wallet_addEthereumChain when switch returns error 4902', async () => {
    render(<WrongNetworkBanner />)
    await act(async () => {
      fireEvent.click(screen.getByRole('button'))
    })
    expect(window.ethereum.request).toHaveBeenCalledTimes(2)
    expect(window.ethereum.request).toHaveBeenLastCalledWith(
      expect.objectContaining({ method: 'wallet_addEthereumChain' })
    )
  })

  it('button is re-enabled after add chain flow completes', async () => {
    render(<WrongNetworkBanner />)
    await act(async () => {
      fireEvent.click(screen.getByRole('button'))
    })
    expect(screen.getByRole('button')).not.toBeDisabled()
  })
})
