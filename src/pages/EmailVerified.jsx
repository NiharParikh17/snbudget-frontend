import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import AuthFormShell from '../components/AuthFormShell.jsx'
import Button from '../components/Button.jsx'

const REDIRECT_SECONDS = 10

/**
 * EmailVerified — public landing page the backend redirects to after a user
 * clicks the verification link in their welcome email. The backend has already
 * done the work; this page only reads `?status` from the URL and renders the
 * appropriate confirmation.
 *
 * Anything other than `?status=success` is treated as the invalid state
 * (defensive default — we never expose backend failure detail to the user).
 *
 * On success, we auto-redirect to `/signin` after 10 s with a visible
 * countdown; the CTA is always available as a manual fallback.
 */
function EmailVerified() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const isSuccess = searchParams.get('status') === 'success'
  const [secondsLeft, setSecondsLeft] = useState(REDIRECT_SECONDS)

  useEffect(() => {
    if (!isSuccess) return undefined

    const id = setInterval(() => {
      setSecondsLeft((prev) => (prev > 0 ? prev - 1 : 0))
    }, 1000)

    return () => clearInterval(id)
  }, [isSuccess])

  useEffect(() => {
    if (isSuccess && secondsLeft === 0) {
      navigate('/signin', { replace: true })
    }
  }, [isSuccess, secondsLeft, navigate])

  if (isSuccess) {
    return (
      <AuthFormShell
        title="Email verified!"
        subtitle="Your email address has been confirmed. You can now sign in."
      >
        <p role="status" className="text-sm text-slate-600 dark:text-slate-300 text-center">
          Redirecting you to sign in in{' '}
          <span className="font-semibold text-slate-900 dark:text-white">
            {secondsLeft}
          </span>{' '}
          {secondsLeft === 1 ? 'second' : 'seconds'}…
        </p>

        <div className="mt-6 flex justify-center">
          <Button as={Link} to="/signin" className="w-full sm:w-auto">
            Go to sign in now
          </Button>
        </div>
      </AuthFormShell>
    )
  }

  return (
    <AuthFormShell
      title="Link is no longer valid"
      subtitle="This verification link has expired or has already been used."
    >
      <div
        role="alert"
        className="mb-5 rounded-xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/40 px-4 py-3 text-sm text-red-700 dark:text-red-300"
      >
        We couldn&apos;t verify your email with this link. Please sign in to
        request a new verification email.
      </div>

      <div className="flex justify-center">
        <Button as={Link} to="/signin" className="w-full sm:w-auto">
          Go to sign in
        </Button>
      </div>
    </AuthFormShell>
  )
}

export default EmailVerified


