import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Modal from './Modal.jsx'

describe('Modal', () => {
  it('renders nothing when open=false', () => {
    render(
      <Modal open={false} onClose={() => {}} title="Hi">
        <p>body</p>
      </Modal>,
    )
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('renders a dialog with the title and body when open=true', () => {
    render(
      <Modal open onClose={() => {}} title="Pick a plan">
        <p>body content</p>
      </Modal>,
    )
    const dialog = screen.getByRole('dialog')
    expect(dialog).toHaveAttribute('aria-modal', 'true')
    expect(
      screen.getByRole('heading', { name: /pick a plan/i }),
    ).toBeInTheDocument()
    expect(screen.getByText('body content')).toBeInTheDocument()
  })

  it('calls onClose when the close button is clicked', async () => {
    const onClose = vi.fn()
    render(
      <Modal open onClose={onClose} title="Hi">
        x
      </Modal>,
    )
    await userEvent.click(screen.getByRole('button', { name: /^close$/i }))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('calls onClose when ESC is pressed', () => {
    const onClose = vi.fn()
    render(
      <Modal open onClose={onClose} title="Hi">
        x
      </Modal>,
    )
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('does not close on ESC when closeOnEscape=false', () => {
    const onClose = vi.fn()
    render(
      <Modal open onClose={onClose} title="Hi" closeOnEscape={false}>
        x
      </Modal>,
    )
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onClose).not.toHaveBeenCalled()
  })

  it('calls onClose when the backdrop is clicked', async () => {
    const onClose = vi.fn()
    render(
      <Modal open onClose={onClose} title="Hi">
        x
      </Modal>,
    )
    await userEvent.click(
      screen.getByRole('button', { name: /close dialog/i }),
    )
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('locks body scroll while open and restores on close', () => {
    const { rerender, unmount } = render(
      <Modal open onClose={() => {}} title="Hi">
        x
      </Modal>,
    )
    expect(document.body.style.overflow).toBe('hidden')
    rerender(
      <Modal open={false} onClose={() => {}} title="Hi">
        x
      </Modal>,
    )
    expect(document.body.style.overflow).toBe('')
    unmount()
  })
})

