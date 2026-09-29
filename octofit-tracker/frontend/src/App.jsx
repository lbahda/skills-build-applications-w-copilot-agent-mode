import { useEffect, useState } from 'react'
import { Activity as ActivityIcon, Dumbbell, LogOut, Trophy, Users, UserRound } from 'lucide-react'
import { Navigate, NavLink, Route, Routes } from 'react-router-dom'
import { apiRequest } from './api.js'
import Activities from './components/Activities.jsx'
import Leaderboard from './components/Leaderboard.jsx'
import Teams from './components/Teams.jsx'
import UsersView from './components/Users.jsx'
import Workouts from './components/Workouts.jsx'
import './octofit.css'

const TOKEN_KEY = 'octofit-token'

const navigation = [
  { to: '/activities', label: 'Activities', icon: ActivityIcon },
  { to: '/leaderboard', label: 'Leaderboard', icon: Trophy },
  { to: '/teams', label: 'Teams', icon: Users },
  { to: '/users', label: 'Athletes', icon: UserRound },
  { to: '/workouts', label: 'Workouts', icon: Dumbbell },
]

function SignIn({ onSignIn }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      await onSignIn({ email, password })
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="signin-page">
      <section className="signin-brand" aria-label="OctoFit Tracker">
        <img src="/octofitapp-small.png" alt="OctoFit Tracker" />
        <span className="eyebrow">MERGINGTON HIGH · FITNESS CLUB</span>
        <h1>Make room<br />to move.</h1>
        <p>Every session adds up.</p>
      </section>
      <section className="signin-panel">
        <div className="signin-heading">
          <span className="eyebrow">YOUR TRAINING SPACE</span>
          <h2>Welcome back</h2>
          <p>Sign in to your OctoFit account.</p>
        </div>
        <form className="signin-form" onSubmit={handleSubmit}>
          <label className="form-label" htmlFor="signin-email">Email</label>
          <input
            autoComplete="email"
            className="form-control"
            id="signin-email"
            onChange={(event) => setEmail(event.target.value)}
            required
            type="email"
            value={email}
          />
          <label className="form-label" htmlFor="signin-password">Password</label>
          <input
            autoComplete="current-password"
            className="form-control"
            id="signin-password"
            onChange={(event) => setPassword(event.target.value)}
            required
            type="password"
            value={password}
          />
          {error && <p className="form-error" role="alert">{error}</p>}
          <button className="btn btn-primary signin-submit" disabled={submitting} type="submit">
            {submitting ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </section>
    </main>
  )
}

function AppShell({ profile, token, onSignOut }) {
  return (
    <div className="app-shell">
      <header className="topbar">
        <NavLink aria-label="OctoFit home" className="brand" to="/activities">
          <img alt="" className="brand-logo" src="/octofitapp-small.png" />
          <span>octofit<span className="brand-dot">.</span></span>
        </NavLink>
        <nav aria-label="Main navigation" className="main-nav">
          {navigation.map(({ to, label, icon: Icon }) => (
            <NavLink className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`} key={to} to={to}>
              <Icon aria-hidden="true" size={17} strokeWidth={2.1} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="account-controls">
          <span aria-hidden="true" className="avatar avatar-small">
            {profile?.displayName?.slice(0, 1)?.toUpperCase() || 'O'}
          </span>
          <span className="account-name">{profile?.displayName || 'Athlete'}</span>
          <button aria-label="Sign out" className="icon-button signout-button" onClick={onSignOut} title="Sign out" type="button">
            <LogOut aria-hidden="true" size={17} />
          </button>
        </div>
      </header>
      <main className="main-content">
        <Routes>
          <Route element={<Navigate replace to="/activities" />} path="/" />
          <Route element={<Activities token={token} />} path="/activities" />
          <Route element={<Leaderboard token={token} />} path="/leaderboard" />
          <Route element={<Teams profile={profile} token={token} />} path="/teams" />
          <Route element={<UsersView token={token} />} path="/users" />
          <Route element={<Workouts token={token} />} path="/workouts" />
          <Route element={<Navigate replace to="/activities" />} path="*" />
        </Routes>
      </main>
      <footer className="app-footer">
        <span>OCTOFIT TRACKER</span>
        <span>Move well. Show up.</span>
      </footer>
    </div>
  )
}

export default function App() {
  const [token, setToken] = useState(() => window.localStorage.getItem(TOKEN_KEY) || '')
  const [profile, setProfile] = useState(null)
  const [checkingSession, setCheckingSession] = useState(() => Boolean(window.localStorage.getItem(TOKEN_KEY)))

  useEffect(() => {
    if (!token) return undefined

    let current = true
    apiRequest('/api/users/me/', { token })
      .then((user) => {
        if (current) setProfile(user)
      })
      .catch(() => {
        if (!current) return
        window.localStorage.removeItem(TOKEN_KEY)
        setToken('')
        setProfile(null)
      })
      .finally(() => {
        if (current) setCheckingSession(false)
      })

    return () => {
      current = false
    }
  }, [token])

  async function handleSignIn(credentials) {
    const result = await apiRequest('/api/auth/login/', {
      method: 'POST',
      body: credentials,
    })
    window.localStorage.setItem(TOKEN_KEY, result.token)
    setProfile(result.user)
    setToken(result.token)
  }

  function handleSignOut() {
    window.localStorage.removeItem(TOKEN_KEY)
    setToken('')
    setProfile(null)
  }

  if (checkingSession) {
    return <div aria-live="polite" className="session-loading">Loading your training space…</div>
  }

  if (!token) return <SignIn onSignIn={handleSignIn} />
  return <AppShell onSignOut={handleSignOut} profile={profile} token={token} />
}
