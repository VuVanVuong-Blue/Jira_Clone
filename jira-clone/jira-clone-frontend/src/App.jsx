import { Routes, Route, Navigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { ToastProvider } from './components/Toast'
import { UserProvider, useUser } from './components/UserContext'
import LoadingScreen from './components/LoadingScreen'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import VerifyOtpPage from './pages/VerifyOtpPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import ResetPasswordPage from './pages/ResetPasswordPage'
import ProjectsListPage from './pages/ProjectsListPage'
import PeoplePage from './pages/PeoplePage'
import RolePermissionPage from './pages/RolePermissionPage'
import ProfilePage from './pages/ProfilePage'
import BoardPage from './pages/BoardPage'
import BacklogPage from './pages/BacklogPage'
import ProjectSettingsPage from './pages/ProjectSettingsPage'
import ProjectReportsPage from './pages/ProjectReportsPage'
import ProjectTimelinePage from './pages/ProjectTimelinePage'
import NotFoundPage from './pages/NotFoundPage'
import UnauthorizedPage from './pages/UnauthorizedPage'
import ServerErrorPage from './pages/ServerErrorPage'

function AppContent() {
  const [loading, setLoading] = useState(true)
  const [auth, setAuth] = useState(null)
  const userContext = useUser()
  const { updateUser = () => {} } = userContext || {}

  useEffect(() => {
    const timer = setTimeout(() => {
      const stored = localStorage.getItem('jira_auth')
      if (stored) {
        try { setAuth(JSON.parse(stored)) } catch { localStorage.removeItem('jira_auth') }
      }
      setLoading(false)
    }, 1500)
    return () => clearTimeout(timer)
  }, [])

  const handleAuth = (data) => {
    // Không lưu refreshToken vào localStorage — nó đã nằm trong HttpOnly Cookie
    const { refreshToken: _rt, ...safeData } = data
    localStorage.setItem('jira_auth', JSON.stringify(safeData))
    setAuth(safeData)
    if (data && data.user) updateUser(data.user)
    console.log('[APP] Auth saved to localStorage (refreshToken excluded)')
  }

  const handleLogout = async () => {
    try {
      // Xóa HttpOnly Cookie phía backend
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' })
      console.log('[APP] Logout: HttpOnly Cookie cleared')
    } catch (e) {
      console.warn('[APP] Logout cookie clear failed:', e)
    }
    localStorage.removeItem('jira_auth')
    setAuth(null)
    updateUser(null)
  }

  if (loading) return <LoadingScreen />

  return (
    <Routes>
      <Route path="/login" element={auth ? <Navigate to="/" /> : <LoginPage onAuth={handleAuth} />} />
      <Route path="/register" element={auth ? <Navigate to="/" /> : <RegisterPage onAuth={handleAuth} />} />
      <Route path="/verify-otp" element={auth ? <Navigate to="/" /> : <VerifyOtpPage onAuth={handleAuth} />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/" element={auth ? <ProjectsListPage onLogout={handleLogout} /> : <Navigate to="/login" />} />
      <Route path="/projects" element={auth ? <ProjectsListPage onLogout={handleLogout} /> : <Navigate to="/login" />} />
      <Route path="/people" element={auth ? <PeoplePage onLogout={handleLogout} /> : <Navigate to="/login" />} />
      <Route path="/roles" element={auth ? <RolePermissionPage onLogout={handleLogout} /> : <Navigate to="/login" />} />
      <Route path="/profile" element={auth ? <ProfilePage auth={auth} onLogout={handleLogout} /> : <Navigate to="/login" />} />
      
      <Route path="/projects/:id/board" element={auth ? <BoardPage onLogout={handleLogout} /> : <Navigate to="/login" />} />
      <Route path="/projects/:id/backlog" element={auth ? <BacklogPage onLogout={handleLogout} /> : <Navigate to="/login" />} />
      <Route path="/projects/:id/settings" element={auth ? <ProjectSettingsPage onLogout={handleLogout} /> : <Navigate to="/login" />} />
      <Route path="/projects/:id/reports" element={auth ? <ProjectReportsPage onLogout={handleLogout} /> : <Navigate to="/login" />} />
      <Route path="/projects/:id/timeline" element={auth ? <ProjectTimelinePage onLogout={handleLogout} /> : <Navigate to="/login" />} />
      
      <Route path="/403" element={<UnauthorizedPage />} />
      <Route path="/500" element={<ServerErrorPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}

function App() {
  return (
    <ToastProvider>
      <UserProvider>
        <AppContent />
      </UserProvider>
    </ToastProvider>
  )
}

export default App
