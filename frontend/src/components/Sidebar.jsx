import { NavLink } from 'react-router-dom'
import { Search, Activity } from 'lucide-react'

function Sidebar() {
  const navItems = [
    { path: '/search', icon: Search, label: 'Search' },
  ]

  return (
    <div className="w-64 bg-gradient-to-b from-slate-700 to-slate-800 text-white">
      <div className="p-6 border-b border-slate-600">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
            <Activity className="w-6 h-6 text-slate-700" />
          </div>
          <div>
            <h1 className="text-xl font-bold">EchoScan</h1>
            <p className="text-xs text-slate-300">Patient Search</p>
          </div>
        </div>
      </div>

      <nav className="p-4 space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors duration-200 ${
                  isActive
                    ? 'bg-slate-600 text-white'
                    : 'text-slate-100 hover:bg-slate-600/50'
                }`
              }
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </NavLink>
          )
        })}
      </nav>

      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-600">
        <div className="text-xs text-slate-300">
          <p>Version 1.0.0</p>
          <p className="mt-1">© 2024 EchoScan</p>
        </div>
      </div>
    </div>
  )
}

export default Sidebar