import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Activity,
  ArrowRight,
  BarChart3,
  Bell,
  BrainCircuit,
  CheckCircle2,
  Clock,
  Database,
  Download,
  Eye,
  FileText,
  Image,
  Lock,
  Mail,
  Monitor,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
  User,
  Users,
  Zap,
} from 'lucide-react'

const pipelineSteps = [
  {
    number: '1',
    title: 'Connect Device',
    copy: 'Connect and collect scan data securely from devices.',
    accent: 'from-blue-500 to-cyan-400',
    hero: Monitor,
    footer: 'DICOM, HL7, FHIR, APIs, File Upload',
    items: [
      { label: 'Echo workstation', icon: Monitor },
      { label: 'Live scan stream', icon: Activity },
    ],
  },
  {
    number: '2',
    title: 'Ingest Scan Data',
    copy: 'Capture raw data, images, metadata and patient context.',
    accent: 'from-cyan-500 to-teal-400',
    hero: Database,
    footer: 'Secure and encrypted data pipeline',
    items: [
      { label: 'Raw Data', icon: Database },
      { label: 'Images', icon: Image },
      { label: 'Metadata', icon: FileText },
      { label: 'Patient Context', icon: User },
    ],
  },
  {
    number: '3',
    title: 'AI/ML Analysis',
    copy: 'Analyze data to detect patterns, anomalies and trends.',
    accent: 'from-indigo-500 to-violet-500',
    hero: BrainCircuit,
    footer: 'ML models and advanced analytics',
    items: [
      { label: 'Pattern Recognition', icon: CheckCircle2 },
      { label: 'Anomaly Detection', icon: CheckCircle2 },
      { label: 'Risk Scoring', icon: CheckCircle2 },
      { label: 'Trend Analysis', icon: CheckCircle2 },
    ],
  },
  {
    number: '4',
    title: 'LLM Reporting',
    copy: 'Generate easy-to-read reports, summaries and recommendations.',
    accent: 'from-blue-500 to-violet-500',
    hero: FileText,
    footer: 'LLM plus domain knowledge',
    items: [
      { label: 'Natural Language Summaries', icon: FileText },
      { label: 'Clinical Insights', icon: Sparkles },
      { label: 'Recommendations', icon: BarChart3 },
      { label: 'Proactive Alerts', icon: Bell },
    ],
  },
  {
    number: '5',
    title: 'Actionable Insights',
    copy: 'Deliver proactive insights to drive better decisions.',
    accent: 'from-teal-500 to-emerald-400',
    hero: TrendingUp,
    footer: 'Export and integrations',
    items: [
      { label: 'Detailed Reports', icon: FileText },
      { label: 'Trend Dashboard', icon: TrendingUp },
      { label: 'Alerts and Notifications', icon: Bell },
      { label: 'Share and Collaborate', icon: Users },
      { label: 'EHR, PACS, integrations', icon: Download },
    ],
  },
]

const benefitItems = [
  { title: 'Secure and Compliant', copy: 'Encrypted and audit-ready.', icon: ShieldCheck },
  { title: 'Save Time', copy: 'Automate reporting in minutes.', icon: Clock },
  { title: 'Improve Accuracy', copy: 'Reduce manual reporting errors.', icon: Target },
  { title: 'Proactive Care', copy: 'Identify risks earlier.', icon: BarChart3 },
  { title: 'Better Collaboration', copy: 'Share insights across care teams.', icon: Users },
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

function EchoLogo({ compact = false }) {
  return (
    <div className="flex items-center justify-center gap-4">
      <div className={`${compact ? 'h-12 w-12' : 'h-14 w-14'} relative shrink-0`}>
        <div className="absolute inset-0 rounded-full border-[5px] border-blue-400 border-r-violet-500" />
        <div className="absolute inset-2.5 rounded-full border-[4px] border-indigo-500 border-l-cyan-400" />
        <div className={`${compact ? 'absolute inset-[1.08rem]' : 'absolute inset-[1.18rem]'} rounded-full bg-gradient-to-br from-cyan-400 to-violet-500`} />
      </div>
      <div className={`font-bold tracking-normal text-[#08145f] ${compact ? 'text-4xl' : 'text-5xl'}`}>
        echo<span className="bg-gradient-to-r from-blue-500 to-violet-500 bg-clip-text text-transparent">AI</span>
      </div>
    </div>
  )
}

function Home() {
  const navigate = useNavigate()

  useEffect(() => {
    const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''))
    const accessToken = hashParams.get('access_token')
    const state = hashParams.get('state')
    const expectedState = sessionStorage.getItem('echoai_google_oauth_state')

    if (!accessToken) return
    if (expectedState && state !== expectedState) return

    localStorage.setItem('echoai_google_access_token', accessToken)
    sessionStorage.removeItem('echoai_google_oauth_state')
    window.history.replaceState({}, document.title, window.location.pathname)
    navigate('/search', { replace: true })
  }, [navigate])

  const handleGoogleSignIn = () => {
    const authUrl = buildGoogleAuthUrl()

    if (authUrl) {
      window.location.assign(authUrl)
      return
    }

    window.location.assign('https://accounts.google.com/signin/v2/identifier')
  }

  return (
    <main className="h-screen overflow-hidden bg-[#f6f9ff] px-3 py-3 text-[#07135d] sm:px-4">
      <div className="mx-auto grid h-full max-w-[1880px] grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_390px] xl:grid-cols-[minmax(0,1fr)_430px] 2xl:grid-cols-[minmax(0,1fr)_460px]">
        <section className="hidden min-h-0 min-w-0 flex-col lg:flex">
          <div className="mb-3 text-center">
            <EchoLogo />
            <h1 className="mt-2 text-xl font-bold tracking-normal">
              From Scan Data to Proactive Insights
            </h1>
            <p className="mt-1 text-sm text-slate-700">
              Leverage AI/ML and LLM to turn device scan data into actionable reports.
            </p>
          </div>

          <div className="grid min-h-0 flex-1 grid-cols-5 gap-3">
            {pipelineSteps.map((step, index) => {
              const HeroIcon = step.hero

              return (
                <div
                  key={step.title}
                  className="relative flex min-h-0 flex-col rounded-2xl border border-blue-100 bg-white/90 p-3 shadow-sm"
                >
                  {index < pipelineSteps.length - 1 && (
                    <ArrowRight className="absolute -right-4 top-[52%] z-10 h-6 w-6 -translate-y-1/2 text-blue-600" />
                  )}
                  <div className="flex min-h-[42px] items-center gap-2">
                    <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${step.accent} text-sm font-bold text-white shadow-md`}>
                      {step.number}
                    </span>
                    <h2 className="min-w-0 flex-1 text-sm font-bold leading-tight tracking-normal">{step.title}</h2>
                    <HeroIcon className="h-5 w-5 shrink-0 text-blue-500" />
                  </div>
                  <p className="mt-3 min-h-[58px] text-center text-xs font-medium leading-5 text-slate-700">
                    {step.copy}
                  </p>
                  <div className="mt-2 grid min-h-0 content-start gap-1.5">
                    {step.items.map(({ label, icon: Icon }) => (
                      <div key={label} className="flex min-h-[32px] items-center gap-2 rounded-lg border border-blue-100 bg-white px-2.5 py-1.5 text-[10px] font-semibold leading-tight shadow-sm">
                        <Icon className="h-4 w-4 shrink-0 text-blue-500" />
                        <span>{label}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-auto flex min-h-[46px] items-center justify-center rounded-xl border border-blue-200 bg-gradient-to-br from-blue-50 to-cyan-50 px-3 py-2 text-center text-xs font-bold leading-tight">
                    {step.footer}
                  </div>
                </div>
              )
            })}
          </div>

          <section className="mt-3 rounded-2xl border border-blue-100 bg-white px-5 py-3 shadow-sm">
            <div className="mb-3 flex items-center gap-5">
              <div className="h-px flex-1 bg-slate-200" />
              <h2 className="text-lg font-bold tracking-normal">Why echoAI?</h2>
              <div className="h-px flex-1 bg-slate-200" />
            </div>
            <div className="grid grid-cols-5 gap-4">
              {benefitItems.map(({ title, copy, icon: Icon }) => (
                <div key={title} className="flex items-center gap-3">
                  <Icon className="h-9 w-9 shrink-0 text-blue-500" />
                  <div>
                    <h3 className="text-xs font-bold text-blue-700">{title}</h3>
                    <p className="mt-1 text-[11px] leading-4 text-slate-700">{copy}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </section>

        <aside className="flex min-h-0 flex-col justify-center overflow-hidden rounded-[1.5rem] border border-blue-100 bg-white px-7 py-6 shadow-xl shadow-blue-100/70">
          <EchoLogo compact />
          <div className="mt-6 text-center">
            <h2 className="text-2xl font-bold tracking-normal">Welcome Back</h2>
            <p className="mt-2 text-sm text-slate-600">Access scan reports and AI insights.</p>
          </div>

          <button
            type="button"
            onClick={() => navigate('/search')}
            className="mt-5 flex h-12 w-full items-center justify-center gap-3 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 text-base font-semibold text-white shadow-lg shadow-violet-200 transition hover:from-blue-700 hover:to-violet-700"
          >
            <ArrowRight className="h-5 w-5" />
            Go to Application
          </button>

          <form
            className="mt-5 space-y-4"
            onSubmit={(event) => {
              event.preventDefault()
              navigate('/search')
            }}
          >
            <label className="block">
              <span className="text-sm font-semibold">Email Address</span>
              <span className="mt-2 flex h-12 items-center gap-3 rounded-xl border border-slate-300 px-4 text-slate-500">
                <Mail className="h-5 w-5" />
                <input
                  type="email"
                  className="min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-slate-400"
                  placeholder="you@example.com"
                />
              </span>
            </label>

            <label className="block">
              <span className="text-sm font-semibold">Password</span>
              <span className="mt-2 flex h-12 items-center gap-3 rounded-xl border border-slate-300 px-4 text-slate-500">
                <Lock className="h-5 w-5" />
                <input
                  type="password"
                  className="min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-slate-400"
                  placeholder="Password"
                />
                <Eye className="h-5 w-5" />
              </span>
            </label>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-3 text-slate-700">
                <input type="checkbox" className="h-5 w-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                <span>Remember me</span>
              </label>
              <button type="button" className="font-semibold text-blue-600">Forgot Password?</button>
            </div>

            <button
              type="submit"
              className="flex h-12 w-full items-center justify-center gap-3 rounded-xl border border-blue-200 bg-blue-50 text-base font-semibold text-blue-700 transition hover:bg-blue-100"
            >
              <Zap className="h-5 w-5" />
              Login
            </button>
          </form>

          <div className="mt-5 flex items-center gap-5 text-sm text-slate-500">
            <div className="h-px flex-1 bg-slate-200" />
            <span>or</span>
            <div className="h-px flex-1 bg-slate-200" />
          </div>

          <button
            type="button"
            onClick={handleGoogleSignIn}
            className="mt-5 flex h-12 w-full items-center justify-center gap-3 rounded-xl border border-slate-300 bg-white text-base font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            <span className="text-lg font-bold text-blue-600">G</span>
            Sign in with Google
          </button>
        </aside>
      </div>
    </main>
  )
}

export default Home
