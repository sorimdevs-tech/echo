import ReportWorkflow from './ReportWorkflow'
import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import GlobalSearch from './GlobalSearch'
import NotificationDropdown from './NotificationDropdown'

function Layout({ children }) {
  const navigate = useNavigate()
  const location = useLocation()
  const isDashboard = location.pathname === '/' || location.pathname === '/dashboard'

  // Dynamic doctor profile info (synced with localStorage and update events)
  const [doctorInfo, setDoctorInfo] = useState(() => {
    try {
      const saved = localStorage.getItem('echoai_doctor_profile')
      if (saved) {
        const parsed = JSON.parse(saved)
        return {
          name: parsed.name || 'Dr. Sarah',
          initials: parsed.initials || 'DS',
        }
      }
      const user = localStorage.getItem('echoai_user') || sessionStorage.getItem('echoai_user')
      if (user) {
        const parsed = JSON.parse(user)
        return {
          name: parsed.name || 'Dr. Sarah',
          initials: parsed.initials || 'DS',
        }
      }
    } catch (e) {
      console.error('Error loading doctor info in Layout', e)
    }
    return { name: 'Dr. Sarah', initials: 'DS' }
  })

  useEffect(() => {
    const handleProfileUpdate = () => {
      try {
        const saved = localStorage.getItem('echoai_doctor_profile')
        if (saved) {
          const parsed = JSON.parse(saved)
          setDoctorInfo({
            name: parsed.name || 'Dr. Sarah',
            initials: parsed.initials || 'DS',
          })
        }
      } catch (e) {
        console.error('Error handling profile update in Layout', e)
      }
    }

    window.addEventListener('doctor_profile_updated', handleProfileUpdate)
    return () => window.removeEventListener('doctor_profile_updated', handleProfileUpdate)
  }, [])

  return (
    <div className="flex h-screen overflow-hidden bg-[#f4f6f8] text-slate-900 font-sans">
      <Sidebar />
      <div className="flex h-full min-w-0 flex-1 flex-col px-4 py-4 lg:px-6">
        {/* Modern Header Navigation Bar */}
        <header className="no-print mb-4 flex shrink-0 items-center justify-between gap-4">
          {/* Welcome Title */}
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
              Welcome back, {doctorInfo.name} 👋
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Here's what's happening with your echoAI system today.
            </p>
          </div>

          {/* Right Area: Global Search + Notifications + User Avatar */}
          <div className="flex items-center gap-3">
            {/* Global Search Component */}
            <div className="w-72 sm:w-80 md:w-96">
              <GlobalSearch />
            </div>

            {/* Interactive Notification Bell Dropdown */}
            <NotificationDropdown />

            {/* User Avatar Circle - clickable to navigate to Doctor Profile page */}
            <button
              type="button"
              id="header-user-avatar-button"
              onClick={() => navigate('/profile')}
              className="group relative flex h-9 w-9 items-center justify-center rounded-full bg-emerald-700 text-xs font-bold text-white shadow-2xs hover:bg-emerald-800 hover:ring-2 hover:ring-emerald-500/50 transition cursor-pointer"
              title={`Doctor Profile (${doctorInfo.name}) - Click to view user profile`}
              aria-label="Doctor Profile"
            >
              <span>{doctorInfo.initials}</span>
              <span
                className="absolute -bottom-0.5 -right-0.5 flex h-2.5 w-2.5 rounded-full bg-emerald-400 ring-2 ring-white"
                title="Online"
              />
            </button>
          </div>
        </header>

        <main className="flex min-h-0 flex-1 flex-col gap-4 overflow-x-hidden overflow-y-auto no-scrollbar pb-4">
          {/(?:adult|fetal|pediatric)-echo-report\/\d+/.test(location.pathname) ? <ReportWorkflow reportId={location.pathname.split('/').pop()}>{children}</ReportWorkflow> : children}
        </main>
      </div>
    </div>
  )
}


export default Layout
