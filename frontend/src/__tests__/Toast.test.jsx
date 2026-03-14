import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import Toast from '../components/Toast.jsx'

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.runOnlyPendingTimers()
  vi.useRealTimers()
})

describe('Toast — rendering', () => {
  it('renders the message text', () => {
    render(<Toast message="Acquisto completato" type="success" onDone={() => {}} />)
    expect(screen.getByText('Acquisto completato')).toBeInTheDocument()
  })

  it('renders with type="error" without crashing', () => {
    render(<Toast message="Errore di rete" type="error" onDone={() => {}} />)
    expect(screen.getByText('Errore di rete')).toBeInTheDocument()
  })

  it('renders with default type (success) when type prop is omitted', () => {
    render(<Toast message="Fatto!" onDone={() => {}} />)
    expect(screen.getByText('Fatto!')).toBeInTheDocument()
  })

  it('renders an SVG icon', () => {
    const { container } = render(<Toast message="ok" type="success" onDone={() => {}} />)
    expect(container.querySelector('svg')).not.toBeNull()
  })
})

describe('Toast — success type visual class', () => {
  it('applies emerald color classes for success type', () => {
    const { container } = render(<Toast message="ok" type="success" onDone={() => {}} />)
    const wrapper = container.firstChild
    expect(wrapper.className).toContain('emerald')
  })

  it('applies rose color classes for error type', () => {
    const { container } = render(<Toast message="fail" type="error" onDone={() => {}} />)
    const wrapper = container.firstChild
    expect(wrapper.className).toContain('rose')
  })
})

describe('Toast — auto-dismiss behaviour', () => {
  it('calls onDone after the dismiss timer elapses', () => {
    const onDone = vi.fn()
    render(<Toast message="bye" type="success" onDone={onDone} />)

    // onDone is called after 3000ms (auto-hide) + 300ms (fade-out)
    act(() => vi.advanceTimersByTime(3300))
    expect(onDone).toHaveBeenCalledTimes(1)
  })

  it('does NOT call onDone before the 3-second timeout', () => {
    const onDone = vi.fn()
    render(<Toast message="still here" type="success" onDone={onDone} />)

    act(() => vi.advanceTimersByTime(2999))
    expect(onDone).not.toHaveBeenCalled()
  })

  it('cleans up the timer when unmounted before timeout', () => {
    const onDone = vi.fn()
    const { unmount } = render(<Toast message="gone" type="success" onDone={onDone} />)

    act(() => vi.advanceTimersByTime(1000))
    unmount()
    act(() => vi.advanceTimersByTime(5000))

    expect(onDone).not.toHaveBeenCalled()
  })
})

describe('Toast — positioning', () => {
  it('is fixed positioned at the top of the viewport', () => {
    const { container } = render(<Toast message="pos" type="success" onDone={() => {}} />)
    const wrapper = container.firstChild
    expect(wrapper.className).toContain('fixed')
    expect(wrapper.className).toContain('top-4')
  })

  it('has a high z-index for stacking above other elements', () => {
    const { container } = render(<Toast message="z" type="success" onDone={() => {}} />)
    const wrapper = container.firstChild
    expect(wrapper.className).toContain('z-[100]')
  })
})
