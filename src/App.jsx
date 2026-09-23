import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { AudioProvider } from './contexts/AudioContext'
import { ToastProvider } from './contexts/ToastContext'
import Layout from './components/layout/Layout'
import ProtectedRoute from './components/ProtectedRoute'

import HomeRedirect from './pages/HomeRedirect'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Dashboard from './pages/Dashboard'
import Quiz from './pages/Quiz'
import Results from './pages/Results'
import Profile from './pages/Profile'

import AdminLayout from './pages/admin/AdminLayout'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminStudents from './pages/admin/AdminStudents'
import AdminStudentDetail from './pages/admin/AdminStudentDetail'
import AdminQuestions from './pages/admin/AdminQuestions'
import AdminLevels from './pages/admin/AdminLevels'
import AdminAnalytics from './pages/admin/AdminAnalytics'

export default function App() {
  return (
    <AudioProvider>
      <ToastProvider>
        <AuthProvider>
          <BrowserRouter
            future={{
              v7_startTransition: true,
              v7_relativeSplatPath: true,
            }}
          >
            <div className="app-bg min-h-screen">
              <Routes>
                <Route path="/" element={<HomeRedirect />} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />

                <Route
                  element={
                    <ProtectedRoute>
                      <Layout />
                    </ProtectedRoute>
                  }
                >
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/quiz/:level" element={<Quiz />} />
                  <Route path="/results/:attemptId" element={<Results />} />
                  <Route path="/profile" element={<Profile />} />
                </Route>

                <Route
                  element={
                    <ProtectedRoute adminOnly>
                      <Layout />
                    </ProtectedRoute>
                  }
                >
                  <Route path="/admin" element={<AdminLayout />}>
                    <Route index element={<AdminDashboard />} />
                    <Route path="students" element={<AdminStudents />} />
                    <Route path="students/:id" element={<AdminStudentDetail />} />
                    <Route path="questions" element={<AdminQuestions />} />
                    <Route path="levels" element={<AdminLevels />} />
                    <Route path="analytics" element={<AdminAnalytics />} />
                  </Route>
                </Route>

                <Route path="*" element={<HomeRedirect />} />
              </Routes>
            </div>
          </BrowserRouter>
        </AuthProvider>
      </ToastProvider>
    </AudioProvider>
  )
}