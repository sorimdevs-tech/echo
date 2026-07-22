import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
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
import AIAssistant from './pages/AIAssistant'
import Reports from './pages/Reports'
import CRM from './pages/CRM'
import Analytics from './pages/Analytics'
import Administration from './pages/Administration'
import Settings from './pages/Settings'
import Landing from './pages/Landing'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/dashboard" element={
          <Layout><Dashboard /></Layout>
        } />
        <Route path="/search" element={
          <Layout><Search /></Layout>
        } />
        <Route path="/new-patient" element={
          <Layout><NewPatient /></Layout>
        } />
        <Route path="/patients" element={
          <Layout><Patients /></Layout>
        } />
        <Route path="/patients/new" element={
          <Layout><NewPatient /></Layout>
        } />
        <Route path="/patients/:id/edit" element={
          <Layout><EditPatient /></Layout>
        } />
        <Route path="/visits" element={
          <Layout><Visits /></Layout>
        } />
        <Route path="/referral-doctors" element={
          <Layout><ReferralDoctors /></Layout>
        } />
        <Route path="/referral-doctors/new" element={
          <Layout><NewReferralDoctor /></Layout>
        } />
        <Route path="/referral-doctors/edit/:id" element={
          <Layout><EditReferralDoctor /></Layout>
        } />
        <Route path="/echo-studies" element={
          <Layout><ClinicalWorkspace initialType="Adult Echo" /></Layout>
        } />
        <Route path="/images" element={
          <Layout><ImagesViewer /></Layout>
        } />
        <Route path="/measurements" element={
          <Layout><Measurements /></Layout>
        } />
        <Route path="/ai-assistant" element={
          <Layout><AIAssistant /></Layout>
        } />
        <Route path="/reports" element={
          <Layout><Reports /></Layout>
        } />
        <Route path="/crm" element={
          <Layout><CRM /></Layout>
        } />
        <Route path="/analytics" element={
          <Layout><Analytics /></Layout>
        } />
        <Route path="/administration" element={
          <Layout><Administration /></Layout>
        } />
        <Route path="/settings" element={
          <Layout><Settings /></Layout>
        } />
      </Routes>
    </Router>
  )
}

export default App
