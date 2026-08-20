import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  UserPlus,
  Users,
  ImageIcon,
  Ruler,
  FileText,
  BarChart3,
  Cog,
  Power,
  Crown,
} from 'lucide-react'
import EchoLogo from './EchoLogo'

function Sidebar() {
  const navItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/patients/new', icon: UserPlus, label: 'New Patient' },
    { path: '/patients', icon: Users, label: 'Patients' },
    { path: '/images', icon: ImageIcon, label: 'Images' },
    { path: '/measurements', icon: Ruler, label: 'Measurements' },
    { path: '/reports', icon: FileText, label: 'Reports' },
    { path: '/analytics', icon: BarChart3, label: 'Analytics' },
    { path: '/settings', icon: Cog, label: 'Settings' },
  ]

  return (
    <aside className="no-print flex h-screen w-64 shrink-0 flex-col justify-between border-r border-slate-200/80 bg-white p-4 font-sans text-slate-700 select-none overflow-y-auto no-scrollbar">
      <div className="space-y-6">
        {/* Logo Section */}
        <div className="px-2 py-2">
          <EchoLogo compact />
        </div>

        {/* Navigation Items */}
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon

            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/patients'}
                className={({ isActive }) =>
                  `flex items-center space-x-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all duration-150 ${
                    isActive
                      ? 'bg-[#e6f4f1] text-[#0f5449] font-bold shadow-2xs'
                      : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900'
                  }`
                }
              >
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
              </NavLink>
            )
          })}

          <form action="/" method="get" className="pt-1">
            <input type="hidden" name="signout" value="1" />
            <button
              type="submit"
              className="flex w-full items-center space-x-3 rounded-xl px-3.5 py-2.5 text-left text-sm font-medium text-slate-600 transition-all hover:bg-red-50 hover:text-red-700"
            >
              <Power className="h-4 w-4" />
              <span>Sign out</span>
            </button>
          </form>
        </nav>
      </div>

      {/* Upgrade Plan Card & Footer */}
      <div className="space-y-4 pt-4 border-t border-slate-100">
        <div className="rounded-xl border border-amber-200/60 bg-gradient-to-br from-amber-50/50 to-orange-50/30 p-3.5 shadow-2xs cursor-pointer hover:shadow-xs transition">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-100 text-amber-600">
              <Crown className="h-5 w-5 fill-amber-400" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900">Upgrade Plan</p>
              <p className="text-[11px] text-slate-500">Unlock advanced features</p>
            </div>
          </div>
        </div>

        <div className="px-1 text-[11px] text-slate-400">
          <p>Version 1.0.0</p>
          <p className="mt-0.5">© 2026 Echo AI</p>
        </div>
      </div>
    </aside>
  )
}

export default Sidebar
