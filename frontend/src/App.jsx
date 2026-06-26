import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Search from './pages/Search'
import NewPatient from './pages/NewPatient'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={
          <Layout>
            <Search />
          </Layout>
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
      </Routes>
    </Router>
  )
}

export default App
