import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import RequireAuth from './RequireAuth.jsx'
import { AuthProvider } from '../context/AuthContext.jsx'

describe('RequireAuth', () => {
  it('redirects anonymous users to /signin', async () => {
    render(
      <MemoryRouter initialEntries={['/protected']}>
        <AuthProvider>
          <Routes>
            <Route
              path="/protected"
              element={
                <RequireAuth>
                  <p>secret</p>
                </RequireAuth>
              }
            />
            <Route path="/signin" element={<h1>Sign in</h1>} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>,
    )

    expect(await screen.findByRole('heading', { level: 1, name: /sign in/i })).toBeInTheDocument()
    expect(screen.queryByText('secret')).toBeNull()
  })
})

