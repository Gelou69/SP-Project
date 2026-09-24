import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { motion } from 'framer-motion'
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
  const [isBooting, setIsBooting] = useState(true)

  useEffect(() => {
    const timer = window.setTimeout(() => setIsBooting(false), 1400)
    return () => window.clearTimeout(timer)
  }, [])

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
            {isBooting && (
              <div className="fixed inset-0 z-[60] flex items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(125,211,252,0.38),_transparent_35%),linear-gradient(135deg,#e0f2fe_0%,#f5f3ff_35%,#ecfeff_100%)]">
                <div className="absolute inset-0 opacity-60">
                  <div className="glow-blob animate-blob left-[-8%] top-[8%] h-72 w-72 bg-sky-400/30" />
                  <div className="glow-blob animate-blob-delay right-[-6%] top-[18%] h-80 w-80 bg-violet-400/30" />
                  <div className="glow-blob animate-blob left-[32%] bottom-[-12%] h-72 w-72 bg-emerald-400/25" />
                </div>

                <motion.div
                  initial={{ opacity: 0, y: 20, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.6, ease: 'easeOut' }}
                  className="relative z-10 flex flex-col items-center gap-5 text-center"
                >
                  <motion.div
                    animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.08, 1] }}
                    transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
                    className="logo-loader relative flex h-24 w-24 items-center justify-center rounded-[28px] bg-white/80 shadow-[0_22px_60px_rgba(14,165,233,0.3)] ring-4 ring-white/70 backdrop-blur"
                  >
                    <img src="/logo.png" alt="Law of Sines logo" className="h-16 w-16 object-cover" />
                  </motion.div>

                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.45em] text-sky-600">Launching</p>
                    <h1 className="mt-2 text-3xl font-black tracking-[0.18em] text-slate-900 sm:text-4xl">
                      LAW OF SINES
                    </h1>
                    <p className="mt-2 text-sm font-semibold text-slate-600 sm:text-base">
                      Grade 10 Math Quests
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 animate-bounce rounded-full bg-sky-500 [animation-delay:-0.2s]" />
                    <span className="h-2.5 w-2.5 animate-bounce rounded-full bg-violet-500 [animation-delay:-0.1s]" />
                    <span className="h-2.5 w-2.5 animate-bounce rounded-full bg-emerald-500" />
                  </div>
                </motion.div>
              </div>
            )}

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