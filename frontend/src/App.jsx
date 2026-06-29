import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Home from './pages/Home'
import Search from './pages/Search'
import NewPatient from './pages/NewPatient'
import EditPatient from './pages/EditPatient'
import Visits from './pages/Visits'
import ReferralDoctors from './pages/ReferralDoctors'
import NewReferralDoctor from './pages/NewReferralDoctor'
import FetalEchoReport from './pages/FetalEchoReport'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={
          <Home />
        } />
        <Route path="/search" element={
          <Layout>
            <Search />
          </Layout>
        } />
        <Route path="/new-patient" element={
          <Layout>
            <NewPatient />
          </Layout>
        } />
        <Route path="/edit-patient" element={
          <Layout>
            <EditPatient />
          </Layout>
        } />
        <Route path="/edit-patient/:id" element={
          <Layout>
            <EditPatient />
          </Layout>
        } />
        <Route path="/visits" element={
          <Layout>
            <Visits />
          </Layout>
        } />
        <Route path="/referral-doctors" element={
          <Layout>
            <ReferralDoctors />
          </Layout>
        } />
        <Route path="/referral-doctors/new" element={
          <Layout>
            <NewReferralDoctor />
          </Layout>
        } />
        <Route path="/fetal-echo-report" element={
          <Layout>
            <FetalEchoReport />
          </Layout>
        } />
        <Route path="/fetal-echo-report/:scanId" element={
          <Layout>
            <FetalEchoReport />
          </Layout>
        } />
      </Routes>
    </Router>
  )
}

export default App
