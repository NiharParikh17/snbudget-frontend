import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { AuthProvider } from '../context/AuthContext.jsx'

/**
 * Render a UI tree wrapped in MemoryRouter + AuthProvider, mirroring the
 * production provider stack so components that call `useAuth()` work in
 * tests without each test re-creating the wrapper.
 */
export function renderWithProviders(ui, { route = '/', routerProps } = {}) {
  return render(
    <MemoryRouter initialEntries={[route]} {...routerProps}>
      <AuthProvider>{ui}</AuthProvider>
    </MemoryRouter>,
  )
}

