import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Layout } from './components/Layout'
import { Home } from './pages/Home'
import { Report } from './pages/Report'
import { Stats } from './pages/Stats'
import { Methodology } from './pages/Methodology'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="report" element={<Report />} />
          <Route path="stats" element={<Stats />} />
          <Route path="methodology" element={<Methodology />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
