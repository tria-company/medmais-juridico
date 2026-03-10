import { useMemo } from 'react'
import { Users, CalendarDays, LayoutGrid, Loader2, AlertTriangle } from 'lucide-react'
import {
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ScatterChart,
  Scatter,
} from 'recharts'
import { useFilterContext } from '../hooks/useFilters'
import { parseCurrency, formatCurrency } from '../utils/format'

// ─── Cores ───────────────────────────────────────────────
const DEPT_COLORS = ['#7E1E00', '#C32F00', '#FF3E00', '#C0A139', '#015100', '#294C99', '#3A0051', '#BD2D00', '#03B700', '#457FFF']
const CARGO_BLUES = ['#170C80', '#1e2080', '#252e90', '#294C99', '#3560ab', '#4C7DC5', '#457FFF', '#5a8fd5', '#6da0e0', '#80b0ea']
const DESLIG_COLORS = ['#C32F00', '#5B5B5B', '#294C99', '#03B700', '#8300B7', '#BD2D00', '#0077B6', '#E05030', '#457FFF', '#7E1E00', '#C0A139', '#015100', '#3A0051', '#FF8060', '#170C80']

// ─── Custom Tooltip ──────────────────────────────────────
function BarTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  const d = payload[0]?.payload
  if (!d) return null
  return (
    <div className="bg-gray-800 text-white shadow-lg rounded-lg px-3 py-2 text-xs">
      <p className="font-medium mb-0.5">{d.name}</p>
      <p className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-yellow-400" />
        Quantidade – {d.count}
      </p>
    </div>
  )
}

function DesligTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  const d = payload[0]?.payload
  if (!d) return null
  return (
    <div className="bg-gray-800 text-white shadow-lg rounded-lg px-3 py-2 text-xs">
      <p className="font-medium mb-0.5">{d.name}</p>
      <p className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-orange-400" />
        Quantidade – {d.count}
      </p>
      <p className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-green-400" />
        Valor – {formatCurrency(d.value)}
      </p>
    </div>
  )
}

function ScatterTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  const d = payload[0]?.payload
  if (!d) return null
  return (
    <div className="bg-gray-800 text-white shadow-lg rounded-lg px-3 py-2 text-xs">
      <p className="font-medium mb-0.5">{d.cargo || 'N/A'}</p>
      <p>Tempo: {d.x} meses</p>
      <p>Valor: {formatCurrency(d.y)}</p>
    </div>
  )
}

// ─── Componente principal ────────────────────────────────
export default function Prevencao() {
  const { processos, loading, error } = useFilterContext()

  // KPIs
  const kpis = useMemo(() => {
    if (!processos.length) return null

    const reclamantes = new Set(
      processos.map(p => p.nome_reclamante || p.parte_contraria).filter(Boolean)
    ).size

    const temposCasa = processos
      .map(p => {
        const tc = p.tempo_casa_meses
        if (!tc) return null
        const num = parseFloat(String(tc).replace(/[^\d.,]/g, '').replace(',', '.'))
        return isNaN(num) ? null : num
      })
      .filter(v => v !== null)
    const tempoMedio = temposCasa.length > 0
      ? (temposCasa.reduce((a, b) => a + b, 0) / temposCasa.length).toFixed(1)
      : 0

    const departamentos = new Set(
      processos.map(p => p.departamento_reclamante).filter(Boolean)
    ).size

    return { reclamantes, tempoMedio, departamentos }
  }, [processos])

  // Processos por Departamento
  const deptData = useMemo(() => {
    if (!processos.length) return []
    const map = {}
    processos.forEach(p => {
      const dept = p.departamento_reclamante || 'NÃO INFORMADO'
      map[dept] = (map[dept] || 0) + 1
    })
    return Object.entries(map)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)
  }, [processos])

  // Processos por Cargo
  const cargoData = useMemo(() => {
    if (!processos.length) return []
    const map = {}
    processos.forEach(p => {
      const cargo = p.cargo_reclamante || p.cargo || 'NÃO INFORMADO'
      map[cargo] = (map[cargo] || 0) + 1
    })
    return Object.entries(map)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)
  }, [processos])

  // Tipo de Desligamento (donut)
  const desligData = useMemo(() => {
    if (!processos.length) return { items: [], total: 0 }
    const map = {}
    processos.forEach(p => {
      const tipo = p.tipo_desligamento || 'Sem'
      if (!map[tipo]) map[tipo] = { name: tipo, count: 0, value: 0 }
      map[tipo].count++
      map[tipo].value += parseCurrency(p.valor_provisionado)
    })
    const items = Object.values(map).sort((a, b) => b.count - a.count)
    const total = items.reduce((s, i) => s + i.value, 0)
    return { items, total }
  }, [processos])

  // Scatter: Tipo Desligamento (tempo casa vs valor)
  const scatterData = useMemo(() => {
    if (!processos.length) return []
    return processos
      .map(p => {
        const tc = p.tempo_casa_meses
        if (!tc) return null
        const meses = parseFloat(String(tc).replace(/[^\d.,]/g, '').replace(',', '.'))
        if (isNaN(meses)) return null
        const valor = parseCurrency(p.valor_provisionado)
        return { x: meses, y: valor, cargo: p.cargo_reclamante || p.cargo || '' }
      })
      .filter(Boolean)
  }, [processos])

  // Gestores com mais processos
  const gestorData = useMemo(() => {
    if (!processos.length) return []
    const map = {}
    processos.forEach(p => {
      const gestor = p.gestor_direto || p.advogados_ambas_partes || 'Não informado'
      map[gestor] = (map[gestor] || 0) + 1
    })
    return Object.entries(map)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)
  }, [processos])

  const maxGestor = gestorData.length > 0 ? gestorData[0].count : 1

  // ─── Loading & Error ───────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="animate-spin text-accent" size={40} />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <AlertTriangle className="mx-auto mb-3 text-red-500" size={40} />
          <p className="text-gray-700 font-medium">Erro ao carregar dados</p>
          <p className="text-sm text-gray-500 mt-1">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="flex items-center justify-center gap-12">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center">
            <Users size={24} className="text-red-500" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Reclamantes</p>
            <p className="text-3xl font-bold text-gray-900">{kpis?.reclamantes ?? 0}</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-yellow-100 flex items-center justify-center">
            <CalendarDays size={24} className="text-yellow-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Tempo Médio de Casa</p>
            <p className="text-3xl font-bold text-gray-900">
              {kpis?.tempoMedio ?? 0} <span className="text-base font-normal text-gray-400">meses</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center">
            <LayoutGrid size={24} className="text-blue-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Departamentos</p>
            <p className="text-3xl font-bold text-gray-900">{kpis?.departamentos ?? 0}</p>
          </div>
        </div>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-2 gap-6">
        {/* Processos por Departamento */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-base font-semibold text-gray-800 mb-4">Processos por Departamento</h3>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={deptData} layout="vertical" margin={{ left: 10, right: 20 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis type="category" dataKey="name" width={130} tick={{ fontSize: 9 }} />
              <Tooltip content={<BarTooltip />} />
              <Bar dataKey="count" name="Quantidade" radius={[0, 4, 4, 0]} barSize={20}>
                {deptData.map((_, i) => (
                  <Cell key={i} fill={DEPT_COLORS[i % DEPT_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Processos por Cargo */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-base font-semibold text-gray-800 mb-4">Processos por Cargo</h3>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={cargoData} layout="vertical" margin={{ left: 10, right: 20 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis type="category" dataKey="name" width={140} tick={{ fontSize: 9 }} />
              <Tooltip content={<BarTooltip />} />
              <Bar dataKey="count" name="Quantidade" radius={[0, 4, 4, 0]} barSize={20}>
                {cargoData.map((_, i) => (
                  <Cell key={i} fill={CARGO_BLUES[i % CARGO_BLUES.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-2 gap-6">
        {/* Tipo de Desligamento - Horizontal Bar */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-gray-800">Tipo de Desligamento</h3>
            <div className="text-right">
              <p className="text-xs text-gray-400">Valor Possível Total</p>
              <p className="text-sm font-bold text-gray-800">{formatCurrency(desligData.total)}</p>
            </div>
          </div>
          <div className="overflow-y-auto max-h-[320px]">
            <div style={{ height: Math.max(220, desligData.items.length * 28 + 30) }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={desligData.items} layout="vertical" margin={{ left: 10, right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="name" width={180} tick={{ fontSize: 9 }} />
                  <Tooltip content={<DesligTooltip />} />
                  <Bar dataKey="count" name="Quantidade" radius={[0, 4, 4, 0]} barSize={18}>
                    {desligData.items.map((_, i) => (
                      <Cell key={i} fill={DESLIG_COLORS[i % DESLIG_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Tipo de Desligamento - Scatter */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-base font-semibold text-gray-800 mb-4">Tipo de Desligamento</h3>
          <ResponsiveContainer width="100%" height={220}>
            <ScatterChart margin={{ left: 10, right: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                type="number"
                dataKey="x"
                name="Tempo Casa"
                tick={{ fontSize: 11 }}
                label={{ value: '', position: 'bottom' }}
              />
              <YAxis
                type="number"
                dataKey="y"
                name="Valor"
                tick={{ fontSize: 10 }}
                tickFormatter={v => formatCurrency(v, true)}
              />
              <Tooltip content={<ScatterTooltip />} />
              <Scatter data={scatterData} fill="#170C80" opacity={0.7}>
                {scatterData.map((_, i) => (
                  <Cell key={i} fill="#170C80" />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Gestores com Mais Processos */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-base font-semibold text-gray-800 mb-4">Gestores com Mais Processos</h3>
        <div className="overflow-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b border-gray-200">
                <th className="pb-2 font-medium w-[200px]">Gestores</th>
                <th className="pb-2 font-medium"></th>
                <th className="pb-2 font-medium text-right">Processos</th>
              </tr>
            </thead>
            <tbody>
              {gestorData.map((g, i) => (
                <tr key={i} className="border-b border-gray-100">
                  <td className="py-3 text-gray-700 font-medium">{g.name}</td>
                  <td className="py-3 px-4">
                    <div className="relative h-2.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="absolute left-0 top-0 h-full rounded-full"
                        style={{
                          width: `${(g.count / maxGestor) * 100}%`,
                          backgroundColor: i === 0 ? '#C32F00' : '#170C80',
                        }}
                      />
                      <div
                        className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full border-2 border-white shadow"
                        style={{
                          left: `${(g.count / maxGestor) * 100}%`,
                          transform: 'translate(-50%, -50%)',
                          backgroundColor: i === 0 ? '#C32F00' : '#170C80',
                        }}
                      />
                    </div>
                  </td>
                  <td className="py-3 text-right text-gray-700 font-semibold tabular-nums">
                    {String(g.count).padStart(2, '0')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
