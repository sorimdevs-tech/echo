import { useEffect, useState } from 'react'
import { Users, Activity, Baby, Heart, TrendingUp, Calendar } from 'lucide-react'
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
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  const statCards = [
    { title: 'Total Patients', value: stats.total_patients, icon: Users, color: 'bg-blue-500' },
    { title: 'Total Scans', value: stats.total_scans, icon: Activity, color: 'bg-green-500' },
    { title: 'Adult Echo', value: stats.adult_echo, icon: Heart, color: 'bg-purple-500' },
    { title: 'Fetal Echo', value: stats.fetal_echo, icon: Baby, color: 'bg-pink-500' },
    { title: 'Pediatric Echo', value: stats.pediatric_echo, icon: TrendingUp, color: 'bg-orange-500' },
    { title: 'Today\'s Visits', value: '0', icon: Calendar, color: 'bg-indigo-500' },
  ]

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statCards.map((card, index) => (
          <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{card.title}</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{card.value}</p>
              </div>
              <div className={`${card.color} p-4 rounded-lg`}>
                <card.icon className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Activity</h3>
          <div className="space-y-4">
            <div className="flex items-start space-x-3 pb-3 border-b border-gray-100">
              <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
              <div>
                <p className="text-sm text-gray-800">System initialized successfully</p>
                <p className="text-xs text-gray-500 mt-1">Just now</p>
              </div>
            </div>
            <div className="flex items-start space-x-3 pb-3 border-b border-gray-100">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
              <div>
                <p className="text-sm text-gray-800">Ready to accept new patients</p>
                <p className="text-xs text-gray-500 mt-1">Just now</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-3">
            <button className="btn-primary">New Patient</button>
            <button className="btn-secondary">New Visit</button>
            <button className="btn-secondary">New Echo Scan</button>
            <button className="btn-secondary">Add Referral Doctor</button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard