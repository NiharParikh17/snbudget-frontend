import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Button from '../components/Button.jsx'
import { useAuth } from '../context/AuthContext.jsx'

/**
 * Welcome — placeholder landing page for authenticated users until the real
 * dashboard is built. See `documents/changelog.md` TODOs.
 */
function Welcome() {
  const { userId, logout } = useAuth()
  const navigate = useNavigate()
  const [signingOut, setSigningOut] = useState(false)

  async function handleSignOut() {
    setSigningOut(true)
    try {
      await logout()
    } finally {
      navigate('/', { replace: true })
    }
  }

  return (
    <div className="px-4 sm:px-6 py-16 sm:py-24">
      <div className="max-w-xl mx-auto text-center">
        <span className="inline-block mb-4 px-3 py-1 text-xs font-semibold uppercase tracking-widest rounded-full bg-violet-100 text-violet-700 dark:bg-violet-900/50 dark:text-violet-300 border border-violet-200 dark:border-violet-800">
          Signed in
        </span>
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          You&apos;re in. 🎉
        </h1>
        <p className="mt-5 text-lg text-slate-600 dark:text-slate-300">
          Sign in successful. Your dashboard is coming soon — for now, this
          page is just a friendly confirmation.
        </p>
        {userId ? (
          <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
            User ID: <code className="font-mono">{userId}</code>
          </p>
        ) : null}

        <div className="mt-10 flex justify-center">
          <Button
            type="button"
            variant="secondary"
            onClick={handleSignOut}
            disabled={signingOut}
          >
            {signingOut ? 'Signing out…' : 'Sign out'}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default Welcome

