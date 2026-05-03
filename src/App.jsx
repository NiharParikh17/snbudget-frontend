import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout.jsx'
import RequireAuth from './components/RequireAuth.jsx'
import RequireSubscription from './components/RequireSubscription.jsx'
import Home from './pages/Home.jsx'
import About from './pages/About.jsx'
import Privacy from './pages/Privacy.jsx'
import Terms from './pages/Terms.jsx'
import SignIn from './pages/SignIn.jsx'
import SignUp from './pages/SignUp.jsx'
import Welcome from './pages/Welcome.jsx'
import EmailVerified from './pages/EmailVerified.jsx'
import ChoosePlan from './pages/ChoosePlan.jsx'
import Settings from './pages/Settings.jsx'

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/signin" element={<SignIn />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/email-verified" element={<EmailVerified />} />
        <Route
          path="/choose-plan"
          element={
            <RequireAuth>
              <ChoosePlan />
            </RequireAuth>
          }
        />
        <Route
          path="/welcome"
          element={
            <RequireAuth>
              <RequireSubscription>
                <Welcome />
              </RequireSubscription>
            </RequireAuth>
          }
        />
        <Route
          path="/settings"
          element={
            <RequireAuth>
              <RequireSubscription>
                <Settings />
              </RequireSubscription>
            </RequireAuth>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  )
}

export default App
