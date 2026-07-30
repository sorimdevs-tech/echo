import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowRight,
  BarChart3,
  Database,
  Eye,
  EyeOff,
  FileText,
  Link2,
  Lock,
  Mail,
  Rocket,
  Search,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Upload,
  Users,
  Zap,
  CheckCircle2,
  Heart,
  Activity,
  Stethoscope,
} from 'lucide-react'
import { patientService } from '../api/patientService'
import { scanService } from '../api/scanService'
import EchoLogo from '../components/EchoLogo'

const demoUsers = [
  {
    name: 'Dr Shanthi',
    role: 'Founder',
    email: 'dr.shanthi@echoai.com',
    userName: 'dr.shanthi',
    password: 'password123',
  },
]

const pipelineSteps = [
  {
    number: '1',
    title: 'Connect',
    copy: 'Securely connect your data in seconds',
    badge: 'bg-blue-500',
    iconBg: 'from-blue-400 to-indigo-600',
    glow: 'shadow-blue-200',
    icon: Database,
    subIcon: Link2,
    subBg: 'bg-emerald-500',
  },
  {
    number: '2',
    title: 'Ingest',
    copy: 'Capture and unify your data',
    badge: 'bg-emerald-500',
    iconBg: 'from-emerald-400 to-teal-600',
    glow: 'shadow-emerald-200',
    icon: Upload,
    subIcon: CheckCircle2,
    subBg: 'bg-teal-500',
  },
  {
    number: '3',
    title: 'Analyze',
    copy: 'Detect patterns and key insights',
    badge: 'bg-purple-500',
    iconBg: 'from-purple-500 to-indigo-700',
    glow: 'shadow-purple-200',
    icon: Search,
    subIcon: BarChart3,
    subBg: 'bg-violet-500',
  },
  {
    number: '4',
    title: 'Report',
    copy: 'Generate reports instantly',
    badge: 'bg-sky-500',
    iconBg: 'from-sky-400 to-blue-600',
    glow: 'shadow-sky-200',
    icon: FileText,
    subIcon: FileText,
    subBg: 'bg-blue-500',
  },
  {
    number: '5',
    title: 'Act',
    copy: 'Take action with confidence',
    badge: 'bg-teal-500',
    iconBg: 'from-teal-400 to-emerald-600',
    glow: 'shadow-teal-200',
    icon: Rocket,
    subIcon: Sparkles,
    subBg: 'bg-emerald-500',
  },
  {
    number: '6',
    title: 'Impact',
    copy: 'Drive better outcomes together',
    badge: 'bg-indigo-500',
    iconBg: 'from-indigo-400 to-violet-700',
    glow: 'shadow-indigo-200',
    icon: Users,
    subIcon: Sparkles,
    subBg: 'bg-yellow-500',
  },
]

const echoStats = [
  { label: 'Scans Analyzed', value: '100+', icon: Activity, color: 'text-blue-600 bg-blue-50 border-blue-100' },
  { label: 'Clinical Accuracy', value: '99.4%', icon: CheckCircle2, color: 'text-emerald-600 bg-emerald-50 border-emerald-100' },
  { label: 'Clinics', value: '10+', icon: Stethoscope, color: 'text-purple-600 bg-purple-50 border-purple-100' },
  { label: 'Reports Generated', value: '200+', icon: FileText, color: 'text-sky-600 bg-sky-50 border-sky-100' },
]

const bottomFeatures = [
  { title: 'All Your Data', copy: 'Connect any source seamlessly', icon: Link2, color: 'from-blue-400 to-indigo-600' },
  { title: 'Any Format', copy: 'Structured & unstructured data', icon: Upload, color: 'from-emerald-400 to-teal-600' },
  { title: 'AI-Powered Insights', copy: 'Smarter analysis, deeper insights', icon: BarChart3, color: 'from-purple-400 to-violet-600' },
  { title: 'Clear & Actionable', copy: 'Reports that drive real decisions', icon: FileText, color: 'from-sky-400 to-blue-600' },
  { title: 'Enterprise Ready', copy: 'Secure, reliable and compliant', icon: ShieldCheck, color: 'from-teal-400 to-emerald-600' },
  { title: 'Built for Growth', copy: 'Scale with your business', icon: TrendingUp, color: 'from-indigo-400 to-purple-600' },
]

// Tamil Nadu patient recent scan feed
const tamilPatients = [
  { name: 'Murugan Ramasamy',   age: 58, city: 'Chennai',     dx: 'Mild Aortic Stenosis',     ef: '55%', status: 'Reviewed',   badge: 'bg-emerald-500', initials: 'MR', time: '2 min ago' },
  { name: 'Kavitha Subramaniam',age: 44, city: 'Coimbatore',  dx: 'Normal Echo Study',        ef: '62%', status: 'Completed',  badge: 'bg-blue-500',    initials: 'KS', time: '8 min ago' },
  { name: 'Selvam Pillai',      age: 67, city: 'Madurai',     dx: 'Dilated Cardiomyopathy',   ef: '35%', status: 'Critical',   badge: 'bg-red-500',     initials: 'SP', time: '14 min ago' },
  { name: 'Lakshmi Chandran',   age: 52, city: 'Trichy',      dx: 'Mitral Regurgitation',     ef: '58%', status: 'Reviewed',   badge: 'bg-emerald-500', initials: 'LC', time: '21 min ago' },
  { name: 'Arjun Natarajan',    age: 39, city: 'Salem',       dx: 'Normal Echo Study',        ef: '65%', status: 'Completed',  badge: 'bg-blue-500',    initials: 'AN', time: '29 min ago' },
  { name: 'Priya Muthusamy',    age: 33, city: 'Tirunelveli', dx: 'Fetal Echo — Normal',      ef: '—',   status: 'Completed',  badge: 'bg-purple-500',  initials: 'PM', time: '37 min ago' },
  { name: 'Rajan Venkatesh',    age: 71, city: 'Vellore',     dx: 'Pericardial Effusion',     ef: '48%', status: 'Pending',    badge: 'bg-amber-500',   initials: 'RV', time: '45 min ago' },
  { name: 'Anitha Govindasamy', age: 48, city: 'Erode',       dx: 'Hypertensive Heart Disease', ef:'52%', status: 'Reviewed', badge: 'bg-emerald-500', initials: 'AG', time: '1 hr ago' },
]

function buildGoogleAuthUrl() {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID
  if (!clientId) return ''
  const redirectUri = import.meta.env.VITE_GOOGLE_REDIRECT_URI || window.location.origin
  const state = crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`
  sessionStorage.setItem('echoai_google_oauth_state', state)
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'token',
    scope: 'openid email profile',
    include_granted_scopes: 'true',
    prompt: 'select_account',
    state,
  })
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
}

/* Animated scrolling echo waveform — live monitor effect */
function EchoWaveform() {
  // One full cycle of the waveform path (420 units wide)
  const wave =
    'M0,32 Q20,32 30,32 T50,32 Q55,32 58,24 T64,40 Q67,44 70,32 T80,32 Q90,32 100,32 T118,32 Q122,28 126,20 Q128,14 130,8 Q132,2 134,32 Q136,58 138,42 Q140,32 150,32 T168,32 Q172,28 176,22 T182,38 Q185,44 188,32 T200,32 Q212,32 218,32 T236,32 Q240,28 244,20 Q246,14 248,8 Q250,2 252,32 Q254,58 256,42 Q258,32 268,32 T286,32 Q290,28 294,22 T300,38 Q303,44 306,32 T318,32 Q330,32 340,32 T360,32 Q365,32 368,24 T374,40 Q378,44 382,32 T400,32 L420,32'

  // Shift same path by 420 for seamless loop
  const wave2 = wave.replace(/(-?\d+(\.\d+)?),(\d+(\.\d+)?)/g, (m, x, _xd, y) =>
    `${parseFloat(x) + 420},${y}`,
  )

  return (
    <div className="relative w-full overflow-hidden" style={{ height: '64px' }}>
      {/* CSS keyframes injected inline */}
      <style>{`
        @keyframes echoScroll {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
        @keyframes scanPulse {
          0%,100% { opacity:1; r:3; }
          50%      { opacity:0.4; r:5; }
        }
        @keyframes fadeInWave {
          from { opacity:0; }
          to   { opacity:1; }
        }
      `}</style>

      {/* Scrolling SVG — doubled width for seamless loop */}
      <svg
        viewBox="0 0 840 64"
        style={{
          width: '200%',
          height: '100%',
          animation: 'echoScroll 5s linear infinite',
          position: 'absolute',
          top: 0,
          left: 0,
        }}
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="waveGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%"   stopColor="#38bdf8" stopOpacity="0.1" />
            <stop offset="25%"  stopColor="#6366f1" stopOpacity="0.9" />
            <stop offset="50%"  stopColor="#818cf8" stopOpacity="1"   />
            <stop offset="75%"  stopColor="#6366f1" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.1" />
          </linearGradient>
          <linearGradient id="fillGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#6366f1" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#6366f1" stopOpacity="0"    />
          </linearGradient>
        </defs>

        {/* Dashed baseline */}
        <line x1="0" y1="32" x2="840" y2="32" stroke="#e2e8f0" strokeWidth="1" strokeDasharray="5 5" />

        {/* Fill under wave — first copy */}
        <path d={wave.replace('L420,32', 'L420,64 L0,64 Z')} fill="url(#fillGrad)" />
        {/* Fill under wave — second copy */}
        <path d={wave2.replace('L840,32', 'L840,64 L420,64 Z')} fill="url(#fillGrad)" />

        {/* Waveform line — first copy */}
        <path d={wave} fill="none" stroke="url(#waveGrad)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        {/* Waveform line — second copy */}
        <path d={wave2} fill="none" stroke="url(#waveGrad)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>

      {/* Edge fade masks so the wave fades in/out at edges */}
      <div className="pointer-events-none absolute inset-y-0 left-0 w-12" style={{ background: 'linear-gradient(to right, white, transparent)' }} />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-12" style={{ background: 'linear-gradient(to left, white, transparent)' }} />

      {/* Scanning glowing dot that moves with the wave */}
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 420 64" preserveAspectRatio="none" style={{ pointerEvents: 'none' }}>
        <circle cx="320" cy="32" r="4" fill="#6366f1" opacity="0.9" style={{ animation: 'scanPulse 1.2s ease-in-out infinite' }} />
        <circle cx="320" cy="32" r="10" fill="#6366f1" opacity="0.15" style={{ animation: 'scanPulse 1.2s ease-in-out infinite' }} />
      </svg>
    </div>
  )
}



function PlatformTemplate() {
  return (
    <section
      className="relative hidden min-h-0 flex-col justify-between overflow-hidden rounded-[2rem] border border-blue-100/60 lg:flex"
      style={{ background: 'linear-gradient(145deg, #f8faff 0%, #f1f5ff 35%, #f4f0ff 65%, #f8f9ff 100%)' }}
    >
      {/* Subtle soft corner glows */}
      <div className="pointer-events-none absolute -left-32 -top-32 h-72 w-72 rounded-full bg-blue-200/30 blur-3xl" />
      <div className="pointer-events-none absolute -right-32 top-0 h-72 w-72 rounded-full bg-violet-200/30 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 left-1/2 h-56 w-56 -translate-x-1/2 rounded-full bg-cyan-200/20 blur-3xl" />

      {/* Dot grid top-right */}
      <div className="pointer-events-none absolute right-8 top-8 grid gap-2.5 opacity-25" style={{ gridTemplateColumns: 'repeat(6,6px)' }}>
        {[...Array(30)].map((_, i) => <div key={i} className="h-1.5 w-1.5 rounded-full bg-blue-400" />)}
      </div>

      <div className="relative flex min-h-0 flex-1 flex-col justify-between p-8">

        {/* ── HEADER ── */}
        <div className="text-center">
          <EchoLogo />
          <h1 className="mt-3 leading-tight">
            <span className="block text-[1.9rem] font-black text-[#08145f] xl:text-[2.2rem]">Your AI-Powered</span>
            <span
              className="block text-[1.9rem] font-black xl:text-[2.2rem]"
              style={{ background: 'linear-gradient(90deg,#2563eb,#6366f1,#7c3aed)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}
            >
              Data Intelligence Platform
            </span>
          </h1>
          <p className="mt-2 text-sm font-medium text-slate-500 tracking-widest">
            Connect · Analyze · Act
          </p>
        </div>

        {/* ── ECHO STATS + ECG ROW ── */}
        <div className="my-3">
          {/* Stat Cards */}
          <div className="grid grid-cols-4 gap-3 mb-3">
            {echoStats.map((s) => {
              const Icon = s.icon
              return (
                <div key={s.label} className={`flex items-center gap-2.5 rounded-xl border bg-white/80 px-3.5 py-2.5 shadow-sm ${s.color.split(' ').find(c => c.startsWith('border-'))}`}>
                  <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border ${s.color}`}>
                    <Icon className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <p className="text-base font-black text-[#08145f] leading-none">{s.value}</p>
                    <p className="text-[10px] font-semibold text-slate-500 mt-0.5">{s.label}</p>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Echo Waveform banner */}
          <div className="flex items-center gap-3 rounded-xl border border-indigo-100 bg-white/70 px-4 py-3 shadow-sm backdrop-blur-sm">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-md">
              <Activity className="h-5 w-5 text-white" />
            </div>
            <div className="min-w-0 flex-1 overflow-hidden">
              <EchoWaveform />
            </div>
            <div className="shrink-0 text-right pl-2">
              <p className="text-xs font-bold text-[#08145f]">Echo Scan Monitor</p>
              <p className="text-[10px] font-medium text-slate-500">Live · AI Assisted</p>
            </div>
          </div>
        </div>

        {/* ── RECENT PATIENT ACTIVITY TICKER ── */}
        <div className="relative overflow-hidden rounded-2xl border border-white/80 bg-white/60 shadow-sm backdrop-blur-sm" style={{ height: '54px' }}>
          <style>{`
            @keyframes tickerScroll {
              0%   { transform: translateX(0); }
              100% { transform: translateX(-50%); }
            }
          `}</style>
          {/* Header label */}
          <div className="absolute left-0 top-0 z-10 flex h-full items-center gap-2 rounded-l-2xl border-r border-blue-100 bg-gradient-to-r from-blue-600 to-indigo-600 px-3.5">
            <Activity className="h-4 w-4 text-white" />
            <span className="text-[11px] font-bold uppercase tracking-widest text-white whitespace-nowrap">Live Scans</span>
          </div>
          {/* Scrolling ticker */}
          <div className="ml-[100px] h-full overflow-hidden">
            <div
              className="flex h-full items-center"
              style={{ width: 'max-content', animation: 'tickerScroll 28s linear infinite' }}
            >
              {[...tamilPatients, ...tamilPatients].map((p, i) => (
                <div key={i} className="mx-3 flex items-center gap-2.5 rounded-xl border border-slate-100 bg-white px-3 py-1.5 shadow-sm shrink-0">
                  <span className={`flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-bold text-white ${p.badge}`}>{p.initials}</span>
                  <div className="leading-none">
                    <p className="text-[11px] font-bold text-[#08145f]">{p.name} <span className="font-normal text-slate-400">· {p.age}y · {p.city}</span></p>
                    <p className="mt-0.5 text-[10px] text-slate-500">{p.dx} &nbsp;·&nbsp; EF {p.ef}</p>
                  </div>
                  <span className={`ml-1 rounded-full px-2 py-0.5 text-[9px] font-bold text-white ${p.badge}`}>{p.status}</span>
                  <span className="text-[9px] text-slate-400 whitespace-nowrap">{p.time}</span>
                </div>
              ))}
            </div>
          </div>
          {/* Right fade */}
          <div className="pointer-events-none absolute inset-y-0 right-0 w-10 rounded-r-2xl" style={{ background: 'linear-gradient(to left, white 40%, transparent)' }} />
        </div>

        {/* ── PIPELINE CARDS ── */}
        <div className="relative grid grid-cols-6 gap-3">
          {pipelineSteps.map((step, index) => {
            const HeroIcon = step.icon
            const SubIcon = step.subIcon
            return (
              <div key={step.title} className="relative flex flex-col items-center group">
                <div className="relative w-full rounded-2xl border border-white bg-white/90 px-2 py-4 shadow-md shadow-slate-200/70 backdrop-blur-sm transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-xl text-center flex flex-col items-center">
                  <span className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold text-white mb-3 ${step.badge}`}>
                    {step.number}
                  </span>

                  <div className="relative mb-3">
                    <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${step.iconBg} shadow-lg ${step.glow}`}>
                      <HeroIcon className="h-7 w-7 text-white" strokeWidth={1.5} />
                    </div>
                    <div className={`absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full ring-2 ring-white shadow-sm ${step.subBg}`}>
                      <SubIcon className="h-2.5 w-2.5 text-white" />
                    </div>
                  </div>

                  <h3 className="text-xs font-bold text-[#08145f]">{step.title}</h3>
                  <p className="mt-1 text-[10px] font-medium leading-tight text-slate-500">{step.copy}</p>
                </div>

                {index < pipelineSteps.length - 1 && (
                  <div className="absolute -right-2.5 top-1/2 z-20 flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200 bg-white shadow-sm">
                    <ArrowRight className="h-3 w-3 text-slate-400" />
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* ── BOTTOM FEATURES + TRUST ── */}
        <div className="mt-3 rounded-2xl border border-white/80 bg-white/70 px-5 py-4 shadow-sm backdrop-blur-sm">
          <div className="grid grid-cols-6 gap-3">
            {bottomFeatures.map((item) => {
              const Icon = item.icon
              return (
                <div key={item.title} className="flex items-start gap-2">
                  <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br ${item.color} shadow-md`}>
                    <Icon className="h-4 w-4 text-white" strokeWidth={2} />
                  </div>
                  <div>
                    <h4 className="text-[11px] font-bold text-[#08145f] leading-tight">{item.title}</h4>
                    <p className="mt-0.5 text-[10px] text-slate-500 leading-tight">{item.copy}</p>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="mt-3 flex items-center justify-center gap-2 border-t border-slate-100 pt-2.5">
            <ShieldCheck className="h-3.5 w-3.5 text-slate-400" />
            <p className="text-[11px] text-slate-500">
              Trusted by forward-thinking clinical teams to turn scan data into{' '}
              <span className="font-semibold text-blue-600">real impact.</span>
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

function Home() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.allSettled([scanService.getDashboardStats(), patientService.getPatients()])
  }, [])

  useEffect(() => {
    const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''))
    const accessToken = hashParams.get('access_token')
    const state = hashParams.get('state')
    const expectedState = sessionStorage.getItem('echoai_google_oauth_state')
    if (!accessToken || (expectedState && state !== expectedState)) return
    localStorage.setItem('echoai_google_access_token', accessToken)
    sessionStorage.removeItem('echoai_google_oauth_state')
    window.history.replaceState({}, document.title, window.location.pathname)
    navigate('/dashboard', { replace: true })
  }, [navigate])

  const useDemoUser = (user = demoUsers[0]) => {
    setEmail(user.email)
    setPassword(user.password)
    setError('')
  }

  const handleLogin = (event) => {
    event.preventDefault()
    const login = email.trim().toLowerCase()
    const matchedUser = demoUsers.find(
      (u) => (u.email.toLowerCase() === login || u.userName.toLowerCase() === login) && u.password === password,
    )
    if (!matchedUser) {
      setError('Incorrect credentials. Use the founder login below.')
      return
    }
    const storage = remember ? localStorage : sessionStorage
    const other = remember ? sessionStorage : localStorage
    other.removeItem('echoai_user')
    storage.setItem('echoai_user', JSON.stringify({ name: matchedUser.name, role: matchedUser.role, email: matchedUser.email }))
    navigate('/dashboard', { replace: true })
  }

  const handleGoogleSignIn = () => {
    const authUrl = buildGoogleAuthUrl()
    window.location.assign(authUrl || 'https://accounts.google.com/signin/v2/identifier')
  }

  return (
    <main className="h-screen overflow-hidden bg-slate-100 p-3 text-slate-900 sm:p-4">
      <div className="mx-auto grid h-full max-w-[1880px] grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_390px] xl:grid-cols-[minmax(0,1fr)_410px]">
        <PlatformTemplate />

        {/* ── LOGIN PANEL ── */}
        <aside className="flex min-h-0 flex-col justify-center overflow-y-auto rounded-[2rem] border border-slate-200 bg-white px-7 py-6 text-[#08145f] shadow-xl shadow-slate-300/40">
          <EchoLogo compact />

          <div className="mt-4 text-center">
            <h2 className="text-2xl font-black text-[#08145f]">Welcome Back</h2>
            <p className="mt-1 text-sm text-slate-500">Access scan reports and AI insights.</p>
          </div>

          <button
            type="button"
            onClick={() => useDemoUser()}
            className="mt-5 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-sm font-semibold text-white shadow-md shadow-blue-300/50 transition hover:from-blue-700 hover:to-indigo-700 active:scale-[0.98]"
          >
            <ArrowRight className="h-4 w-4" />
            Use Dr Shanthi Account
          </button>

          <form className="mt-4 space-y-3" onSubmit={handleLogin}>
            <label className="block">
              <span className="text-sm font-semibold text-[#08145f]">Email Address</span>
              <span className="mt-1.5 flex h-11 items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 text-slate-400 transition-all focus-within:border-blue-400 focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-100">
                <Mail className="h-4 w-4 shrink-0 text-slate-400" />
                <input
                  type="text"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError('') }}
                  className="min-w-0 flex-1 bg-transparent text-sm text-[#08145f] outline-none placeholder:text-slate-400"
                  placeholder="Email address or username"
                  autoComplete="username"
                  required
                />
              </span>
            </label>

            <label className="block">
              <span className="text-sm font-semibold text-[#08145f]">Password</span>
              <span className="mt-1.5 flex h-11 items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 text-slate-400 transition-all focus-within:border-blue-400 focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-100">
                <Lock className="h-4 w-4 shrink-0 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError('') }}
                  className="min-w-0 flex-1 bg-transparent text-sm text-[#08145f] outline-none placeholder:text-slate-400"
                  placeholder="Password"
                  autoComplete="current-password"
                  required
                />
                <button type="button" onClick={() => setShowPassword(v => !v)} className="rounded p-1 hover:bg-slate-100 text-slate-400" aria-label="Toggle password">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </span>
            </label>

            <div className="flex items-center justify-between text-xs">
              <label className="flex cursor-pointer items-center gap-2 text-slate-600">
                <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="h-4 w-4 rounded border-slate-300 accent-blue-600" />
                Remember me
              </label>
              <button type="button" onClick={() => setError('Use the founder credentials below.')} className="font-semibold text-blue-600 hover:underline">
                Forgot Password?
              </button>
            </div>

            {error && (
              <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-600">{error}</p>
            )}

            <button type="submit" className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-blue-200 bg-blue-50 text-sm font-semibold text-blue-700 transition hover:bg-blue-100">
              <Zap className="h-4 w-4" />
              Login
            </button>
          </form>

          <div className="my-4 flex items-center gap-3 text-xs text-slate-400">
            <div className="h-px flex-1 bg-slate-200" />
            <span>or</span>
            <div className="h-px flex-1 bg-slate-200" />
          </div>

          {/* ── GOOGLE BUTTON (proper icon) ── */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            className="flex h-11 w-full items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:shadow-md active:scale-[0.98]"
          >
            {/* Official Google coloured G */}
            <svg width="18" height="18" viewBox="0 0 48 48" className="shrink-0">
              <path fill="#EA4335" d="M24 9.5c3.2 0 5.9 1.1 8.1 2.9l6-6C34.5 3.2 29.6 1 24 1 14.8 1 7 6.7 3.7 14.5l7 5.4C12.4 13.8 17.7 9.5 24 9.5z"/>
              <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v8.5h12.7c-.6 3-2.3 5.5-4.8 7.2l7.4 5.7c4.3-4 6.8-9.9 6.8-16.9z"/>
              <path fill="#FBBC05" d="M10.7 28.6A14.9 14.9 0 0 1 9.5 24c0-1.6.3-3.2.8-4.6l-7-5.4A23.9 23.9 0 0 0 0 24c0 3.9.9 7.5 2.5 10.8l8.2-6.2z"/>
              <path fill="#34A853" d="M24 47c5.9 0 10.9-1.9 14.5-5.2l-7.4-5.7c-2 1.3-4.5 2.1-7.1 2.1-6.3 0-11.6-4.2-13.5-10l-8.2 6.2C6.6 41.6 14.8 47 24 47z"/>
            </svg>
            Sign in with Google
          </button>

          {/* ── FOUNDER ACCESS CARD ── */}
          <div className="mt-4 rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 to-indigo-50 p-3.5">
            <div className="flex items-center gap-2 mb-2.5">
              <Sparkles className="h-3.5 w-3.5 text-blue-600" />
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-blue-700">Founder Access</p>
            </div>
            <button
              type="button"
              onClick={() => useDemoUser()}
              className="w-full rounded-xl border border-blue-100 bg-white px-3.5 py-3 text-left shadow-xs transition hover:border-blue-300 hover:shadow-md"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-sm font-bold text-white shadow-sm">
                  DS
                </div>
                <div>
                  <p className="text-sm font-bold text-[#08145f]">Dr Shanthi · Founder</p>
                  <p className="text-[11px] text-slate-500">dr.shanthi@echoai.com</p>
                </div>
              </div>
            </button>
          </div>
        </aside>
      </div>
    </main>
  )
}

export default Home
