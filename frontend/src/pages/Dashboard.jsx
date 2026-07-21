import { useEffect, useState } from 'react'
import { Users, Activity, Heart, Baby, TrendingUp, Calendar, Stethoscope } from 'lucide-react'
import { scanService } from '../api/scanService'

function Dashboard() {
  const [stats, setStats] = useState({
    total_patients: 0,
    total_scans: 0,
    adult_echo: 0,
    fetal_echo: 0,
    pediatric_echo: 0
  })

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const result = await scanService.getDashboardStats()
      if (result.success) {
        setStats(result.data)
        return
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
    }

    setStats({
      total_patients: 0,
      total_scans: 0,
      adult_echo: 0,
      fetal_echo: 0,
      pediatric_echo: 0,
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500">Welcome to CardioEcho AI Reporting System</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Stethoscope className="w-4 h-4" />
          <span>Cardiology Department</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard title="Total Patients" value={stats.total_patients} icon={Users} color="bg-blue-500" />
        <StatCard title="Total Scans" value={stats.total_scans} icon={Activity} color="bg-emerald-500" />
        <StatCard title="Adult Echo" value={stats.adult_echo} icon={Heart} color="bg-violet-500" />
        <StatCard title="Fetal Echo" value={stats.fetal_echo} icon={Baby} color="bg-pink-500" />
        <StatCard title="Pediatric Echo" value={stats.pediatric_echo} icon={TrendingUp} color="bg-orange-500" />
        <StatCard title="Today's Visits" value={0} icon={Calendar} color="bg-indigo-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="px-6 py-4 border-b border-gray-100">
            <h3 className="text-base font-semibold text-gray-800">Recent Activity</h3>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex items-start gap-3">
              <span className="mt-1 w-2 h-2 rounded-full bg-emerald-500" />
              <div>
                <p className="text-sm text-gray-800">System initialized successfully</p>
                <p className="text-xs text-gray-500">Just now</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="mt-1 w-2 h-2 rounded-full bg-blue-500" />
              <div>
                <p className="text-sm text-gray-800">Ready to accept new patients</p>
                <p className="text-xs text-gray-500">Just now</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="px-6 py-4 border-b border-gray-100">
            <h3 className="text-base font-semibold text-gray-800">Quick Actions</h3>
          </div>
          <div className="p-6 grid grid-cols-2 gap-3">
            <QuickAction label="New Patient" />
            <QuickAction label="New Visit" />
            <QuickAction label="New Echo Scan" />
            <QuickAction label="Add Referral Doctor" />
          </div>
        </div>
      </div>
    </div>
  )
}

function StatCard({ title, value, icon: Icon, color }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
      <div className="p-5 flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="text-3xl font-semibold text-gray-900 mt-1">{value}</p>
        </div>
        <div className={`${color} p-3 rounded-lg text-white`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  )
}

function QuickAction({ label }) {
  return (
    <button className="w-full py-2 px-4 rounded-lg bg-gray-50 border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors">
      {label}
    </button>
  )
}

export default Dashboard