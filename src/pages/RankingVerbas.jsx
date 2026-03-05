import { useMemo } from 'react'
import { Loader2, AlertTriangle } from 'lucide-react'
import {
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts'
import { useFilterContext } from '../hooks/useFilters'
import { parseCurrency, formatCurrency, parseDate, getMonthYear } from '../utils/format'

// ─── Cores ───────────────────────────────────────────────
const BLUES = ['#1e3a5f', '#264b7a', '#2e5d94', '#3b72ad', '#4a8ac4', '#5a9bd5', '#6daedd', '#7bb8e8', '#90c5ec', '#a5d2f0', '#b8def4', '#cceaff']
const REDS = ['#8B1A1A', '#A02020', '#B52828', '#C41E3A', '#D4532B', '#D96040', '#E07050', '#E88060', '#EF9070', '#F5A080', '#F8B090', '#FBC0A0']

// ─── Custom Tooltip ──────────────────────────────────────
function BarTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  const d = payload[0]?.payload
  if (!d) return null
  return (
    <div className="bg-gray-800 text-white shadow-lg rounded-lg px-3 py-2 text-xs">
      <p className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-blue-400" />
        Quantidade – {d.count}
      </p>
      <p className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-red-400" />
        Valor – {formatCurrency(d.value)}
      </p>
    </div>
  )
}

function AreaTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white shadow-lg rounded-lg px-3 py-2 border border-gray-100 text-xs">
      {label && <p className="text-gray-500 mb-1">{label}</p>}
      {payload.map((entry, i) => (
        <p key={i} style={{ color: entry.color }} className="font-medium">
          {entry.name}: {entry.value}
        </p>
      ))}
    </div>
  )
}

// ─── Componente principal ────────────────────────────────
export default function RankingVerbas() {
  const { processos, loading, error } = useFilterContext()

  // Agregar verbas
  const verbaData = useMemo(() => {
    if (!processos.length) return []
    const map = {}
    processos.forEach(p => {
      const verba = p.tipo_verba || p.natureza || p.materia || 'Não Informada'
      if (!map[verba]) map[verba] = { name: verba, count: 0, value: 0, deferida: 0, valorDeferido: 0 }
      map[verba].count++
      map[verba].value += parseCurrency(p.valor_causa_original)
      if (p.status_processo?.toLowerCase()?.includes('encerrado') || p.status_processo?.toLowerCase()?.includes('acordo')) {
        map[verba].deferida++
        map[verba].valorDeferido += parseCurrency(p.valor_total_condenacao)
      }
    })
    return Object.values(map).sort((a, b) => b.count - a.count)
  }, [processos])

  // Top por quantidade
  const topByCount = useMemo(() => {
    return [...verbaData].sort((a, b) => b.count - a.count).slice(0, 12)
  }, [verbaData])

  // Top por valor
  const topByValue = useMemo(() => {
    return [...verbaData].sort((a, b) => b.value - a.value).slice(0, 12)
  }, [verbaData])

  // Evolução mensal
  const monthlyData = useMemo(() => {
    if (!processos.length) return []
    const map = {}
    processos.forEach(p => {
      const d = parseDate(p.data_distribuicao)
      if (d) {
        const key = getMonthYear(d)
        map[key] = (map[key] || 0) + 1
      }
    })
    return Object.entries(map)
      .sort((a, b) => {
        const [ma, ya] = a[0].split('/').map(Number)
        const [mb, yb] = b[0].split('/').map(Number)
        return ya !== yb ? ya - yb : ma - mb
      })
      .map(([month, count]) => ({ month, Processos: count }))
  }, [processos])

  // Tabela de verbas
  const tabelaVerbas = useMemo(() => {
    return verbaData.map(v => ({
      name: v.name,
      qtdPedida: v.count,
      qtdDeferida: v.deferida,
      valorTotal: v.value,
      valorMedio: v.count > 0 ? v.value / v.count : 0,
      taxaSucesso: v.count > 0 ? ((v.deferida / v.count) * 100).toFixed(1) : '0.0',
    }))
  }, [verbaData])

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
      {/* Charts Row - Two horizontal bar charts */}
      <div className="grid grid-cols-2 gap-6">
        {/* Verbas Mais Pedidas (Quantidade) */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-base font-semibold text-gray-800 mb-4">Verbas Mais Pedidas (Quantidade)</h3>
          <ResponsiveContainer width="100%" height={360}>
            <BarChart data={topByCount} layout="vertical" margin={{ left: 10, right: 20 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis
                type="category"
                dataKey="name"
                width={140}
                tick={{ fontSize: 10 }}
              />
              <Tooltip content={<BarTooltip />} />
              <Bar dataKey="count" name="Quantidade" radius={[0, 4, 4, 0]} barSize={20}>
                {topByCount.map((_, i) => (
                  <Cell key={i} fill={BLUES[i % BLUES.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Verbas por Valor Pedido */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-base font-semibold text-gray-800 mb-4">Verbas por Valor Pedido</h3>
          <ResponsiveContainer width="100%" height={360}>
            <BarChart data={topByValue} layout="vertical" margin={{ left: 10, right: 20 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis
                type="number"
                tick={{ fontSize: 11 }}
                tickFormatter={v => formatCurrency(v, true)}
              />
              <YAxis
                type="category"
                dataKey="name"
                width={140}
                tick={{ fontSize: 10 }}
              />
              <Tooltip content={<BarTooltip />} />
              <Bar dataKey="value" name="Valor" radius={[0, 4, 4, 0]} barSize={20}>
                {topByValue.map((_, i) => (
                  <Cell key={i} fill={REDS[i % REDS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Evolução Mensal */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-base font-semibold text-gray-800 mb-4">Evolução Mensal de Processos</h3>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={monthlyData} margin={{ left: 0, right: 10 }}>
            <defs>
              <linearGradient id="gradProcessos" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" tick={{ fontSize: 10 }} angle={-45} textAnchor="end" height={50} />
            <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
            <Tooltip content={<AreaTooltip />} />
            <Area
              type="monotone"
              dataKey="Processos"
              stroke="#6366f1"
              fill="url(#gradProcessos)"
              strokeWidth={2.5}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Tabela de Verbas */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-base font-semibold text-gray-800 mb-4">Processos por Valor Atualizado</h3>
        <div className="overflow-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b border-gray-200">
                <th className="pb-3 font-medium">Verba</th>
                <th className="pb-3 font-medium text-center">Qtd Pedida</th>
                <th className="pb-3 font-medium text-center">Qtd Deferida</th>
                <th className="pb-3 font-medium text-right">Valor Total</th>
                <th className="pb-3 font-medium text-right">Valor Médio</th>
                <th className="pb-3 font-medium text-center">Taxa de Sucesso</th>
              </tr>
            </thead>
            <tbody>
              {tabelaVerbas.map((v, i) => (
                <tr
                  key={i}
                  className={`border-b border-gray-100 ${i % 2 === 0 ? 'bg-gray-50/50' : ''}`}
                >
                  <td className="py-3 text-gray-700">{v.name}</td>
                  <td className="py-3 text-gray-700 text-center">{v.qtdPedida}</td>
                  <td className="py-3 text-gray-700 text-center">{v.qtdDeferida}</td>
                  <td className="py-3 text-gray-900 font-medium text-right whitespace-nowrap">
                    {formatCurrency(v.valorTotal)}
                  </td>
                  <td className="py-3 text-gray-900 font-medium text-right whitespace-nowrap">
                    {formatCurrency(v.valorMedio)}
                  </td>
                  <td className="py-3 text-center">
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-red-100 text-red-600">
                      {v.taxaSucesso}%
                    </span>
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
