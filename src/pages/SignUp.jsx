import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import AuthFormShell from '../components/AuthFormShell.jsx'
import Button from '../components/Button.jsx'
import FormField from '../components/FormField.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { ApiError } from '../lib/apiClient.js'

const PASSWORD_MIN = 8

function SignUp() {
  const { register } = useAuth()
  const navigate = useNavigate()

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    username: '',
    password: '',
    phone: '',
    profilePictureUrl: '',
  })
  const [acceptedTerms, setAcceptedTerms] = useState(false)
  const [fieldErrors, setFieldErrors] = useState({})
  const [formError, setFormError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  function update(name) {
    return (e) => setForm((prev) => ({ ...prev, [name]: e.target.value }))
  }

  function validate() {
    const errors = {}
    if (!form.firstName.trim()) errors.firstName = 'First name is required.'
    if (!form.lastName.trim()) errors.lastName = 'Last name is required.'
    if (!form.email.trim()) {
      errors.email = 'Email is required.'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      errors.email = 'Enter a valid email address.'
    }
    if (!form.username.trim()) errors.username = 'Username is required.'
    if (!form.password) {
      errors.password = 'Password is required.'
    } else if (form.password.length < PASSWORD_MIN) {
      errors.password = `Password must be at least ${PASSWORD_MIN} characters.`
    }
    if (!acceptedTerms) {
      errors.terms = 'You must confirm you are at least 16 and accept the Terms.'
    }
    return errors
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setFieldErrors({})
    setFormError(null)

    const errors = validate()
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      return
    }

    const payload = {
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      email: form.email.trim(),
      username: form.username.trim(),
      password: form.password,
    }
    if (form.phone.trim()) payload.phone = form.phone.trim()
    if (form.profilePictureUrl.trim())
      payload.profilePictureUrl = form.profilePictureUrl.trim()

    setSubmitting(true)
    try {
      await register(payload)
      // Per product decision: do NOT auto-login. The user must verify
      // their email address (via the email the backend sends) before
      // they can sign in. Redirect to /signin with a success banner.
      navigate('/signin?registered=1', { replace: true })
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
      title="Create your account"
      subtitle="Start budgeting smarter — and splitting easier."
      footer={
        <>
          Already have an account?{' '}
          <Link
            to="/signin"
            className="text-violet-600 dark:text-violet-400 font-medium hover:underline"
          >
            Sign in
          </Link>
        </>
      }
    >
      {formError ? (
        <div
          role="alert"
          className="mb-5 rounded-xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/40 px-4 py-3 text-sm text-red-700 dark:text-red-300"
        >
          {formError}
        </div>
      ) : null}

      <form noValidate onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField
            label="First name"
            name="firstName"
            autoComplete="given-name"
            value={form.firstName}
            onChange={update('firstName')}
            error={fieldErrors.firstName}
            required
          />
          <FormField
            label="Last name"
            name="lastName"
            autoComplete="family-name"
            value={form.lastName}
            onChange={update('lastName')}
            error={fieldErrors.lastName}
            required
          />
        </div>

        <FormField
          label="Email"
          name="email"
          type="email"
          autoComplete="email"
          value={form.email}
          onChange={update('email')}
          error={fieldErrors.email}
          required
        />

        <FormField
          label="Username"
          name="username"
          autoComplete="username"
          value={form.username}
          onChange={update('username')}
          error={fieldErrors.username}
          required
        />

        <FormField
          label="Password"
          name="password"
          type="password"
          autoComplete="new-password"
          value={form.password}
          onChange={update('password')}
          error={fieldErrors.password}
          helpText={`At least ${PASSWORD_MIN} characters.`}
          required
        />

        <FormField
          label="Phone (optional)"
          name="phone"
          type="tel"
          autoComplete="tel"
          value={form.phone}
          onChange={update('phone')}
          error={fieldErrors.phone}
        />

        <FormField
          label="Profile picture URL (optional)"
          name="profilePictureUrl"
          type="url"
          value={form.profilePictureUrl}
          onChange={update('profilePictureUrl')}
          error={fieldErrors.profilePictureUrl}
        />

        <div>
          <label className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-200">
            <input
              type="checkbox"
              name="terms"
              checked={acceptedTerms}
              onChange={(e) => setAcceptedTerms(e.target.checked)}
              aria-invalid={fieldErrors.terms ? 'true' : undefined}
              aria-describedby={fieldErrors.terms ? 'terms-error' : undefined}
              className="mt-0.5 h-4 w-4 rounded border-slate-300 text-violet-600 focus:ring-violet-500"
            />
            <span>
              I confirm I&apos;m at least 16 years old and accept the{' '}
              <Link to="/terms" className="text-violet-600 dark:text-violet-400 hover:underline">
                Terms
              </Link>{' '}
              and{' '}
              <Link to="/privacy" className="text-violet-600 dark:text-violet-400 hover:underline">
                Privacy
              </Link>
              .
            </span>
          </label>
          {fieldErrors.terms ? (
            <p id="terms-error" className="mt-1 text-xs text-red-600 dark:text-red-400">
              {fieldErrors.terms}
            </p>
          ) : null}
        </div>

        <Button type="submit" disabled={submitting} className="w-full">
          {submitting ? 'Creating account…' : 'Create account'}
        </Button>

        <p className="text-xs text-slate-500 dark:text-slate-400 text-center">
          We&apos;ll email you a verification link before you can sign in.
        </p>
      </form>
    </AuthFormShell>
  )
}

export default SignUp

