import { useState, useEffect, useMemo, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  User,
  Mail,
  Phone,
  MapPin,
  Award,
  FileSignature,
  Stethoscope,
  Activity,
  Calendar,
  ShieldCheck,
  Edit3,
  Save,
  ArrowLeft,
  CheckCircle2,
  Clock,
  Sparkles,
  Building,
  GraduationCap,
  FileCheck2,
  Heart,
  Check,
  AlertCircle,
  ExternalLink,
  Copy,
  Printer,
  Share2,
  Camera,
  Layers,
  BarChart3,
  BadgeCheck,
  FileText,
  Users,
  TrendingUp,
  Download,
  Eye,
  X,
  HeartPulse,
} from 'lucide-react'

export const DEFAULT_DOCTOR_PROFILE = {
  name: 'Dr. Sarah Shanthi',
  initials: 'DS',
  degrees: 'MD, DM (Cardiology), FACC',
  designation: 'Senior Consultant Cardiologist & Head of Echocardiography',
  department: 'Non-Invasive Cardiovascular Imaging & Fetal Echo',
  hospital: 'echoAI Heart & Vascular Institute & Research Center',
  registrationNo: 'TN-MC-84920',
  council: 'Tamil Nadu Medical Council & National Medical Commission',
  email: 'dr.sarah@echoai.com',
  phone: '+91 98401 23456',
  altPhone: '+91 44 2833 4455',
  room: 'Consultation Suite 402, Imaging Block A',
  experience: '14+ Years Clinical Experience',
  opdHours: 'Mon – Sat: 08:30 AM – 04:30 PM',
  status: 'Active / On Clinical Duty',
  avatarType: 'photo', // 'photo' or 'initials'
  avatarUrl: '/dr_shanthi_portrait.jpg',
  bio: 'Senior Consultant Cardiologist specializing in advanced adult transthoracic echocardiography (TTE), complex congenital pediatric anomalies, and fetal cardiac hemodynamics. Directs clinical echocardiography reporting protocols and oversees AI diagnostic validation models at echoAI.',
  specializations: [
    { title: 'Adult Transthoracic Echocardiography (TTE)', level: 'Level 3 Expert' },
    { title: 'Pediatric & Congenital Heart Anomalies', level: 'Senior Specialist' },
    { title: 'Fetal Echocardiography & Cardiac Malformations', level: 'PNDT Certified' },
    { title: 'Speckle Tracking & Global Longitudinal Strain (GLS)', level: 'Advanced' },
    { title: '3D Transesophageal Echocardiography (TEE)', level: 'Proceduralist' },
    { title: 'Valvular Hemodynamics & Regurgitation Quantitation', level: 'Expert Reviewer' },
  ],
  qualifications: [
    {
      degree: 'DM (Cardiology)',
      institution: 'Sri Ramachandra Institute of Higher Education & Research',
      year: '2017',
      honors: 'Gold Medalist & Best Outgoing Resident',
    },
    {
      degree: 'Fellowship in Fetal & Pediatric Cardiology',
      institution: 'Royal Brompton & Harefield NHS Foundation Trust, London, UK',
      year: '2019',
      honors: 'Advanced Congenital Imaging Fellow',
    },
    {
      degree: 'MD (General Medicine)',
      institution: 'All India Institute of Medical Sciences (AIIMS), New Delhi',
      year: '2014',
      honors: 'Distinction in Internal Medicine',
    },
    {
      degree: 'MBBS',
      institution: 'Madras Medical College, Chennai',
      year: '2010',
      honors: 'University Top 5 Rank Holder',
    },
  ],
  memberships: [
    { name: 'American College of Cardiology (FACC)', role: 'Fellow' },
    { name: 'Cardiological Society of India (CSI)', role: 'Life Member' },
    { name: 'American Society of Echocardiography (ASE)', role: 'International Fellow' },
    { name: 'Indian Academy of Echocardiography (IAE)', role: 'Executive Member' },
  ],
  publications: [
    {
      title: 'Speckle Tracking Echocardiography in Subclinical Myocardial Dysfunction: A Multicenter Evaluation',
      journal: 'Journal of the American Society of Echocardiography',
      year: '2023',
    },
    {
      title: 'Automated AI Doppler Envelope Tracing in Severe Aortic Stenosis: Concordance with Expert Cardiologists',
      journal: 'Indian Heart Journal',
      year: '2022',
    },
  ],
  stats: {
    scansReported: 1428,
    reportsSigned: 1390,
    aiAgreement: '98.4%',
    patientsUnderCare: 101,
    avgTurnaroundMin: 14,
  },
}

export const PROFILE_STORAGE_KEY = 'echoai_doctor_profile'

export default function Profile() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('overview')
  const [profile, setProfile] = useState(() => {
    try {
      const saved = localStorage.getItem(PROFILE_STORAGE_KEY)
      if (saved) {
        return { ...DEFAULT_DOCTOR_PROFILE, ...JSON.parse(saved) }
      }
    } catch (e) {
      console.error('Failed to load profile', e)
    }
    return DEFAULT_DOCTOR_PROFILE
  })

  const [formData, setFormData] = useState(profile)
  const [showToast, setShowToast] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const [copiedField, setCopiedField] = useState(null)
  const [signatureInk, setSignatureInk] = useState('#08145f')
  const [isPreviewReportOpen, setIsPreviewReportOpen] = useState(false)
  const [isDossierModalOpen, setIsDossierModalOpen] = useState(false)
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false)

  // Sync form data if profile changes
  useEffect(() => {
    setFormData(profile)
  }, [profile])

  const copyToClipboard = (text, fieldName) => {
    navigator.clipboard.writeText(text)
    setCopiedField(fieldName)
    setToastMessage(`Copied ${fieldName} to clipboard!`)
    setShowToast(true)
    setTimeout(() => {
      setCopiedField(null)
      setShowToast(false)
    }, 2500)
  }

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleStatusChange = (newStatus) => {
    const updated = { ...profile, status: newStatus }
    setProfile(updated)
    setFormData((prev) => ({ ...prev, status: newStatus }))
    try {
      localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(updated))
      window.dispatchEvent(new Event('doctor_profile_updated'))
    } catch (e) {}
    setIsStatusDropdownOpen(false)
    setToastMessage(`Status updated to: ${newStatus}`)
    setShowToast(true)
    setTimeout(() => setShowToast(false), 2500)
  }

  const handleToggleAvatar = () => {
    const nextType = profile.avatarType === 'photo' ? 'initials' : 'photo'
    const updated = { ...profile, avatarType: nextType }
    setProfile(updated)
    setFormData((prev) => ({ ...prev, avatarType: nextType }))
    try {
      localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(updated))
      window.dispatchEvent(new Event('doctor_profile_updated'))
    } catch (e) {}
    setToastMessage(`Switched avatar to: ${nextType === 'photo' ? 'Portrait Photo' : 'Monogram Initials'}`)
    setShowToast(true)
    setTimeout(() => setShowToast(false), 2500)
  }

  const handleSaveProfile = (e) => {
    e.preventDefault()

    // Calculate initials if not provided
    let calculatedInitials = formData.initials?.trim()
    if (!calculatedInitials) {
      const cleanName = formData.name.replace(/^Dr\.?\s*/i, '').trim()
      const parts = cleanName.split(/\s+/)
      if (parts.length >= 2) {
        calculatedInitials = (parts[0][0] + parts[1][0]).toUpperCase()
      } else if (parts.length === 1 && parts[0].length > 0) {
        calculatedInitials = ('D' + parts[0][0]).toUpperCase()
      } else {
        calculatedInitials = 'DS'
      }
    }

    const updated = {
      ...formData,
      initials: calculatedInitials,
    }

    setProfile(updated)

    try {
      // 1. Primary profile storage
      localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(updated))

      // 2. Backward compatibility with doctorProfile (used by Adult, Pediatric & Fetal echo reports)
      localStorage.setItem(
        'doctorProfile',
        JSON.stringify({
          name: updated.name,
          degree: updated.degrees,
          registration_no: updated.registrationNo,
          department: updated.department,
          hospital: updated.hospital,
        })
      )

      // 3. User session sync
      const storedUser = localStorage.getItem('echoai_user') || sessionStorage.getItem('echoai_user')
      let userObj = {}
      if (storedUser) {
        try {
          userObj = JSON.parse(storedUser)
        } catch (err) {}
      }
      const updatedUser = {
        ...userObj,
        name: updated.name,
        email: updated.email,
        initials: updated.initials,
      }
      localStorage.setItem('echoai_user', JSON.stringify(updatedUser))

      // 4. Broadcast update to Layout and all open report tabs
      window.dispatchEvent(new Event('doctor_profile_updated'))

      setToastMessage('Doctor Profile & Clinical Credentials saved successfully!')
      setShowToast(true)
      setTimeout(() => setShowToast(false), 3500)
      setActiveTab('overview')
    } catch (err) {
      console.error('Failed to save doctor profile', err)
    }
  }

  const handlePrintDossier = () => {
    window.print()
  }

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      {/* Toast Notification */}
      {showToast && (
        <div className="fixed top-6 right-6 z-50 flex items-center gap-3 rounded-2xl bg-teal-900/95 backdrop-blur-md px-5 py-3.5 text-white shadow-2xl border border-teal-500/40 animate-in slide-in-from-top-4 duration-200">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500/30 text-emerald-300">
            <Check className="h-4 w-4" />
          </div>
          <span className="text-sm font-semibold tracking-wide">{toastMessage}</span>
        </div>
      )}

      {/* Top Header & Breadcrumb Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-xs hover:border-teal-200 hover:bg-teal-50/50 hover:text-teal-800 transition cursor-pointer"
            title="Back to Dashboard"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
              <span
                onClick={() => navigate('/dashboard')}
                className="cursor-pointer hover:text-slate-900 transition flex items-center gap-1"
              >
                <span>Dashboard</span>
              </span>
              <span className="text-slate-300">/</span>
              <span className="text-teal-700 font-semibold flex items-center gap-1">
                <Stethoscope className="h-3 w-3" />
                <span>Doctor Profile</span>
              </span>
            </div>
            <h1 className="text-xl font-extrabold tracking-tight text-slate-900 mt-0.5 flex items-center gap-2">
              Doctor Profile & Clinical Credentials
              <span className="rounded-full bg-teal-50 px-2.5 py-0.5 text-xs font-bold text-teal-700 border border-teal-200">
                Verified Faculty
              </span>
            </h1>
          </div>
        </div>

        {/* Action Buttons Toolbar */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => copyToClipboard(window.location.href, 'Profile URL')}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 hover:border-slate-300 transition cursor-pointer"
            title="Share or copy profile link"
          >
            <Share2 className="h-3.5 w-3.5 text-slate-500" />
            <span>Share</span>
          </button>

          <button
            type="button"
            onClick={() => setIsDossierModalOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 hover:border-slate-300 transition cursor-pointer"
            title="Generate Official Credential Dossier / CV"
          >
            <Printer className="h-3.5 w-3.5 text-slate-500" />
            <span>Export Dossier</span>
          </button>

          {activeTab === 'edit' ? (
            <button
              type="button"
              onClick={() => setActiveTab('overview')}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-700 shadow-xs hover:bg-slate-50 transition cursor-pointer"
            >
              <Eye className="h-3.5 w-3.5 text-slate-500" />
              <span>View Profile</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setActiveTab('edit')}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-teal-700 to-emerald-700 px-4 py-2 text-xs font-bold text-white shadow-sm hover:from-teal-800 hover:to-emerald-800 transition cursor-pointer"
            >
              <Edit3 className="h-3.5 w-3.5" />
              <span>Edit Doctor Profile</span>
            </button>
          )}
        </div>
      </div>

      {/* Doctor Master Hero Card */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-200/90 bg-white shadow-md">
        {/* Banner with Deep Medical Gradient & ECG Wave */}
        <div className="relative h-44 bg-gradient-to-r from-[#062420] via-[#094139] to-[#0d2d47] p-6 text-white overflow-hidden">
          {/* Subtle Ambient Radial Glows */}
          <div className="absolute -left-20 -top-20 h-64 w-64 rounded-full bg-teal-400/10 blur-3xl pointer-events-none"></div>
          <div className="absolute right-10 top-0 h-64 w-64 rounded-full bg-blue-500/10 blur-3xl pointer-events-none"></div>

          {/* Animated Cardiac Rhythm / ECG Path */}
          <svg
            className="absolute inset-0 h-full w-full opacity-20 pointer-events-none"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 1200 140"
            preserveAspectRatio="none"
          >
            <path
              d="M0,70 L240,70 L260,20 L280,120 L300,35 L320,95 L340,70 L720,70 L740,15 L760,125 L780,30 L800,90 L820,70 L1200,70"
              fill="none"
              stroke="#2dd4bf"
              strokeWidth="2.5"
              strokeDasharray="12 4"
            />
          </svg>

          {/* Status Badge Dropdown at top right */}
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-teal-500/20 px-3 py-1 text-[11px] font-bold text-teal-200 border border-teal-400/30 backdrop-blur-md">
                <HeartPulse className="h-3.5 w-3.5 text-teal-300 animate-pulse" />
                <span>Cardiology & Non-Invasive Echo Division</span>
              </span>
            </div>

            <div className="relative">
              <button
                type="button"
                onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
                className="inline-flex items-center gap-2 rounded-full bg-slate-900/60 backdrop-blur-md px-3.5 py-1.5 text-xs font-bold text-white border border-white/20 hover:bg-slate-900/80 transition cursor-pointer"
              >
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 ring-4 ring-emerald-400/30 animate-pulse"></span>
                <span>{profile.status}</span>
                <span className="text-white/60 text-[10px]">▼</span>
              </button>

              {isStatusDropdownOpen && (
                <div className="absolute right-0 mt-2 w-52 rounded-2xl bg-white p-1.5 text-slate-800 shadow-2xl border border-slate-200 z-50 animate-in fade-in-50 zoom-in-95">
                  <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Clinical Duty Status
                  </div>
                  {[
                    'Active / On Clinical Duty',
                    'In Procedure / Echo Suite A',
                    'OPD Consultation Hours',
                    'Reporting / Tele-Echo Review',
                    'Off Duty / On Call',
                  ].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => handleStatusChange(s)}
                      className={`flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold transition ${
                        profile.status === s
                          ? 'bg-teal-50 text-teal-800 font-bold'
                          : 'hover:bg-slate-100 text-slate-700'
                      }`}
                    >
                      <span
                        className={`h-2 w-2 rounded-full ${
                          s.includes('Active') || s.includes('OPD')
                            ? 'bg-emerald-500'
                            : s.includes('Procedure')
                            ? 'bg-amber-500'
                            : 'bg-slate-400'
                        }`}
                      ></span>
                      <span>{s}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Profile Info Row on Crisp White Background */}
        <div className="px-6 pb-6 pt-3">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            {/* Avatar & Core Bio */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-5">
              {/* Doctor Avatar Box with Portrait / Monogram toggle - only avatar pops up with -mt-20 */}
              <div className="-mt-20 group relative flex h-32 w-32 shrink-0 items-center justify-center rounded-3xl bg-gradient-to-br from-teal-800 to-slate-900 text-3xl font-black text-white shadow-2xl ring-4 ring-white overflow-hidden">
                {profile.avatarType === 'photo' && profile.avatarUrl ? (
                  <img
                    src={profile.avatarUrl}
                    alt={profile.name}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    onError={() => handleToggleAvatar()}
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center">
                    <span className="tracking-tight text-3xl font-black text-teal-100">
                      {profile.initials || 'DS'}
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-teal-300/80 mt-1">
                      Faculty
                    </span>
                  </div>
                )}

                {/* Avatar Switcher Button (hover or click) */}
                <button
                  type="button"
                  onClick={handleToggleAvatar}
                  className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/70 opacity-0 group-hover:opacity-100 transition-opacity text-white text-xs font-bold gap-1 cursor-pointer"
                  title="Toggle between portrait photo and initials"
                >
                  <Camera className="h-5 w-5" />
                  <span>Toggle Photo</span>
                </button>

                {/* Verified Medical Checkmark badge */}
                <div
                  className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-2xl bg-teal-600 text-white ring-4 ring-white shadow-sm"
                  title="Verified echoAI Cardiologist & PNDT Practitioner"
                >
                  <ShieldCheck className="h-5 w-5" />
                </div>
              </div>

              {/* Doctor Identity & Titles - 100% on pure white background for maximum crisp readability */}
              <div className="space-y-1.5 pt-1">
                <div className="flex flex-wrap items-center gap-2.5">
                  <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                    {profile.name}
                    <BadgeCheck className="h-6 w-6 text-teal-600 inline shrink-0" />
                  </h2>
                  <span className="rounded-xl bg-teal-50 border border-teal-200 px-3 py-1 text-xs font-extrabold text-teal-800 shadow-2xs">
                    {profile.degrees}
                  </span>
                </div>

                <p className="text-sm font-bold text-slate-700 flex flex-wrap items-center gap-2">
                  <span>{profile.designation}</span>
                  <span className="text-slate-300">•</span>
                  <span className="text-xs font-semibold text-slate-500">{profile.experience}</span>
                </p>

                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 pt-0.5">
                  <span className="flex items-center gap-1.5 font-medium text-slate-700">
                    <Building className="h-3.5 w-3.5 text-teal-600" />
                    <span>{profile.hospital}</span>
                  </span>
                  <span>•</span>
                  <span
                    onClick={() => copyToClipboard(profile.registrationNo, 'Medical Reg. No')}
                    className="inline-flex items-center gap-1 font-mono font-bold text-slate-800 hover:text-teal-700 transition cursor-pointer bg-slate-100 px-2 py-0.5 rounded-lg"
                    title="Click to copy registration number"
                  >
                    <span>Reg: {profile.registrationNo}</span>
                    <Copy className="h-3 w-3 text-slate-400" />
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Contact Chips on Right */}
            <div className="flex flex-wrap lg:flex-col items-start lg:items-end gap-2 text-xs">
              <a
                href={`mailto:${profile.email}`}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200/90 bg-slate-50 px-3 py-1.5 font-medium text-slate-700 hover:bg-teal-50 hover:border-teal-200 hover:text-teal-900 transition"
              >
                <Mail className="h-3.5 w-3.5 text-teal-600" />
                <span className="font-semibold">{profile.email}</span>
              </a>
              <a
                href={`tel:${profile.phone}`}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200/90 bg-slate-50 px-3 py-1.5 font-medium text-slate-700 hover:bg-teal-50 hover:border-teal-200 hover:text-teal-900 transition"
              >
                <Phone className="h-3.5 w-3.5 text-teal-600" />
                <span className="font-semibold">{profile.phone}</span>
              </a>
              <div className="inline-flex items-center gap-1.5 text-slate-500 px-1 text-[11px]">
                <MapPin className="h-3 w-3 text-slate-400" />
                <span>{profile.room}</span>
              </div>
            </div>
          </div>

          {/* Clinical KPIs & Performance Metric Cards (5 Cards) */}
          <div className="mt-6 grid grid-cols-2 gap-3.5 sm:grid-cols-3 lg:grid-cols-5 border-t border-slate-100 pt-5">
            {/* 1. Scans Evaluated */}
            <div className="group rounded-2xl border border-slate-100 bg-gradient-to-br from-slate-50 to-teal-50/20 p-4 transition hover:border-teal-200 hover:shadow-xs">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
                <span className="flex items-center gap-1.5">
                  <Activity className="h-4 w-4 text-teal-600" />
                  <span>Scans Evaluated</span>
                </span>
                <span className="text-[10px] font-bold text-teal-700 bg-teal-100/60 px-1.5 py-0.5 rounded">
                  +18 /wk
                </span>
              </div>
              <p className="mt-2 text-2xl font-black text-slate-900 tracking-tight">
                {profile.stats?.scansReported?.toLocaleString() || '1,428'}
              </p>
              <div className="mt-1 flex items-center gap-1 text-[11px] font-semibold text-teal-700">
                <TrendingUp className="h-3 w-3" />
                <span>All time volume</span>
              </div>
            </div>

            {/* 2. Reports Signed */}
            <div className="group rounded-2xl border border-slate-100 bg-gradient-to-br from-slate-50 to-blue-50/20 p-4 transition hover:border-blue-200 hover:shadow-xs">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
                <span className="flex items-center gap-1.5">
                  <FileCheck2 className="h-4 w-4 text-blue-600" />
                  <span>Reports Signed</span>
                </span>
                <span className="text-[10px] font-bold text-blue-700 bg-blue-100/60 px-1.5 py-0.5 rounded">
                  97.3%
                </span>
              </div>
              <p className="mt-2 text-2xl font-black text-slate-900 tracking-tight">
                {profile.stats?.reportsSigned?.toLocaleString() || '1,390'}
              </p>
              <p className="mt-1 text-[11px] font-semibold text-blue-700">Certified Digital Sign-off</p>
            </div>

            {/* 3. AI Concordance */}
            <div className="group rounded-2xl border border-slate-100 bg-gradient-to-br from-slate-50 to-purple-50/20 p-4 transition hover:border-purple-200 hover:shadow-xs">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
                <span className="flex items-center gap-1.5">
                  <Sparkles className="h-4 w-4 text-purple-600" />
                  <span>AI Concordance</span>
                </span>
                <span className="text-[10px] font-bold text-purple-700 bg-purple-100/60 px-1.5 py-0.5 rounded">
                  DeepVision
                </span>
              </div>
              <p className="mt-2 text-2xl font-black text-slate-900 tracking-tight">
                {profile.stats?.aiAgreement || '98.4%'}
              </p>
              <p className="mt-1 text-[11px] font-semibold text-purple-700">High diagnostic match</p>
            </div>

            {/* 4. Active Patients */}
            <div className="group rounded-2xl border border-slate-100 bg-gradient-to-br from-slate-50 to-rose-50/20 p-4 transition hover:border-rose-200 hover:shadow-xs">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
                <span className="flex items-center gap-1.5">
                  <Heart className="h-4 w-4 text-rose-600" />
                  <span>Active Patients</span>
                </span>
                <span className="text-[10px] font-bold text-rose-700 bg-rose-100/60 px-1.5 py-0.5 rounded">
                  Active
                </span>
              </div>
              <p className="mt-2 text-2xl font-black text-slate-900 tracking-tight">
                {profile.stats?.patientsUnderCare || '101'}
              </p>
              <p className="mt-1 text-[11px] font-semibold text-rose-700">In Clinical Registry</p>
            </div>

            {/* 5. Avg Turnaround Time */}
            <div className="col-span-2 sm:col-span-1 group rounded-2xl border border-slate-100 bg-gradient-to-br from-slate-50 to-amber-50/20 p-4 transition hover:border-amber-200 hover:shadow-xs">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
                <span className="flex items-center gap-1.5">
                  <Clock className="h-4 w-4 text-amber-600" />
                  <span>Sign-off Speed</span>
                </span>
                <span className="text-[10px] font-bold text-amber-700 bg-amber-100/60 px-1.5 py-0.5 rounded">
                  NABH &lt;30m
                </span>
              </div>
              <p className="mt-2 text-2xl font-black text-slate-900 tracking-tight">
                {profile.stats?.avgTurnaroundMin || 14} <span className="text-sm font-bold text-slate-500">mins</span>
              </p>
              <p className="mt-1 text-[11px] font-semibold text-emerald-700">✓ Exceeds benchmark</p>
            </div>
          </div>
        </div>
      </div>

      {/* Segmented Navigation Tabs Toolbar */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3">
        {[
          { id: 'overview', label: 'Overview & Practice', icon: Stethoscope },
          { id: 'credentials', label: 'Credentials & Education', icon: GraduationCap },
          { id: 'signature', label: 'Digital Signature & Stamp', icon: FileSignature },
          { id: 'analytics', label: 'Caseload & Analytics', icon: BarChart3 },
          { id: 'edit', label: 'Edit Profile', icon: Edit3 },
        ].map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition cursor-pointer ${
                isActive
                  ? 'bg-teal-700 text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200/90 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <Icon className={`h-4 w-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
              <span>{tab.label}</span>
            </button>
          )
        })}
      </div>

      {/* TAB 1: OVERVIEW & PRACTICE */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 animate-in fade-in duration-200">
          {/* Main 2-Column Section */}
          <div className="lg:col-span-2 space-y-6">
            {/* Clinical Practice Summary */}
            <div className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Stethoscope className="h-4 w-4 text-teal-700" />
                  <span>Clinical Practice Summary & Scope</span>
                </h3>
                <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold text-slate-600">
                  Cardiology Department
                </span>
              </div>
              <p className="text-sm leading-relaxed text-slate-600 font-normal">{profile.bio}</p>

              {/* Core Echocardiography Competencies */}
              <div className="mt-6 border-t border-slate-100 pt-5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3.5 flex items-center justify-between">
                  <span>Core Echocardiography Competencies</span>
                  <span className="text-[11px] text-teal-700 font-semibold lowercase">
                    {profile.specializations.length} certified domains
                  </span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {profile.specializations.map((spec, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between rounded-xl border border-slate-200/80 bg-slate-50/70 px-3.5 py-2.5 text-xs text-slate-800 transition hover:bg-white hover:border-teal-200 hover:shadow-2xs"
                    >
                      <div className="flex items-center gap-2 font-semibold">
                        <CheckCircle2 className="h-4 w-4 text-teal-600 shrink-0" />
                        <span>{typeof spec === 'string' ? spec : spec.title}</span>
                      </div>
                      {typeof spec === 'object' && spec.level && (
                        <span className="ml-2 rounded-md bg-teal-100/70 px-2 py-0.5 text-[10px] font-bold text-teal-800 shrink-0">
                          {spec.level}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Department & Diagnostic Facility Facilities */}
            <div className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-xs">
              <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Building className="h-4 w-4 text-teal-700" />
                <span>Department & Clinical Facility</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Primary Department
                  </span>
                  <p className="text-sm font-bold text-slate-900 mt-1">{profile.department}</p>
                  <p className="text-xs text-slate-500 mt-0.5">Cardiovascular Sciences Division</p>
                </div>

                <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Consultation Suite & Lab
                  </span>
                  <p className="text-sm font-bold text-slate-900 mt-1">{profile.room}</p>
                  <p className="text-xs text-slate-500 mt-0.5">High-Resolution Echo Imaging Lab A</p>
                </div>

                <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Medical Council Licensure
                  </span>
                  <p className="text-sm font-mono font-bold text-slate-900 mt-1">
                    {profile.registrationNo}
                  </p>
                  <p className="text-xs text-teal-700 font-semibold mt-0.5">Verified & Active</p>
                </div>

                <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Ultrasound / PNDT Statutory
                  </span>
                  <p className="text-sm font-mono font-bold text-slate-900 mt-1">
                    PNDT-TN-CARDIO-0419
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">Compliant for Fetal Cardiology</p>
                </div>
              </div>
            </div>
          </div>

          {/* Side Column: Hours, Authorizations, Fast Shortcuts */}
          <div className="space-y-6">
            {/* Consultation Schedule Card */}
            <div className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-xs">
              <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Clock className="h-4 w-4 text-teal-700" />
                <span>Consultation & Reporting Hours</span>
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                  <span className="text-xs font-medium text-slate-600">Monday – Friday</span>
                  <span className="text-xs font-bold text-slate-900">08:30 AM – 04:30 PM</span>
                </div>
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                  <span className="text-xs font-medium text-slate-600">Saturday</span>
                  <span className="text-xs font-bold text-slate-900">09:00 AM – 01:30 PM</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-600">Sunday / Emergencies</span>
                  <span className="text-xs font-bold text-amber-700">On-Call Echo Duty</span>
                </div>
              </div>

              {/* Authorized Digital Signer Badge */}
              <div className="mt-6 rounded-2xl bg-gradient-to-br from-teal-50 to-emerald-50/50 border border-teal-200/70 p-4">
                <div className="flex items-start gap-2.5">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-teal-700 text-white shadow-2xs">
                    <ShieldCheck className="h-4 w-4" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-teal-950">Authorized Level 3 Signer</h5>
                    <p className="text-[11px] mt-0.5 leading-relaxed text-teal-800">
                      Authorized by the Medical Council & Cardiology Directorate to sign adult,
                      pediatric, and fetal echocardiography reports.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Navigation Shortcuts */}
            <div className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-xs">
              <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-1.5">
                <Layers className="h-4 w-4 text-teal-700" />
                <span>Quick Navigation</span>
              </h3>
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => navigate('/reports')}
                  className="flex w-full items-center justify-between rounded-xl border border-slate-200/80 bg-slate-50/80 px-3.5 py-2.5 text-xs font-semibold text-slate-700 hover:bg-teal-50/60 hover:text-teal-900 hover:border-teal-200 transition cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <FileText className="h-3.5 w-3.5 text-teal-600" />
                    <span>Review Pending Reports</span>
                  </span>
                  <span className="text-slate-400">→</span>
                </button>

                <button
                  type="button"
                  onClick={() => navigate('/patients')}
                  className="flex w-full items-center justify-between rounded-xl border border-slate-200/80 bg-slate-50/80 px-3.5 py-2.5 text-xs font-semibold text-slate-700 hover:bg-teal-50/60 hover:text-teal-900 hover:border-teal-200 transition cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <Users className="h-3.5 w-3.5 text-blue-600" />
                    <span>Patients Registry</span>
                  </span>
                  <span className="text-slate-400">→</span>
                </button>

                <button
                  type="button"
                  onClick={() => navigate('/settings')}
                  className="flex w-full items-center justify-between rounded-xl border border-slate-200/80 bg-slate-50/80 px-3.5 py-2.5 text-xs font-semibold text-slate-700 hover:bg-teal-50/60 hover:text-teal-900 hover:border-teal-200 transition cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <Award className="h-3.5 w-3.5 text-purple-600" />
                    <span>System & Report Configuration</span>
                  </span>
                  <span className="text-slate-400">→</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: CREDENTIALS & EDUCATION */}
      {activeTab === 'credentials' && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 animate-in fade-in duration-200">
          {/* Academic Degrees & Fellowships Timeline */}
          <div className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-xs">
            <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
              <GraduationCap className="h-4 w-4 text-teal-700" />
              <span>Medical Qualifications & Fellowships</span>
            </h3>

            <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
              {profile.qualifications.map((q, idx) => (
                <div key={idx} className="relative">
                  {/* Timeline Node */}
                  <div className="absolute -left-[27px] top-1 h-3.5 w-3.5 rounded-full border-2 border-teal-700 bg-white ring-4 ring-teal-50"></div>
                  <div className="flex items-baseline justify-between gap-2">
                    <h4 className="text-sm font-bold text-slate-900">{q.degree}</h4>
                    <span className="rounded-md bg-teal-50 px-2 py-0.5 text-xs font-bold text-teal-800 border border-teal-200/60">
                      {q.year}
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-slate-600 mt-0.5">{q.institution}</p>
                  {q.honors && (
                    <p className="text-[11px] text-teal-700 font-medium mt-1 flex items-center gap-1">
                      <Award className="h-3 w-3" />
                      <span>{q.honors}</span>
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Professional Memberships & Publications */}
          <div className="space-y-6">
            {/* Memberships */}
            <div className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-xs">
              <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Award className="h-4 w-4 text-teal-700" />
                <span>Professional Society Memberships & Fellowships</span>
              </h3>
              <div className="space-y-2.5">
                {(profile.memberships || DEFAULT_DOCTOR_PROFILE.memberships).map((m, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/70 p-3 text-xs"
                  >
                    <span className="font-bold text-slate-800">{m.name}</span>
                    <span className="rounded-md bg-slate-200/70 px-2 py-0.5 font-bold text-slate-700 text-[10px]">
                      {m.role}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Selected Clinical Publications */}
            <div className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-xs">
              <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
                <FileText className="h-4 w-4 text-teal-700" />
                <span>Recent Peer-Reviewed Publications</span>
              </h3>
              <div className="space-y-3">
                {(profile.publications || DEFAULT_DOCTOR_PROFILE.publications).map((p, idx) => (
                  <div key={idx} className="border-b border-slate-100 pb-3 last:border-0 last:pb-0">
                    <p className="text-xs font-bold text-slate-900 leading-snug">"{p.title}"</p>
                    <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-1">
                      <span className="font-semibold text-teal-700">{p.journal}</span>
                      <span>•</span>
                      <span>{p.year}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: DIGITAL SIGNATURE & OFFICIAL STAMP */}
      {activeTab === 'signature' && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 animate-in fade-in duration-200">
          {/* Official Signature Preview */}
          <div className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <FileSignature className="h-4 w-4 text-teal-700" />
                <span>Official Digital Signature</span>
              </h3>
              <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-800 border border-emerald-200">
                Active on Reports
              </span>
            </div>
            <p className="text-xs text-slate-500">
              This signature is automatically appended with cryptographic verification to all
              completed Adult, Pediatric, and Fetal echo reports signed by {profile.name}.
            </p>

            {/* Signature Box */}
            <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-6 flex flex-col items-center justify-center text-center">
              <div className="py-4">
                <span
                  style={{
                    fontFamily: "'Brush Script MT', 'Dancing Script', 'Segoe Script', cursive, sans-serif",
                    fontSize: '2.6rem',
                    color: signatureInk,
                    transform: 'rotate(-2deg)',
                    display: 'inline-block',
                    letterSpacing: '1px',
                  }}
                >
                  {profile.name}
                </span>
              </div>
              <div className="w-56 border-t-2 border-slate-400 my-2"></div>
              <p className="text-xs font-bold text-slate-900">{profile.name}</p>
              <p className="text-[11px] font-semibold text-slate-600">{profile.degrees}</p>
              <p className="text-[10px] text-slate-500">Medical Reg No: {profile.registrationNo}</p>

              {/* Ink color switcher */}
              <div className="mt-5 flex items-center gap-2 text-xs font-medium text-slate-600">
                <span>Signature Ink:</span>
                {[
                  { label: 'Navy Blue', color: '#08145f' },
                  { label: 'Classic Black', color: '#0f172a' },
                  { label: 'Deep Teal', color: '#0f5449' },
                ].map((c) => (
                  <button
                    key={c.color}
                    type="button"
                    onClick={() => setSignatureInk(c.color)}
                    className={`flex items-center gap-1.5 rounded-lg px-2 py-1 text-[11px] font-bold border transition cursor-pointer ${
                      signatureInk === c.color
                        ? 'border-teal-600 bg-white text-teal-800 shadow-2xs'
                        : 'border-slate-200 bg-slate-100 text-slate-600 hover:bg-white'
                    }`}
                  >
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: c.color }}
                    ></span>
                    <span>{c.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Cryptographic verification banner */}
            <div className="rounded-2xl bg-slate-50 p-4 border border-slate-200 text-xs text-slate-700 space-y-1.5">
              <div className="flex items-center gap-1.5 font-bold text-emerald-800">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <span>SHA-256 Cryptographic Authenticity Verified</span>
              </div>
              <p className="text-[11px] text-slate-500 font-mono break-all">
                Hash: 8f4e2a1b9c3d7e5f0a2b4c6d8e0f1a3b5c7d9e1f2a4b6c8d0e2f4a6b8c0d2e4f
              </p>
            </div>
          </div>

          {/* Institutional Clinic Seal / Stamp */}
          <div className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-xs space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-teal-700" />
              <span>Institutional Clinic Seal & Certified Stamp</span>
            </h3>
            <p className="text-xs text-slate-500">
              Official circular clinic seal applied on legal and hospital echocardiography audit
              documents.
            </p>

            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/80 p-8 flex flex-col items-center justify-center text-center">
              {/* Circular Medical Stamp Graphic */}
              <div className="relative flex h-36 w-36 items-center justify-center rounded-full border-4 border-teal-800 bg-teal-50/50 p-2 shadow-sm">
                <div className="flex h-30 w-30 flex-col items-center justify-center rounded-full border-2 border-teal-700/60 p-2 text-center">
                  <span className="text-[9px] font-black uppercase tracking-wider text-teal-900">
                    echoAI Cardiac
                  </span>
                  <Stethoscope className="h-6 w-6 text-teal-800 my-1" />
                  <span className="text-[8px] font-bold uppercase tracking-tight text-teal-800">
                    Official Echo Lab
                  </span>
                  <span className="text-[8px] font-mono font-bold text-teal-700">
                    {profile.registrationNo}
                  </span>
                </div>
              </div>
              <p className="text-sm font-bold text-slate-900 mt-4">{profile.hospital}</p>
              <p className="text-xs text-slate-500">Department of Non-Invasive Cardiovascular Imaging</p>
              <p className="text-[11px] font-semibold text-teal-800 mt-1">
                NABH Accredited & PNDT Certified
              </p>
            </div>

            <div className="rounded-2xl bg-teal-50 border border-teal-200 p-4 flex items-center justify-between">
              <div>
                <h5 className="text-xs font-bold text-teal-950">Test In Echo Report</h5>
                <p className="text-[11px] text-teal-800">
                  See how this stamp & signature appears on an official echo report preview.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsPreviewReportOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-teal-700 px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:bg-teal-800 transition cursor-pointer"
              >
                <Eye className="h-3.5 w-3.5" />
                <span>Preview</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: CASELOAD & ANALYTICS */}
      {activeTab === 'analytics' && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 animate-in fade-in duration-200">
          {/* Echo Modality Breakdown */}
          <div className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-xs space-y-5">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-teal-700" />
              <span>Echo Modality Caseload Breakdown</span>
            </h3>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs font-bold mb-1.5">
                  <span className="text-slate-800">Adult Transthoracic Echo (TTE)</span>
                  <span className="text-teal-700">62% (885 scans)</span>
                </div>
                <div className="h-2.5 w-full rounded-full bg-slate-100 overflow-hidden">
                  <div className="h-full rounded-full bg-teal-600" style={{ width: '62%' }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-bold mb-1.5">
                  <span className="text-slate-800">Pediatric & Congenital Echo</span>
                  <span className="text-blue-700">24% (343 scans)</span>
                </div>
                <div className="h-2.5 w-full rounded-full bg-slate-100 overflow-hidden">
                  <div className="h-full rounded-full bg-blue-600" style={{ width: '24%' }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-bold mb-1.5">
                  <span className="text-slate-800">Fetal Echocardiography</span>
                  <span className="text-purple-700">14% (200 scans)</span>
                </div>
                <div className="h-2.5 w-full rounded-full bg-slate-100 overflow-hidden">
                  <div className="h-full rounded-full bg-purple-600" style={{ width: '14%' }}></div>
                </div>
              </div>
            </div>

            <div className="border-t border-slate-100 pt-4 flex items-center justify-between text-xs text-slate-500">
              <span>Total Evaluations: <strong>1,428 scans</strong></span>
              <span className="text-emerald-700 font-bold">100% Verified Quality</span>
            </div>
          </div>

          {/* Diagnostic Pathology Distribution */}
          <div className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-xs space-y-5">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-teal-700" />
              <span>Diagnostic Pathology Distribution</span>
            </h3>

            <div className="grid grid-cols-2 gap-3.5">
              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <span className="text-xs font-bold text-slate-500">Valvular Heart Disease</span>
                <p className="text-xl font-black text-slate-900 mt-1">34%</p>
                <p className="text-[11px] text-teal-700 font-semibold mt-0.5">485 evaluations</p>
              </div>

              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <span className="text-xs font-bold text-slate-500">Ischemic & LV Dysfunction</span>
                <p className="text-xl font-black text-slate-900 mt-1">28%</p>
                <p className="text-[11px] text-blue-700 font-semibold mt-0.5">400 evaluations</p>
              </div>

              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <span className="text-xs font-bold text-slate-500">Congenital Anomalies</span>
                <p className="text-xl font-black text-slate-900 mt-1">22%</p>
                <p className="text-[11px] text-purple-700 font-semibold mt-0.5">314 evaluations</p>
              </div>

              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <span className="text-xs font-bold text-slate-500">Cardiomyopathies & Others</span>
                <p className="text-xl font-black text-slate-900 mt-1">16%</p>
                <p className="text-[11px] text-rose-700 font-semibold mt-0.5">229 evaluations</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: EDIT DOCTOR PROFILE */}
      {activeTab === 'edit' && (
        <form onSubmit={handleSaveProfile} className="space-y-6 animate-in fade-in duration-200">
          <div className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-xs space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Edit3 className="h-4 w-4 text-teal-700" />
                  <span>Edit Doctor Information & Practice Details</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Update doctor display credentials, licensing council, consultation suite, and bio.
                </p>
              </div>
              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-xl bg-teal-700 px-5 py-2 text-xs font-bold text-white shadow-xs hover:bg-teal-800 transition cursor-pointer"
              >
                <Save className="h-4 w-4" />
                <span>Save All Changes</span>
              </button>
            </div>

            {/* Input Grid */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {/* Full Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Doctor Full Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm text-slate-900 font-medium focus:border-teal-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-100 transition"
                  required
                />
              </div>

              {/* Avatar Initials */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Avatar Initials (e.g. DS)
                </label>
                <input
                  type="text"
                  value={formData.initials}
                  onChange={(e) => handleInputChange('initials', e.target.value)}
                  maxLength={3}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm uppercase font-bold text-slate-900 focus:border-teal-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-100 transition"
                />
              </div>

              {/* Degrees */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Academic Degrees / Credentials
                </label>
                <input
                  type="text"
                  value={formData.degrees}
                  onChange={(e) => handleInputChange('degrees', e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm text-slate-900 font-medium focus:border-teal-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-100 transition"
                />
              </div>

              {/* Designation */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Clinical Designation / Title
                </label>
                <input
                  type="text"
                  value={formData.designation}
                  onChange={(e) => handleInputChange('designation', e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm text-slate-900 font-medium focus:border-teal-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-100 transition"
                />
              </div>

              {/* Registration No */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Medical Council Registration No
                </label>
                <input
                  type="text"
                  value={formData.registrationNo}
                  onChange={(e) => handleInputChange('registrationNo', e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm font-mono font-bold text-slate-900 focus:border-teal-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-100 transition"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Official Email Address
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm text-slate-900 font-medium focus:border-teal-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-100 transition"
                  required
                />
              </div>

              {/* Phone */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Direct Mobile / Hotline
                </label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm text-slate-900 font-medium focus:border-teal-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-100 transition"
                />
              </div>

              {/* Hospital / Clinic */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Hospital / Institution Name
                </label>
                <input
                  type="text"
                  value={formData.hospital}
                  onChange={(e) => handleInputChange('hospital', e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm text-slate-900 font-medium focus:border-teal-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-100 transition"
                />
              </div>

              {/* Department */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Department
                </label>
                <input
                  type="text"
                  value={formData.department}
                  onChange={(e) => handleInputChange('department', e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm text-slate-900 font-medium focus:border-teal-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-100 transition"
                />
              </div>

              {/* Consultation Suite / Room */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Room / Consultation Suite
                </label>
                <input
                  type="text"
                  value={formData.room}
                  onChange={(e) => handleInputChange('room', e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm text-slate-900 font-medium focus:border-teal-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-100 transition"
                />
              </div>

              {/* Clinical Experience */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Clinical Experience
                </label>
                <input
                  type="text"
                  value={formData.experience}
                  onChange={(e) => handleInputChange('experience', e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm text-slate-900 font-medium focus:border-teal-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-100 transition"
                />
              </div>

              {/* Avatar Type Preference */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Avatar Display Style
                </label>
                <select
                  value={formData.avatarType}
                  onChange={(e) => handleInputChange('avatarType', e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm text-slate-900 font-semibold focus:border-teal-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-100 transition"
                >
                  <option value="photo">Professional Studio Portrait Photo</option>
                  <option value="initials">Monogram Initials Badge</option>
                </select>
              </div>

              {/* Clinical Bio */}
              <div className="sm:col-span-2 lg:col-span-3">
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Clinical Practice Bio & Summary
                </label>
                <textarea
                  rows={3}
                  value={formData.bio}
                  onChange={(e) => handleInputChange('bio', e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm text-slate-900 font-medium focus:border-teal-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-100 transition"
                />
              </div>
            </div>

            {/* Bottom Form Actions */}
            <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-5">
              <button
                type="button"
                onClick={() => setActiveTab('overview')}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex items-center gap-2 rounded-xl bg-teal-700 px-6 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-teal-800 transition cursor-pointer"
              >
                <Save className="h-4 w-4" />
                <span>Save Profile Changes</span>
              </button>
            </div>
          </div>
        </form>
      )}

      {/* SAMPLE ECHO REPORT PREVIEW MODAL */}
      {isPreviewReportOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in duration-150">
          <div className="relative w-full max-w-3xl rounded-3xl bg-white shadow-2xl border border-slate-200 overflow-hidden my-8 animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-teal-700 border border-teal-200">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Sample Report Footer Preview</h3>
                  <p className="text-xs text-slate-500">Live preview of signature and doctor stamp</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsPreviewReportOpen(false)}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 bg-slate-100 max-h-[75vh] overflow-y-auto flex justify-center">
              <div className="w-full max-w-xl bg-white p-6 rounded-2xl shadow-sm border border-slate-200 text-slate-800 text-xs space-y-4">
                <div className="border-b border-teal-700 pb-2 flex justify-between items-center">
                  <div>
                    <h4 className="font-bold text-teal-900 text-sm">echoAI Diagnostic Centre</h4>
                    <p className="text-[10px] text-slate-500">Adult & Pediatric Echocardiography Lab</p>
                  </div>
                  <span className="text-[10px] text-slate-400">Sample Document</span>
                </div>

                <div className="bg-slate-50 p-3 rounded-lg text-[11px] space-y-1">
                  <p><strong>Patient:</strong> Master Tanish Banerjee (TM000100)</p>
                  <p><strong>Examination:</strong> Transthoracic Echocardiogram (2D + Color Doppler)</p>
                  <p><strong>Impression:</strong> Normal cardiac structures and chamber dimensions for age.</p>
                </div>

                {/* Footer Signature Box */}
                <div className="pt-6 mt-6 border-t border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-teal-800 text-[8px] font-bold text-teal-800 text-center p-1">
                      echoAI Certified
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="py-1">
                      <span
                        style={{
                          fontFamily: "'Brush Script MT', cursive, sans-serif",
                          fontSize: '1.8rem',
                          color: signatureInk,
                          display: 'inline-block',
                          transform: 'rotate(-2deg)',
                        }}
                      >
                        {profile.name}
                      </span>
                    </div>
                    <div className="w-40 border-t border-slate-400 ml-auto my-1"></div>
                    <p className="font-bold text-slate-900 text-xs">{profile.name}</p>
                    <p className="text-[10px] text-slate-600">{profile.degrees}</p>
                    <p className="text-[9px] text-slate-500">Reg No: {profile.registrationNo}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end border-t border-slate-200 bg-slate-50 px-6 py-3">
              <button
                type="button"
                onClick={() => setIsPreviewReportOpen(false)}
                className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CREDENTIAL DOSSIER / CV MODAL */}
      {isDossierModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in duration-150">
          <div className="relative w-full max-w-4xl rounded-3xl bg-white shadow-2xl border border-slate-200 overflow-hidden my-8 animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-teal-700 border border-teal-200">
                  <Printer className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Official Clinical Credentials Dossier</h3>
                  <p className="text-xs text-slate-500">Form for Hospital Credentialing & Medical Audits</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePrintDossier}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-teal-700 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-teal-800 transition cursor-pointer"
                >
                  <Printer className="h-4 w-4" />
                  <span>Print Dossier</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsDossierModalOpen(false)}
                  className="rounded-lg p-2 text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Dossier Body */}
            <div className="p-8 max-h-[75vh] overflow-y-auto space-y-6 text-slate-900 font-sans">
              <div className="border-b-2 border-teal-700 pb-4 flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-black text-slate-900">{profile.name}</h2>
                  <p className="text-sm font-bold text-teal-800">{profile.degrees}</p>
                  <p className="text-xs text-slate-600 mt-1">{profile.designation}</p>
                  <p className="text-xs text-slate-500">{profile.hospital}</p>
                </div>
                <div className="text-right text-xs text-slate-600 space-y-0.5">
                  <p><strong>Medical Reg:</strong> {profile.registrationNo}</p>
                  <p><strong>Council:</strong> {profile.council}</p>
                  <p><strong>Email:</strong> {profile.email}</p>
                  <p><strong>Direct:</strong> {profile.phone}</p>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-teal-800 mb-2">
                  1. Clinical Summary & Scope
                </h4>
                <p className="text-xs leading-relaxed text-slate-700">{profile.bio}</p>
              </div>

              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-teal-800 mb-2">
                  2. Qualifications & Fellowships
                </h4>
                <div className="space-y-2">
                  {profile.qualifications.map((q, idx) => (
                    <div key={idx} className="flex justify-between text-xs border-b border-slate-100 pb-1.5">
                      <div>
                        <strong className="text-slate-900">{q.degree}</strong> — <span>{q.institution}</span>
                        {q.honors && <span className="block text-[11px] text-teal-700">{q.honors}</span>}
                      </div>
                      <span className="font-bold text-slate-700">{q.year}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-teal-800 mb-2">
                  3. Clinical Volumes & Level 3 Signer Privileges
                </h4>
                <div className="grid grid-cols-3 gap-3 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <div>
                    <span className="text-slate-500">Scans Reported</span>
                    <p className="text-base font-bold text-slate-900">{profile.stats?.scansReported}</p>
                  </div>
                  <div>
                    <span className="text-slate-500">Reports Signed</span>
                    <p className="text-base font-bold text-slate-900">{profile.stats?.reportsSigned}</p>
                  </div>
                  <div>
                    <span className="text-slate-500">Experience</span>
                    <p className="text-base font-bold text-slate-900">{profile.experience}</p>
                  </div>
                </div>
              </div>

              <div className="pt-8 flex justify-between items-end border-t border-slate-200">
                <div className="text-[10px] text-slate-400">
                  Document generated digitally by echoAI Hospital Information System • Valid for audit.
                </div>
                <div className="text-right">
                  <div className="py-1">
                    <span
                      style={{
                        fontFamily: "'Brush Script MT', cursive, sans-serif",
                        fontSize: '1.6rem',
                        color: signatureInk,
                      }}
                    >
                      {profile.name}
                    </span>
                  </div>
                  <div className="w-36 border-t border-slate-400 ml-auto my-1"></div>
                  <p className="text-xs font-bold text-slate-900">{profile.name}</p>
                  <p className="text-[10px] text-slate-500">Verified Clinician Signature</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
