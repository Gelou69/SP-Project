import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Spinner } from '../components/ui'

export default function ProtectedRoute({ children, adminOnly = false }) {
  const { user, profile, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Spinner label="Checking session..." />
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (adminOnly && profile?.role !== 'admin') {
    return <Navigate to="/dashboard" replace />
  }

  return children
}