import { createContext, useCallback, useContext, useEffect, useState } from 'react'

/**
 * ThemeContext — manages the app-wide colour scheme.
 *
 * Supported values for `theme`:
 *   'system'  — follow the OS preference (default, used pre-auth)
 *   'light'   — always light
 *   'dark'    — always dark
 *
 * The effective mode is applied by adding/removing the `.dark` class on
 * <html>.  Tailwind's `dark:` variant is wired to this class (see
 * index.css).  A future Settings page will persist the user's choice to
 * their profile; until then it falls back to localStorage → 'system'.
 */

const STORAGE_KEY = 'snbudget-theme'

const ThemeContext = createContext(null)

function getSystemDark() {
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

function applyTheme(theme) {
  const isDark = theme === 'dark' || (theme === 'system' && getSystemDark())
  document.documentElement.classList.toggle('dark', isDark)
  document.documentElement.style.colorScheme = isDark ? 'dark' : 'light'
}

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored === 'light' || stored === 'dark' ? stored : 'system'
  })

  const setTheme = useCallback((next) => {
    const value = next === 'light' || next === 'dark' ? next : 'system'
    localStorage.setItem(STORAGE_KEY, value)
    setThemeState(value)
    applyTheme(value)
  }, [])

  // Apply on mount and whenever theme changes
  useEffect(() => {
    applyTheme(theme)
  }, [theme])

  // Keep 'system' mode in sync if OS preference changes at runtime
  useEffect(() => {
    if (theme !== 'system') return
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = () => applyTheme('system')
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [theme])

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

/** Returns `{ theme, setTheme }`. Must be used inside <ThemeProvider>. */
// eslint-disable-next-line react-refresh/only-export-components -- standard context hook pattern
export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used inside ThemeProvider')
  return ctx
}
