import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import VisaoExecutiva from './pages/VisaoExecutiva'
import AnaliseFinanceira from './pages/AnaliseFinanceira'
import RankingVerbas from './pages/RankingVerbas'
import TimelinePage from './pages/TimelinePage'
import Prevencao from './pages/Prevencao'
import Detalhamento from './pages/Detalhamento'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Navigate to="/visao_executiva" replace />} />
        <Route path="/visao_executiva" element={<VisaoExecutiva />} />
        <Route path="/analise_financeira" element={<AnaliseFinanceira />} />
        <Route path="/ranking_verbas" element={<RankingVerbas />} />
        <Route path="/timeline" element={<TimelinePage />} />
        <Route path="/prevencao" element={<Prevencao />} />
        <Route path="/detalhamento" element={<Detalhamento />} />
      </Route>
    </Routes>
  )
}
