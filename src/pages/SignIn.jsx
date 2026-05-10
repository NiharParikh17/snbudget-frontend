import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import AuthFormShell from '../components/AuthFormShell.jsx'
import Button from '../components/Button.jsx'
import FormField from '../components/FormField.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { ApiError } from '../lib/apiClient.js'

function SignIn() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const params = new URLSearchParams(location.search)
  const justRegistered = params.get('registered') === '1'

  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  const [formError, setFormError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setFieldErrors({})
    setFormError(null)

    const errors = {}
    if (!identifier.trim()) errors.identifier = 'Enter your email or username.'
    if (!password) errors.password = 'Enter your password.'
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      return
    }

    setSubmitting(true)
    try {
      await login({ identifier: identifier.trim(), password })
      const from = location.state?.from?.pathname || '/app/dashboard'
      navigate(from, { replace: true })
    } catch (err) {
      if (err instanceof ApiError) {
        setFieldErrors(err.fieldErrors || {})
        setFormError(err.message)
      } else {
        setFormError('Something went wrong. Please try again.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthFormShell
      title="Sign in"
      subtitle="Welcome back to SNBudget."
      footer={
        <>
          New here?{' '}
          <Link
            to="/signup"
            className="text-violet-600 dark:text-violet-400 font-medium hover:underline"
          >
            Create an account
          </Link>
        </>
      }
    >
      {justRegistered ? (
        <div
          role="status"
          className="mb-5 rounded-xl border border-violet-200 dark:border-violet-800 bg-violet-50 dark:bg-violet-900/30 px-4 py-3 text-sm text-violet-800 dark:text-violet-200"
        >
          Account created. Check your email for a verification link, then sign
          in below.
        </div>
      ) : null}

      {formError ? (
        <div
          role="alert"
          className="mb-5 rounded-xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/40 px-4 py-3 text-sm text-red-700 dark:text-red-300"
        >
          {formError}
        </div>
      ) : null}

      <form noValidate onSubmit={handleSubmit} className="space-y-4">
        <FormField
          label="Email or username"
          name="identifier"
          autoComplete="username"
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          error={fieldErrors.identifier}
          required
        />
        <FormField
          label="Password"
          name="password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={fieldErrors.password}
          required
        />

        <Button type="submit" disabled={submitting} className="w-full">
          {submitting ? 'Signing in…' : 'Sign in'}
        </Button>
      </form>
    </AuthFormShell>
  )
}

export default SignIn

