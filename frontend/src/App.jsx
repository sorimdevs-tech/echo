import { useEffect, useState, lazy, Suspense } from 'react'
import api from './api/axios'
import { createBrowserRouter, createRoutesFromElements, RouterProvider, Navigate, Route } from 'react-router-dom'
import Layout from './components/Layout'
const Dashboard = lazy(() => import('./pages/Dashboard'))
const Search = lazy(() => import('./pages/Search'))
const NewPatient = lazy(() => import('./pages/NewPatient'))
const Patients = lazy(() => import('./pages/Patients'))
const EditPatient = lazy(() => import('./pages/EditPatient'))
const Visits = lazy(() => import('./pages/Visits'))
const ReferralDoctors = lazy(() => import('./pages/ReferralDoctors'))
const NewReferralDoctor = lazy(() => import('./pages/NewReferralDoctor'))
const EditReferralDoctor = lazy(() => import('./pages/EditReferralDoctor'))
const ClinicalWorkspace = lazy(() => import('./pages/ClinicalWorkspace'))
const ImagesViewer = lazy(() => import('./pages/ImagesViewer'))
const Measurements = lazy(() => import('./pages/Measurements'))
const Reports = lazy(() => import('./pages/Reports'))
const Analytics = lazy(() => import('./pages/Analytics'))
const Administration = lazy(() => import('./pages/Administration'))
const Settings = lazy(() => import('./pages/Settings'))
const Home = lazy(() => import('./pages/Home'))
const FetalEchoReport = lazy(() => import('./pages/FetalEchoReport'))
const AdultEchoReport = lazy(() => import('./pages/AdultEchoReport'))
const PediatricEchoReport = lazy(() => import('./pages/PediatricEchoReport'))
const EchoScan = lazy(() => import('./pages/EchoScan'))
const EchoStudies = lazy(() => import('./pages/EchoStudies'))
const Profile = lazy(() => import('./pages/Profile'))

function isSignedIn() {
  return Boolean(
    sessionStorage.getItem('echoai_token') || localStorage.getItem('echoai_token'),
  )
}

function ProtectedPage({ children }) {
  const [verified,setVerified]=useState(null)
  useEffect(()=>{
    let active=true
    const token=sessionStorage.getItem('echoai_token') || localStorage.getItem('echoai_token')
    if(!token){setVerified(false);return ()=>{active=false}}
    api.get('/auth/me').then(result=>{
      if(!active)return
      const user=result.data.data
      const storage=localStorage.getItem('echoai_user') ? localStorage : sessionStorage
      storage.setItem('echoai_user', JSON.stringify(user))
      setVerified(true)
    }).catch(()=>{
      if(!active)return
      for(const store of [localStorage,sessionStorage]){store.removeItem('echoai_user');store.removeItem('echoai_token')}
      setVerified(false)
    })
    return ()=>{active=false}
  },[])
  if (verified === null) return <p role="status" className="p-6">Checking session…</p>
  if (!verified) {
    return <Navigate to="/" replace />
  }

  return <Layout>{children}</Layout>
}

function LoginRoute() {
  const searchParams = new URLSearchParams(window.location.search)
  if (searchParams.get('signout') === '1') {
    api.post('/auth/logout').catch(() => {})
    sessionStorage.removeItem('echoai_token')
    localStorage.removeItem('echoai_token')
    sessionStorage.removeItem('echoai_user')
    localStorage.removeItem('echoai_user')
    localStorage.removeItem('echoai_google_access_token')
    window.history.replaceState({}, document.title, '/')
    return <Home />
  }

  return isSignedIn() ? <Navigate to="/dashboard" replace /> : <Home />
}

const router = createBrowserRouter(createRoutesFromElements(<>

        <Route path="/" element={<LoginRoute />} />
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
          <ProtectedPage><EchoStudies /></ProtectedPage>
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

</>))

function App() {
  useEffect(() => {
    const handleWheel = (e) => {
      if (document.activeElement && document.activeElement.type === 'number') {
        document.activeElement.blur()
      }
    }
    window.addEventListener('wheel', handleWheel, { passive: true })
    return () => window.removeEventListener('wheel', handleWheel)
  }, [])
  return <Suspense fallback={<p role="status" className="p-6">Loading page…</p>}><RouterProvider router={router} /></Suspense>
}

export default App
