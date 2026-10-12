import { Link, useLocation } from 'react-router-dom'
import { BookOpen, Plus, Home, History } from 'lucide-react'
import env from '../../config/env'

export default function Header() {
  const location = useLocation()
  const isExamMode = location.pathname.startsWith('/test/') && location.pathname.includes('/attempt')

  if (isExamMode) return null

  const navItems = [
    { to: '/', label: 'Dashboard', icon: Home },
    { to: '/create', label: 'Create Test', icon: Plus },
    { to: '/history', label: 'History', icon: History },
  ]

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2">
            <div className="p-1.5 bg-primary-600 rounded-lg">
              <BookOpen className="h-5 w-5 text-white" />
            </div>
            <span className="font-semibold text-slate-900 hidden sm:block">
              {env.appName}
            </span>
          </Link>

          <nav className="flex items-center gap-1">
            {navItems.map(({ to, label, icon: Icon }) => {
              const active = location.pathname === to
              return (
                <Link
                  key={to}
                  to={to}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    active
                      ? 'bg-primary-50 text-primary-700'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{label}</span>
                </Link>
              )
            })}
          </nav>
        </div>
      </div>
    </header>
  )
}
