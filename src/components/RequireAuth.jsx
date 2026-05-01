import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

/**
 * Route guard for authenticated-only pages. While the initial silent
 * refresh is in flight we render nothing (avoids flicker → redirect →
 * flicker back). Anonymous users are bounced to /signin with the original
 * location captured in `state.from` so we can return them post-login.
 */
function RequireAuth({ children }) {
  const { status } = useAuth()
  const location = useLocation()

  if (status === 'loading') return null
  if (status === 'anonymous') {
    return <Navigate to="/signin" replace state={{ from: location }} />
  }
  return children
}

export default RequireAuth

