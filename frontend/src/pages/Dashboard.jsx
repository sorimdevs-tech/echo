import { useEffect, useState } from 'react'
import { Activity, Baby, Calendar, Heart, Search, Stethoscope, TrendingUp, UserPlus, Users } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { scanService } from '../api/scanService'

export default function Dashboard(){
  const navigate=useNavigate()
  const [stats,setStats]=useState({total_patients:0,total_scans:0,adult_echo:0,fetal_echo:0,pediatric_echo:0})
  useEffect(()=>{scanService.getDashboardStats().then((result)=>result.success&&setStats(result.data)).catch(()=>{})},[])
  const cards=[['Total patients',stats.total_patients,Users,'bg-blue-500'],['Total scans',stats.total_scans,Activity,'bg-emerald-500'],['Adult Echo',stats.adult_echo,Heart,'bg-violet-500'],['Fetal Echo',stats.fetal_echo,Baby,'bg-pink-500'],['Pediatric Echo',stats.pediatric_echo,TrendingUp,'bg-orange-500'],["Today's visits",0,Calendar,'bg-indigo-500']]
  return <div className="space-y-6"><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-2xl font-semibold">Dashboard</h2><p className="text-sm text-slate-500">Welcome to the CardioEcho AI reporting workspace.</p></div><div className="flex items-center gap-2 text-sm text-slate-600"><Stethoscope className="h-4 w-4"/>Cardiology department</div></div><div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">{cards.map(([title,value,Icon,colour])=><div key={title} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-center justify-between"><div><p className="text-sm font-medium text-slate-500">{title}</p><p className="mt-1 text-3xl font-semibold">{value}</p></div><span className={`rounded-lg p-3 text-white ${colour}`}><Icon className="h-5 w-5"/></span></div></div>)}</div><section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><h3 className="font-semibold">Quick actions</h3><div className="mt-4 grid gap-3 sm:grid-cols-3"><button onClick={()=>navigate('/search')} className="secondary-button justify-center"><Search className="h-4 w-4"/>Patient search</button><button onClick={()=>navigate('/patients/new')} className="secondary-button justify-center"><UserPlus className="h-4 w-4"/>New patient</button><button onClick={()=>navigate('/visits')} className="secondary-button justify-center"><Calendar className="h-4 w-4"/>Visits</button></div></section></div>
}
