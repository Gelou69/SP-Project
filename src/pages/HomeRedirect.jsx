import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Spinner } from '../components/ui'

export default function HomeRedirect() {
  const { user, profile, loading } = useAuth()
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner label="Loading..." />
      </div>
    )
  }
  if (!user) return <Navigate to="/login" replace />
  return <Navigate to={profile?.role === 'admin' ? '/admin' : '/dashboard'} replace />
}