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

function EchoLogo({ compact = false }) {
  return (
    <div className="flex items-center justify-center gap-4">
      <div className={`${compact ? 'h-14 w-14' : 'h-20 w-20'} relative shrink-0`}>
        <div className="absolute inset-0 rounded-full border-[6px] border-blue-400 border-r-violet-500" />
        <div className="absolute inset-3 rounded-full border-[5px] border-indigo-500 border-l-cyan-400" />
        <div className="absolute inset-[1.35rem] rounded-full bg-gradient-to-br from-cyan-400 to-violet-500" />
      </div>
      <div className={`font-bold tracking-normal text-[#08145f] ${compact ? 'text-5xl' : 'text-7xl'}`}>
        echo<span className="bg-gradient-to-r from-blue-500 to-violet-500 bg-clip-text text-transparent">AI</span>
      </div>
    </div>
  )
}

function Home() {
  const navigate = useNavigate()

  return (
    <main className="min-h-screen overflow-auto bg-[#f6f9ff] px-4 py-4 text-[#07135d] sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-[1880px] grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_500px]">
        <section className="min-w-0">
          <div className="mb-8 text-center">
            <EchoLogo />
            <h1 className="mt-3 text-2xl font-bold tracking-normal sm:text-3xl">
              From Scan Data to Proactive Insights
            </h1>
            <p className="mt-2 text-lg text-slate-700">
              Leverage AI/ML and LLM to turn device scan data into actionable reports.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-5">
            {pipelineSteps.map((step, index) => (
              <div
                key={step.title}
                className="relative flex min-h-[575px] flex-col rounded-3xl border border-blue-100 bg-white/90 p-5 shadow-sm"
              >
                {index < pipelineSteps.length - 1 && (
                  <ArrowRight className="absolute -right-5 top-1/2 z-10 hidden h-8 w-8 -translate-y-1/2 text-blue-600 xl:block" />
                )}
                <div className="flex items-center gap-3">
                  <span className={`flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br ${step.accent} text-base font-bold text-white shadow-md`}>
                    {step.number}
                  </span>
                  <h2 className="text-lg font-bold tracking-normal">{step.title}</h2>
                </div>
                <p className="mt-5 min-h-[72px] text-center text-sm font-medium leading-6 text-slate-700">
                  {step.copy}
                </p>
                <div className="mt-4 flex flex-1 flex-col justify-center gap-3">
                  {step.title === 'AI/ML Analysis' && (
                    <div className="mx-auto mb-4 flex h-36 w-36 items-center justify-center rounded-full border border-dashed border-violet-300 bg-violet-50">
                      <BrainCircuit className="h-20 w-20 text-violet-600" />
                    </div>
                  )}
                  {step.items.map(({ label, icon: Icon }) => (
                    <div key={label} className="flex min-h-[58px] items-center gap-4 rounded-xl border border-blue-100 bg-white px-4 py-3 text-sm font-semibold shadow-sm">
                      <Icon className="h-6 w-6 shrink-0 text-blue-500" />
                      <span>{label}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-5 rounded-xl border border-blue-200 bg-gradient-to-br from-blue-50 to-cyan-50 px-4 py-4 text-center text-sm font-bold">
                  {step.footer}
                </div>
              </div>
            ))}
          </div>

          <section className="mt-8 rounded-3xl border border-blue-100 bg-white px-8 py-6 shadow-sm">
            <div className="mb-4 flex items-center gap-5">
              <div className="h-px flex-1 bg-slate-200" />
              <h2 className="text-xl font-bold tracking-normal">Why echoAI?</h2>
              <div className="h-px flex-1 bg-slate-200" />
            </div>
            <div className="grid grid-cols-1 gap-5 md:grid-cols-5">
              {benefitItems.map(({ title, copy, icon: Icon }) => (
                <div key={title} className="flex items-center gap-4">
                  <Icon className="h-12 w-12 shrink-0 text-blue-500" />
                  <div>
                    <h3 className="text-sm font-bold text-blue-700">{title}</h3>
                    <p className="mt-1 text-xs leading-5 text-slate-700">{copy}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </section>

        <aside className="self-start rounded-[2rem] border border-blue-100 bg-white px-10 py-14 shadow-xl shadow-blue-100/70 lg:sticky lg:top-4">
          <EchoLogo compact />
          <div className="mt-10 text-center">
            <h2 className="text-3xl font-bold tracking-normal">Welcome Back</h2>
            <p className="mt-3 text-base text-slate-600">Access scan reports and AI insights.</p>
          </div>

          <button
            type="button"
            onClick={() => navigate('/search')}
            className="mt-8 flex h-16 w-full items-center justify-center gap-3 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 text-lg font-semibold text-white shadow-lg shadow-violet-200 transition hover:from-blue-700 hover:to-violet-700"
          >
            <ArrowRight className="h-5 w-5" />
            Go to Application
          </button>

          <form
            className="mt-8 space-y-6"
            onSubmit={(event) => {
              event.preventDefault()
              navigate('/search')
            }}
          >
            <label className="block">
              <span className="text-sm font-semibold">Email Address</span>
              <span className="mt-3 flex h-16 items-center gap-4 rounded-xl border border-slate-300 px-5 text-slate-500">
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
              <span className="mt-3 flex h-16 items-center gap-4 rounded-xl border border-slate-300 px-5 text-slate-500">
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
              className="flex h-14 w-full items-center justify-center gap-3 rounded-xl border border-blue-200 bg-blue-50 text-base font-semibold text-blue-700 transition hover:bg-blue-100"
            >
              <Zap className="h-5 w-5" />
              Login
            </button>
          </form>

          <div className="mt-8 flex items-center gap-5 text-sm text-slate-500">
            <div className="h-px flex-1 bg-slate-200" />
            <span>or</span>
            <div className="h-px flex-1 bg-slate-200" />
          </div>

          <button
            type="button"
            className="mt-8 flex h-14 w-full items-center justify-center gap-3 rounded-xl border border-slate-300 bg-white text-base font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            <span className="text-lg font-bold text-blue-600">G</span>
            Sign in with Google
          </button>

          <p className="mt-8 text-center text-sm text-slate-600">
            Don't have an account? <button type="button" className="font-semibold text-blue-600">Request Access</button>
          </p>
        </aside>
      </div>
    </main>
  )
}

export default Home
