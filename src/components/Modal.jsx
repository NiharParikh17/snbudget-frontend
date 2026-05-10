import { useEffect, useId, useRef } from 'react'
import { createPortal } from 'react-dom'

/**
 * Modal — accessible dialog primitive.
 *
 * Rendered into a portal at `document.body` so it overlays the page
 * without being clipped by parent `overflow` rules. Pages stay perfectly
 * still when the modal opens; the body scroll is locked while it's
 * mounted.
 *
 * A11y:
 *  - `role="dialog"`, `aria-modal="true"`
 *  - Heading is wired to the dialog via `aria-labelledby` (auto-generated
 *    id; pass `titleId` to override).
 *  - **ESC** closes the dialog (caller can opt-out with
 *    `closeOnEscape={false}`).
 *  - Clicking the backdrop closes (opt-out with `closeOnBackdrop={false}`).
 *  - On open, focus is moved to the dialog container so screen readers
 *    announce the title and keyboard users land inside.
 *
 * Sizing is controlled by `size`: `'sm' | 'md' | 'lg' | 'xl'` (default
 * `'lg'`). Width caps map to Tailwind `max-w-*` so the dialog never
 * stretches edge-to-edge on large viewports.
 *
 * Usage:
 * ```jsx
 * <Modal open={open} onClose={close} title="Change your plan" size="xl">
 *   <PlanGrid />
 *   <ModalActions>...</ModalActions>
 * </Modal>
 * ```
 */
const SIZE_CLASS = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-5xl',
}

function Modal({
  open,
  onClose,
  title,
  titleId: titleIdProp,
  children,
  size = 'lg',
  closeOnEscape = true,
  closeOnBackdrop = true,
  initialFocusRef,
}) {
  const dialogRef = useRef(null)
  const autoTitleId = useId()
  const titleId = titleIdProp ?? `modal-title-${autoTitleId}`

  // ESC-to-close.
  useEffect(() => {
    if (!open || !closeOnEscape) return undefined
    function onKey(e) {
      if (e.key === 'Escape') {
        e.stopPropagation()
        onClose?.()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, closeOnEscape, onClose])

  // Body scroll-lock while open.
  useEffect(() => {
    if (!open) return undefined
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  }, [open])

  // Move focus into the dialog on open.
  useEffect(() => {
    if (!open) return
    const target = initialFocusRef?.current ?? dialogRef.current
    target?.focus({ preventScroll: true })
  }, [open, initialFocusRef])

  if (!open) return null
  if (typeof document === 'undefined') return null

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-start sm:items-center justify-center overflow-y-auto"
      data-testid="modal-root"
    >
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Close dialog"
        tabIndex={-1}
        onClick={() => {
          if (closeOnBackdrop) onClose?.()
        }}
        className="fixed inset-0 bg-slate-900/60 dark:bg-slate-950/70 backdrop-blur-sm cursor-default"
      />
      {/* Dialog */}
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        tabIndex={-1}
        className={`relative my-8 mx-4 w-full ${SIZE_CLASS[size] ?? SIZE_CLASS.lg} rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl focus:outline-none`}
      >
        <div className="flex items-start justify-between gap-4 px-6 pt-6">
          {title ? (
            <h2
              id={titleId}
              className="text-lg font-semibold text-slate-900 dark:text-white"
            >
              {title}
            </h2>
          ) : (
            <span />
          )}
          <button
            type="button"
            onClick={() => onClose?.()}
            aria-label="Close"
            className="-mt-1 -mr-1 rounded-lg p-1.5 text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors"
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="h-5 w-5"
            >
              <path
                fillRule="evenodd"
                d="M4.28 4.22a.75.75 0 011.06 0L10 8.94l4.66-4.72a.75.75 0 111.06 1.06L11.06 10l4.66 4.72a.75.75 0 11-1.06 1.06L10 11.06l-4.66 4.72a.75.75 0 11-1.06-1.06L8.94 10 4.28 5.28a.75.75 0 010-1.06z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>
        <div className="px-6 pb-6 pt-4">{children}</div>
      </div>
    </div>,
    document.body,
  )
}

export default Modal

