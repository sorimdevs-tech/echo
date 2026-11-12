import Accounts from './pages/Accounts'
import { useEffect, useState } from 'react'
import api from './api/axios'
import { BrowserRouter as Router, Navigate, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Search from './pages/Search'
import NewPatient from './pages/NewPatient'
import Patients from './pages/Patients'
import EditPatient from './pages/EditPatient'
import Visits from './pages/Visits'
import ReferralDoctors from './pages/ReferralDoctors'
import NewReferralDoctor from './pages/NewReferralDoctor'
import EditReferralDoctor from './pages/EditReferralDoctor'
import ClinicalWorkspace from './pages/ClinicalWorkspace'
import ImagesViewer from './pages/ImagesViewer'
import Measurements from './pages/Measurements'
import Reports from './pages/Reports'
import Analytics from './pages/Analytics'
import Administration from './pages/Administration'
import Settings from './pages/Settings'
import Home from './pages/Home'
import FetalEchoReport from './pages/FetalEchoReport'
import AdultEchoReport from './pages/AdultEchoReport'
import PediatricEchoReport from './pages/PediatricEchoReport'
import EchoScan from './pages/EchoScan'
import Profile from './pages/Profile'

function isSignedIn() {
  return Boolean(
    sessionStorage.getItem('echoai_user') ||
    localStorage.getItem('echoai_user') ||
    localStorage.getItem('echoai_google_access_token'),
  )
}

function ProtectedPage({ children }) {
  const [state, setState] = useState('loading')
  useEffect(() => { api.get('/auth/me').then(({data}) => {
    sessionStorage.setItem('echoai_user', JSON.stringify(data.data)); setState('ready')
  }).catch(() => { sessionStorage.removeItem('echoai_user'); localStorage.removeItem('echoai_user'); setState('signedout') }) }, [])
  if (state === 'loading') return <p className="p-8">Checking session…</p>
  if (state === 'signedout') return <Navigate to="/" replace />
  return <Layout>{children}</Layout>
}

function LoginRoute() {
  const searchParams = new URLSearchParams(window.location.search)
  if (searchParams.get('signout') === '1') {
    sessionStorage.removeItem('echoai_user')
    localStorage.removeItem('echoai_user')
    localStorage.removeItem('echoai_google_access_token')
    window.history.replaceState({}, document.title, '/')
    return <Home />
  }

  return isSignedIn() ? <Navigate to="/dashboard" replace /> : <Home />
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoginRoute />} />
        <Route path="/accounts" element={<ProtectedPage><Accounts /></ProtectedPage>} />
        <Route path="/dashboard" element={
          <ProtectedPage><Dashboard /></ProtectedPage>
        } />
        <Route path="/search" element={
          <ProtectedPage><Search /></ProtectedPage>
        } />
        <Route path="/new-patient" element={
          <ProtectedPage><NewPatient /></ProtectedPage>
        } />
        <Route path="/patients" element={
          <ProtectedPage><Patients /></ProtectedPage>
        } />
        <Route path="/patients/new" element={
          <ProtectedPage><NewPatient /></ProtectedPage>
        } />
        <Route path="/patients/:id/edit" element={
          <ProtectedPage><EditPatient /></ProtectedPage>
        } />
        <Route path="/visits" element={
          <ProtectedPage><Visits /></ProtectedPage>
        } />
        <Route path="/referral-doctors" element={
          <ProtectedPage><ReferralDoctors /></ProtectedPage>
        } />
        <Route path="/referral-doctors/new" element={
          <ProtectedPage><NewReferralDoctor /></ProtectedPage>
        } />
        <Route path="/referral-doctors/edit/:id" element={
          <ProtectedPage><EditReferralDoctor /></ProtectedPage>
        } />
        <Route path="/echo-studies" element={
          <ProtectedPage><ClinicalWorkspace initialType="Adult Echo" /></ProtectedPage>
        } />
        <Route path="/fetal-echo-report" element={
          <ProtectedPage><FetalEchoReport /></ProtectedPage>
        } />
        <Route path="/fetal-echo-report/:scanId" element={
          <ProtectedPage><FetalEchoReport /></ProtectedPage>
        } />
        <Route path="/adult-echo-report" element={
          <ProtectedPage><AdultEchoReport /></ProtectedPage>
        } />
        <Route path="/adult-echo-report/:scanId" element={
          <ProtectedPage><AdultEchoReport /></ProtectedPage>
        } />
        <Route path="/pediatric-echo-report" element={
          <ProtectedPage><PediatricEchoReport /></ProtectedPage>
        } />
        <Route path="/pediatric-echo-report/:scanId" element={
          <ProtectedPage><PediatricEchoReport /></ProtectedPage>
        } />
        <Route path="/echo-scan" element={
          <ProtectedPage><EchoScan /></ProtectedPage>
        } />
        <Route path="/echo-scan/:scanId" element={
          <ProtectedPage><EchoScan /></ProtectedPage>
        } />
        <Route path="/ultrasound" element={
          <ProtectedPage><div className="p-8"><h1 className="text-2xl font-bold">Ultrasound</h1><p className="mt-3 text-slate-600">Reporting template awaiting clinical specification.</p></div></ProtectedPage>
        } />
        <Route path="/images" element={
          <ProtectedPage><ImagesViewer /></ProtectedPage>
        } />
        <Route path="/measurements" element={
          <ProtectedPage><Measurements /></ProtectedPage>
        } />
        <Route path="/ai-assistant" element={
          <Navigate to="/dashboard" replace />
        } />
        <Route path="/reports" element={
          <ProtectedPage><Reports /></ProtectedPage>
        } />
        <Route path="/crm" element={
          <Navigate to="/dashboard" replace />
        } />
        <Route path="/analytics" element={
          <ProtectedPage><Analytics /></ProtectedPage>
        } />
        <Route path="/administration" element={
          <ProtectedPage><Administration /></ProtectedPage>
        } />
        <Route path="/settings" element={
          <ProtectedPage><Settings /></ProtectedPage>
        } />
        <Route path="/profile" element={
          <ProtectedPage><Profile /></ProtectedPage>
        } />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  )
}

export default App
