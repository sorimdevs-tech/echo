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
import EchoScan from './pages/EchoScan'
import ImagesViewer from './pages/ImagesViewer'
import Measurements from './pages/Measurements'
import AIAssistant from './pages/AIAssistant'
import Reports from './pages/Reports'
import CRM from './pages/CRM'
import Analytics from './pages/Analytics'
import Administration from './pages/Administration'
import Settings from './pages/Settings'
import AdultEchoReport from './pages/AdultEchoReport'
import FetalEchoReport from './pages/FetalEchoReport'
import PediatricEchoReport from './pages/PediatricEchoReport'
import SearchQuery from './pages/SearchQuery'
import EditReferralDoctor from './pages/EditReferralDoctor'
import Home from './pages/Home'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={
          <Home />
        } />
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
        <Route path="/search-query" element={
          <Layout><SearchQuery /></Layout>
        } />
        <Route path="/adult-echo-report" element={
          <Layout><AdultEchoReport /></Layout>
        } />
        <Route path="/adult-echo-report/:scanId" element={
          <Layout><AdultEchoReport /></Layout>
        } />
        <Route path="/fetal-echo-report" element={
          <Layout><FetalEchoReport /></Layout>
        } />
        <Route path="/fetal-echo-report/:scanId" element={
          <Layout><FetalEchoReport /></Layout>
        } />
        <Route path="/pediatric-echo-report" element={
          <Layout><PediatricEchoReport /></Layout>
        } />
        <Route path="/pediatric-echo-report/:scanId" element={
          <Layout><PediatricEchoReport /></Layout>
        } />
        <Route path="/echo-studies" element={
          <Layout><EchoScan /></Layout>
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
