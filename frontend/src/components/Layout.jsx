import { useNavigate, useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import {
  Activity,
  CalendarDays,
  Pencil,
  Power,
  RefreshCw,
  RotateCcw,
  Search as SearchIcon,
  UserPlus,
} from 'lucide-react'

function Layout({ children }) {
  const navigate = useNavigate()
  const location = useLocation()

  const handleSearch = (e) => {
    e?.preventDefault()
    navigate('/search')
  }

  const handleRefresh = () => {
    navigate('/search')
    setTimeout(() => window.location.reload(), 100)
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#eef3f8] text-slate-900">
      <Sidebar />
      <div className="flex h-full w-full flex-col px-1 py-1 sm:px-2 lg:px-3">
        <header className="mb-3 flex shrink-0 flex-col gap-3 border-b border-slate-200 pb-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-teal-600 text-white shadow-sm">
              <Activity className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-700">EchoScan</p>
              <h1 className="text-2xl font-semibold tracking-normal text-slate-950">Patient Demography</h1>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleSearch}
              className={`toolbar-button ${
                location.pathname === '/search' || location.pathname === '/'
                  ? 'bg-teal-600 text-white shadow-sm'
                  : 'hover:border-teal-300 hover:bg-teal-50'
              }`}
            >
              <SearchIcon className="h-4 w-4" />
              <span className={location.pathname === '/search' || location.pathname === '/' ? 'font-semibold' : ''}>Search</span>
            </button>
            <button
              type="button"
              onClick={() => navigate('/patients/new')}
              className={`toolbar-button ${
                location.pathname === '/patients/new'
                  ? 'bg-teal-600 text-white shadow-sm'
                  : 'hover:border-teal-300 hover:bg-teal-50'
              }`}
            >
              <UserPlus className="h-4 w-4" />
              <span className={location.pathname === '/patients/new' ? 'font-semibold' : ''}>New patient</span>
            </button>
            <button type="button" className="toolbar-button" onClick={() => navigate('/patients')}>
              <Pencil className="h-4 w-4" />
              <span>Edit patient</span>
            </button>
            <button type="button" className="toolbar-button" onClick={() => navigate('/visits')}>
              <CalendarDays className="h-4 w-4" />
              <span>Visits</span>
            </button>
            <button type="button" onClick={handleRefresh} className="toolbar-button">
              <RefreshCw className="h-4 w-4" />
              <span>Refresh</span>
            </button>
          </div>
        </header>

        <main className="flex min-h-0 flex-1 flex-col gap-3">
          {children}
        </main>
      </div>
    </div>
  )
}

export default Layout