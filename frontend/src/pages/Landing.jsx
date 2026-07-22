import { Activity, BarChart3, CalendarDays, ChevronRight, HeartPulse, Search, Settings, UserPlus } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

const actions = [
  { label:'Search', description:'Open the clinical dashboard', icon:Search, path:'/dashboard', position:'lg:col-start-3 lg:row-start-1' },
  { label:'New patient', description:'Register patient details', icon:UserPlus, path:'/patients/new', position:'lg:col-start-1 lg:row-start-2' },
  { label:'Queries', description:'Clinical analytics and exports', icon:BarChart3, path:'/analytics', position:'lg:col-start-5 lg:row-start-2' },
  { label:'Visits', description:'Select a patient and add a visit', icon:CalendarDays, path:'/visits', position:'lg:col-start-2 lg:row-start-3' },
  { label:'Settings', description:'Configure reporting defaults', icon:Settings, path:'/settings', position:'lg:col-start-4 lg:row-start-3' },
]

export default function Landing(){
  const navigate=useNavigate()
  return <main className="relative min-h-screen overflow-hidden bg-[#071f3f] text-white">
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_72%_48%,rgba(31,186,169,0.28),transparent_24%),radial-gradient(circle_at_15%_80%,rgba(56,130,190,0.34),transparent_35%),linear-gradient(125deg,#051634_0%,#0a3762_48%,#0c5d78_100%)]"/>
    <div className="absolute inset-x-0 bottom-0 h-[58%] origin-bottom -skew-y-6 bg-[linear-gradient(rgba(38,188,191,0.12)_1px,transparent_1px),linear-gradient(90deg,rgba(38,188,191,0.12)_1px,transparent_1px)] bg-[size:42px_42px] [mask-image:linear-gradient(to_bottom,transparent,black)]"/>
    <div className="relative z-10 mx-auto flex min-h-screen max-w-7xl flex-col px-6 py-7 sm:px-10 lg:px-14">
      <header className="flex items-center justify-between">
        <button onClick={()=>navigate('/')} className="flex items-center gap-3 text-left">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-500 shadow-lg shadow-primary-950/30 ring-1 ring-white/20"><Activity className="h-7 w-7"/></span>
          <span><span className="block text-xl font-bold tracking-tight">CardioEcho AI</span><span className="text-xs uppercase tracking-[0.22em] text-cyan-200">Reporting system</span></span>
        </button>
        <button onClick={()=>navigate('/dashboard')} className="hidden items-center gap-2 rounded-full border border-white/20 bg-white/10 px-5 py-2.5 text-sm font-semibold backdrop-blur transition hover:bg-white/20 sm:inline-flex">Open dashboard<ChevronRight className="h-4 w-4"/></button>
      </header>

      <section className="grid flex-1 items-center gap-12 py-14 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="max-w-xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-cyan-200/20 bg-cyan-100/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-cyan-100"><HeartPulse className="h-4 w-4"/>Connected cardiac reporting</span>
          <h1 className="mt-6 text-5xl font-bold leading-[1.04] tracking-tight sm:text-6xl">Clearer echo workflows, from patient to report.</h1>
          <p className="mt-6 max-w-lg text-lg leading-8 text-blue-100/80">Manage patients, visits, Adult, Fetal and Pediatric Echo studies, images, measurements and final reports from one clinical workspace.</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <button onClick={()=>navigate('/dashboard')} className="inline-flex h-12 items-center gap-2 rounded-xl bg-primary-500 px-6 font-semibold shadow-lg shadow-primary-950/30 transition hover:-translate-y-0.5 hover:bg-primary-400"><Search className="h-5 w-5"/>Search</button>
            <button onClick={()=>navigate('/patients/new')} className="inline-flex h-12 items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-6 font-semibold backdrop-blur transition hover:bg-white/20"><UserPlus className="h-5 w-5"/>New patient</button>
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-2xl">
          <div className="absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full border border-cyan-200/20"/>
          <div className="absolute left-1/2 top-1/2 h-[430px] w-[430px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-cyan-200/20"/>
          <div className="relative grid min-h-[520px] grid-cols-2 grid-rows-3 gap-4 lg:grid-cols-5">
            <div className="absolute left-1/2 top-1/2 z-0 flex h-32 w-32 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-white/10 shadow-2xl backdrop-blur-xl"><Activity className="h-16 w-16 text-cyan-100"/></div>
            {actions.map(({label,description,icon:Icon,path,position})=><button key={label} onClick={()=>navigate(path)} className={`group relative z-10 self-center rounded-2xl border border-white/15 bg-white/10 p-4 text-left shadow-xl backdrop-blur-md transition duration-300 hover:-translate-y-1 hover:border-cyan-200/40 hover:bg-white/15 ${position}`}><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-primary-700 shadow"><Icon className="h-5 w-5"/></span><span className="mt-3 block text-sm font-semibold">{label}</span><span className="mt-1 block text-xs leading-5 text-blue-100/70">{description}</span></button>)}
          </div>
        </div>
      </section>
      <footer className="flex flex-col gap-2 border-t border-white/10 pt-5 text-xs text-blue-100/60 sm:flex-row sm:items-center sm:justify-between"><span>CardioEcho AI · Clinical reporting workspace</span><span>Secure local patient and report management</span></footer>
    </div>
  </main>
}
