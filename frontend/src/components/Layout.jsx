import { useNavigate, useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import GlobalSearch from './GlobalSearch'
import { Bell } from 'lucide-react'

function Layout({ children }) {
  const location = useLocation()
  const isDashboard = location.pathname === '/' || location.pathname === '/dashboard'

  return (
    <div className="flex h-screen overflow-hidden bg-[#f4f6f8] text-slate-900 font-sans">
      <Sidebar />
      <div className="flex h-full min-w-0 flex-1 flex-col px-4 py-4 lg:px-6">
        {/* Modern Header Navigation Bar */}
        <header className="no-print mb-4 flex shrink-0 items-center justify-between gap-4">
          {/* Welcome Title */}
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
              Welcome back, Dr. Sarah 👋
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Here's what's happening with your echoAI system today.
            </p>
          </div>

          {/* Right Area: Global Search + Notifications + User Avatar (WITHOUT New Patient button) */}
          <div className="flex items-center gap-3">
            {/* Global Search Component */}
            <div className="w-72 sm:w-80 md:w-96">
              <GlobalSearch />
            </div>

            {/* Notification Bell */}
            <button
              type="button"
              className="relative flex h-9 w-9 items-center justify-center rounded-full bg-white border border-slate-200/80 text-slate-600 shadow-2xs hover:bg-slate-50 transition"
              title="Notifications"
            >
              <Bell className="h-4 w-4" />
              <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-white">
                3
              </span>
            </button>

            {/* User Avatar Circle */}
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-700 text-xs font-bold text-white shadow-2xs">
              DS
            </div>
          </div>
        </header>

        <main className="flex min-h-0 flex-1 flex-col gap-4 overflow-x-hidden overflow-y-auto no-scrollbar pb-4">
          {children}
        </main>
      </div>
    </div>
  )
}

export default Layout
