import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import * as authApi from '../api/auth.js'
import * as usersApi from '../api/users.js'
import * as subscriptionsApi from '../api/subscriptions.js'

/**
 * AuthContext — owns the in-memory auth session.
 *
 * Why in-memory only?
 *   The OAuth2-style refresh token is held in an HttpOnly cookie set by the
 *   backend, which is the safest place for it (inaccessible to JS, immune to
 *   XSS exfiltration). The short-lived access token (15 min TTL per the spec)
 *   lives only in this React state — never localStorage / sessionStorage —
 *   so an XSS payload cannot steal a long-lived credential. On a hard reload
 *   we silently call `/api/identity/auth/refresh` to mint a fresh access token from
 *   the cookie. Anywhere this token is consumed should treat it as opaque.
 *
 * Status machine:
 *   'loading'        — we have not yet completed the initial silent refresh
 *   'anonymous'      — the user is not signed in
 *   'authenticated'  — `accessToken` and `userId` are populated
 *
 * Subscription gating:
 *   When the session is `authenticated` we additionally track
 *   `subscriptionStatus`:
 *     'unknown' — we have not yet resolved the caller's subscription
 *     'none'    — the caller has no active subscription (must pick a plan)
 *     'active'  — the caller has an active subscription
 *   We fail **closed**: any error talking to `/api/subscriptions/me` maps
 *   to `'none'` so a transient outage cannot grant access to gated pages.
 *
 * Implementation note:
 *   Internal helpers are stored on a single `helpersRef` so they can call
 *   each other (login → applyTokenResponse → schedule refreshSilently …)
 *   without forming a useCallback dependency cycle. Public callbacks below
 *   are thin, stable wrappers that defer to those helpers. The
 *   `react-hooks/refs` rule is disabled for this file because the lazy ref
 *   initialization and session-mirror are deliberate, well-tested patterns.
 */
/* eslint-disable react-hooks/refs */

const AuthContext = createContext(null)

const REFRESH_LEEWAY_MS = 60_000 // refresh ~60s before the token expires

const initialState = {
  status: 'loading',
  accessToken: null,
  userId: null,
  expiresAt: null,
  subscriptionStatus: 'unknown',
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(initialState)

  // Mutable refs — never read during render. Internal helpers are stored on
  // a single `helpersRef` so they can call each other (login →
  // applyTokenResponse → schedule refreshSilently …) without forming a
  // useCallback dependency cycle. Public callbacks below are thin, stable
  // wrappers that defer to those helpers.
  const sessionRef = useRef(session)
  const refreshTimerRef = useRef(null)
  const helpersRef = useRef(null)

  // Mirror the latest session into a ref so async helpers (logout) can read
  // the current access token without becoming a render dependency.
  useEffect(() => {
    sessionRef.current = session
  }, [session])

  if (helpersRef.current === null) {
    const clearTimer = () => {
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current)
        refreshTimerRef.current = null
      }
    }

    const setAnonymous = () => {
      clearTimer()
      setSession({
        status: 'anonymous',
        accessToken: null,
        userId: null,
        expiresAt: null,
        subscriptionStatus: 'unknown',
      })
    }

    const loadSubscription = async (accessToken) => {
      // Fail closed: any error → assume no subscription so RequireSubscription
      // routes the user to /choose-plan instead of silently letting them in.
      let nextStatus = 'none'
      try {
        const sub = await subscriptionsApi.getCurrentSubscription(accessToken)
        if (sub && sub.status === 'ACTIVE') nextStatus = 'active'
      } catch {
        nextStatus = 'none'
      }
      // Guard against stale updates: only apply if the access token still
      // matches the current session (the user may have logged out or
      // refreshed in the meantime).
      setSession((prev) =>
        prev.accessToken === accessToken
          ? { ...prev, subscriptionStatus: nextStatus }
          : prev,
      )
    }

    const applyTokenResponse = (token) => {
      const expiresAt = Date.now() + token.expiresIn * 1000
      setSession({
        status: 'authenticated',
        accessToken: token.accessToken,
        userId: token.userId,
        expiresAt,
        subscriptionStatus: 'unknown',
      })
      clearTimer()
      const delay = Math.max(token.expiresIn * 1000 - REFRESH_LEEWAY_MS, 5_000)
      refreshTimerRef.current = setTimeout(() => {
        helpersRef.current.refreshSilently()
      }, delay)
      // Fire-and-forget — RequireSubscription renders nothing while
      // `subscriptionStatus === 'unknown'`, so the UI naturally waits.
      loadSubscription(token.accessToken)
    }

    const refreshSilently = async () => {
      try {
        const token = await authApi.refresh()
        applyTokenResponse(token)
        return token
      } catch {
        setAnonymous()
        return null
      }
    }

    const login = async (credentials) => {
      const token = await authApi.login(credentials)
      applyTokenResponse(token)
      return token
    }

    // Per product decision: do NOT auto-login after registration. The user
    // must verify their email address (via the email the backend sends)
    // before they can sign in.
    const register = (payload) => usersApi.createUser(payload)

    const logout = async () => {
      const token = sessionRef.current.accessToken
      try {
        if (token) await authApi.logout(token)
      } catch {
        // Even if the server call fails, drop the local session so the user
        // is not left in a half-authenticated state.
      } finally {
        setAnonymous()
      }
    }

    helpersRef.current = { refreshSilently, login, register, logout, clearTimer, loadSubscription }
  }

  // Stable public wrappers — these only touch helpersRef inside the
  // returned callback (i.e. outside render). They never re-create across
  // renders.
  const login = useCallback((credentials) => helpersRef.current.login(credentials), [])
  const register = useCallback((payload) => helpersRef.current.register(payload), [])
  const logout = useCallback(() => helpersRef.current.logout(), [])
  const refreshSubscription = useCallback(() => {
    const token = sessionRef.current.accessToken
    if (!token) return Promise.resolve()
    return helpersRef.current.loadSubscription(token)
  }, [])

  // Initial silent refresh on mount.
  useEffect(() => {
    helpersRef.current.refreshSilently()
    return () => helpersRef.current.clearTimer()
  }, [])

  const value = useMemo(
    () => ({ ...session, login, register, logout, refreshSubscription }),
    [session, login, register, logout, refreshSubscription],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

/** Returns the current auth session and helpers. Must be used inside AuthProvider. */
// eslint-disable-next-line react-refresh/only-export-components -- standard context hook pattern
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}




