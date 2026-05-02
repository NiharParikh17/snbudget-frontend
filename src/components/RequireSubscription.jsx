import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

/**
 * Subscription gate. Compose **inside** `RequireAuth` — this guard assumes
 * the caller is already authenticated.
 *
 *   `'unknown'` → render nothing (the subscription lookup is in flight;
 *                avoids a flash of /choose-plan for active subscribers).
 *   `'none'`    → redirect to `/choose-plan`.
 *   `'active'`  → render children.
 *
 * Anonymous sessions are ignored here (they should be caught upstream by
 * `RequireAuth`); we render nothing as a defensive default rather than
 * leaking children to a logged-out user.
 */
function RequireSubscription({ children }) {
  const { status, subscriptionStatus } = useAuth()

  if (status !== 'authenticated') return null
  if (subscriptionStatus === 'unknown') return null
  if (subscriptionStatus === 'none') {
    return <Navigate to="/choose-plan" replace />
  }
  return children
}

export default RequireSubscription

