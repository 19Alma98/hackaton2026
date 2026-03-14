import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import BottomSheet from '../components/BottomSheet.jsx'

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.runOnlyPendingTimers()
  vi.useRealTimers()
})

// Helper to advance past rAF-based animation frames
function flushAnimationFrames() {
  act(() => vi.advanceTimersByTime(50))
}

describe('BottomSheet — closed state', () => {
  it('renders nothing when open=false', () => {
    const { container } = render(
      <BottomSheet open={false} onClose={() => {}}>
        <p>Hidden content</p>
      </BottomSheet>
    )
    expect(container.firstChild).toBeNull()
  })

  it('does not show children when open=false', () => {
    render(
      <BottomSheet open={false} onClose={() => {}}>
        <p>Secret content</p>
      </BottomSheet>
    )
    expect(screen.queryByText('Secret content')).not.toBeInTheDocument()
  })
})

describe('BottomSheet — open state', () => {
  it('renders children when open=true', () => {
    render(
      <BottomSheet open={true} onClose={() => {}}>
        <p>Visible content</p>
      </BottomSheet>
    )
    flushAnimationFrames()
    expect(screen.getByText('Visible content')).toBeInTheDocument()
  })

  it('renders the drag handle element', () => {
    const { container } = render(
      <BottomSheet open={true} onClose={() => {}}>
        <span>handle test</span>
      </BottomSheet>
    )
    flushAnimationFrames()
    // The handle is a fixed-width bar — look for bg-gray-700 rounded-full
    const handle = container.querySelector('.bg-gray-700.rounded-full')
    expect(handle).not.toBeNull()
  })

  it('renders an overlay element', () => {
    const { container } = render(
      <BottomSheet open={true} onClose={() => {}}>
        <span>overlay test</span>
      </BottomSheet>
    )
    flushAnimationFrames()
    // Overlay has bg-black/60
    const overlay = container.querySelector('.bg-black\\/60')
    expect(overlay).not.toBeNull()
  })
})

describe('BottomSheet — overlay click closes sheet', () => {
  it('calls onClose when overlay is clicked', () => {
    const onClose = vi.fn()
    const { container } = render(
      <BottomSheet open={true} onClose={onClose}>
        <p>content</p>
      </BottomSheet>
    )
    flushAnimationFrames()

    const overlay = container.querySelector('.bg-black\\/60')
    fireEvent.click(overlay)

    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('does NOT call onClose when sheet content is clicked', () => {
    const onClose = vi.fn()
    render(
      <BottomSheet open={true} onClose={onClose}>
        <button>Buy ticket</button>
      </BottomSheet>
    )
    flushAnimationFrames()

    fireEvent.click(screen.getByText('Buy ticket'))
    expect(onClose).not.toHaveBeenCalled()
  })
})

describe('BottomSheet — unmounting after close', () => {
  it('removes DOM content after closing and waiting 300ms', () => {
    const { rerender, container } = render(
      <BottomSheet open={true} onClose={() => {}}>
        <p>Disappearing content</p>
      </BottomSheet>
    )
    flushAnimationFrames()
    expect(screen.getByText('Disappearing content')).toBeInTheDocument()

    rerender(
      <BottomSheet open={false} onClose={() => {}}>
        <p>Disappearing content</p>
      </BottomSheet>
    )

    // Before 300ms timeout, component is still mounted (fade-out animation)
    act(() => vi.advanceTimersByTime(299))
    expect(container.firstChild).not.toBeNull()

    // After 300ms, component unmounts
    act(() => vi.advanceTimersByTime(1))
    expect(container.firstChild).toBeNull()
  })
})

describe('BottomSheet — accessibility & structure', () => {
  it('has fixed inset-0 container for full-screen overlay', () => {
    const { container } = render(
      <BottomSheet open={true} onClose={() => {}}>
        <span>a</span>
      </BottomSheet>
    )
    flushAnimationFrames()
    const root = container.firstChild
    expect(root.className).toContain('fixed')
    expect(root.className).toContain('inset-0')
  })

  it('sheet panel has rounded-t-3xl for bottom-sheet appearance', () => {
    const { container } = render(
      <BottomSheet open={true} onClose={() => {}}>
        <span>b</span>
      </BottomSheet>
    )
    flushAnimationFrames()
    const panel = container.querySelector('.rounded-t-3xl')
    expect(panel).not.toBeNull()
  })
})
