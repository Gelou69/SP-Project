import { NavLink, Outlet } from 'react-router-dom'
import { LayoutDashboard, Users, FileQuestion, Layers, BarChart3, ShieldCheck } from 'lucide-react'
import { cn } from '../../components/ui'

const NAV = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/students', label: 'Students', icon: Users },
  { to: '/admin/questions', label: 'Questions', icon: FileQuestion },
  { to: '/admin/levels', label: 'Levels', icon: Layers },
  { to: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
]

export default function AdminLayout() {
  return (
    <div className="flex flex-col gap-6 lg:flex-row">
      <aside className="lg:w-60 lg:shrink-0">
        <nav className="glass flex gap-2 overflow-x-auto rounded-3xl p-2 shadow-xl shadow-slate-200/50 lg:flex-col lg:overflow-visible" aria-label="Admin navigation">
          <p className="hidden px-3 pt-2 pb-1 text-[10px] font-extrabold uppercase tracking-widest text-slate-400 lg:block">
            <ShieldCheck className="mr-1 inline h-3.5 w-3.5 text-violet-500" /> Teacher Panel
          </p>
          {NAV.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-2.5 whitespace-nowrap rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500',
                  isActive
                    ? 'bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-lg shadow-violet-300/50'
                    : 'text-slate-600 hover:translate-x-0.5 hover:bg-violet-50 hover:text-violet-700'
                )
              }
            >
              <Icon className="h-4 w-4" /> {label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <div className="min-w-0 flex-1">
        <Outlet />
      </div>
    </div>
  )
}