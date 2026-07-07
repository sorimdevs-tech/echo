import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Home from './pages/Home'
import Search from './pages/Search'
import Settings from './pages/Settings'
import SearchQuery from './pages/SearchQuery'
import NewPatient from './pages/NewPatient'
import EditPatient from './pages/EditPatient'
import Visits from './pages/Visits'
import ReferralDoctors from './pages/ReferralDoctors'
import NewReferralDoctor from './pages/NewReferralDoctor'
import AdultEchoReport from './pages/AdultEchoReport'
import FetalEchoReport from './pages/FetalEchoReport'
import PediatricEchoReport from './pages/PediatricEchoReport'

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
        <Route path="/settings" element={
          <Layout>
            <Settings />
          </Layout>
        } />
        <Route path="/search-query" element={
          <Layout>
            <SearchQuery />
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
        <Route path="/adult-echo-report" element={
          <Layout>
            <AdultEchoReport />
          </Layout>
        } />
        <Route path="/adult-echo-report/:scanId" element={
          <Layout>
            <AdultEchoReport />
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
        <Route path="/pediatric-echo-report" element={
          <Layout>
            <PediatricEchoReport />
          </Layout>
        } />
        <Route path="/pediatric-echo-report/:scanId" element={
          <Layout>
            <PediatricEchoReport />
          </Layout>
        } />
      </Routes>
    </Router>
  )
}

export default App
