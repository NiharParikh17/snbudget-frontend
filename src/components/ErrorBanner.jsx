import Button from './Button.jsx'

/**
 * ErrorBanner — shared inline error surface with optional retry. Used by
 * authenticated pages whose cards each have their own retryable load
 * (Settings, Groups, …). Renders `role="alert"` so screen readers
 * announce the failure as soon as it appears.
 */
function ErrorBanner({ children, onRetry }) {
  return (
    <div
      role="alert"
      className="rounded-xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/40 px-4 py-3 text-sm text-red-700 dark:text-red-300 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
    >
      <span>{children}</span>
      {onRetry ? (
        <Button type="button" variant="secondary" onClick={onRetry}>
          Try again
        </Button>
      ) : null}
    </div>
  )
}

export default ErrorBanner

