import { useMemo } from 'react'
import {
  Building2,
  DollarSign,
  TrendingUp,
  BarChart3,
  AlertTriangle,
  Loader2,
} from 'lucide-react'
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  AreaChart,
  Area,
  ResponsiveContainer,
} from 'recharts'
import { useFilterContext } from '../hooks/useFilters'
import { parseCurrency, formatCurrency, formatNumber, parseDate, getMonthYear } from '../utils/format'

// ─── Cores ───────────────────────────────────────────────
const RISK_COLORS = {
  'Possível': '#7E1E00',
  'Provável': '#FF3E00',
  'Remoto': '#03B700',
  'Não Informado': '#D7D7D7',
  'informacao nao disponivel': '#D7D7D7',
}

const STATUS_COLORS = {
  'Ativo': '#7E1E00',
  'Arquivado': '#BD2D00',
  'Encerrado-Acordo': '#FF3E00',
  'Suspenso': '#FFAF96',
}

const BRANCH_BLUES = ['#170C80', '#1e2a8f', '#294C99', '#3560ab', '#4C7DC5', '#457FFF']

// ─── KPI Card ────────────────────────────────────────────
function KPICard({ icon: Icon, iconBg, label, value, subtitle }) {
  return (
    <div className="bg-white rounded-xl shadow-sm px-5 py-4 flex items-center gap-4 min-w-0">
      <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${iconBg}`}>
        <Icon size={22} className="text-white" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-gray-500 truncate">{label}</p>
        <p className="text-xl font-bold text-gray-900 truncate">{value}</p>
        {subtitle && <p className="text-[10px] text-gray-400 truncate">{subtitle}</p>}
      </div>
    </div>
  )
}

// ─── Custom Tooltip ──────────────────────────────────────
function CustomTooltip({ active, payload, label, isCurrency }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white shadow-lg rounded-lg px-3 py-2 border border-gray-100 text-xs">
      {label && <p className="text-gray-500 mb-1">{label}</p>}
      {payload.map((entry, i) => (
        <p key={i} style={{ color: entry.color }} className="font-medium">
          {entry.name}: {isCurrency ? formatCurrency(entry.value) : entry.value}
        </p>
      ))}
    </div>
  )
}

// ─── Donut center label ──────────────────────────────────
function DonutCenterLabel({ viewBox, label, value }) {
  const { cx, cy } = viewBox
  return (
    <text x={cx} y={cy} textAnchor="middle" dominantBaseline="central">
      <tspan x={cx} dy="-8" fontSize="11" fill="#666">{label}</tspan>
      <tspan x={cx} dy="18" fontSize="12" fontWeight="600" fill="#333">{value}</tspan>
    </text>
  )
}

// ─── Componente principal ────────────────────────────────
export default function VisaoExecutiva() {
  const { processos, loading, error } = useFilterContext()

  // KPIs computados
  const kpis = useMemo(() => {
    if (!processos.length) return null

    const ativos = processos.filter(p =>
      p.status_processo?.toLowerCase() === 'ativo'
    )
    const provaveis = processos.filter(p =>
      p.classificacao_risco?.toLowerCase() === 'provável'
    )

    const passivoTotal = processos.reduce(
      (sum, p) => sum + parseCurrency(p.valor_provisionado), 0
    )
    const totalPedido = processos.reduce(
      (sum, p) => sum + parseCurrency(p.valor_causa_original), 0
    )
    const totalCondenado = processos.reduce(
      (sum, p) => sum + parseCurrency(p.valor_total_condenacao), 0
    )
    const riscoProvavelValor = provaveis.reduce(
      (sum, p) => sum + parseCurrency(p.valor_provisionado), 0
    )
    const ticketMedio = ativos.length > 0 ? totalPedido / ativos.length : 0

    return {
      processosAtivos: ativos.length,
      passivoTotal,
      totalPedido,
      totalCondenado,
      ticketMedio,
      riscoProvavel: provaveis.length,
      riscoProvavelValor,
    }
  }, [processos])

  // Distribuição por Risco
  const riskData = useMemo(() => {
    if (!processos.length) return []
    const map = {}
    processos.forEach(p => {
      const risco = p.classificacao_risco || 'Não Informado'
      if (!map[risco]) map[risco] = { name: risco, count: 0, value: 0 }
      map[risco].count++
      map[risco].value += parseCurrency(p.valor_provisionado)
    })
    return Object.values(map).sort((a, b) => b.count - a.count)
  }, [processos])

  // Filiais por Passivo
  const branchData = useMemo(() => {
    if (!processos.length) return []
    const map = {}
    processos.forEach(p => {
      const filial = p.filial_unidade_processo || 'Não Informada'
      if (!map[filial]) map[filial] = { name: filial, passivo: 0 }
      map[filial].passivo += parseCurrency(p.valor_provisionado)
    })
    return Object.values(map).sort((a, b) => b.passivo - a.passivo).slice(0, 6)
  }, [processos])

  // Evolução Mensal de Processos
  const monthlyData = useMemo(() => {
    if (!processos.length) return []
    const novosMap = {}
    const encerradosMap = {}
    const allMonths = new Set()

    processos.forEach(p => {
      // Novos: data de distribuição
      const distDate = parseDate(p.data_distribuicao)
      if (distDate) {
        const key = getMonthYear(distDate)
        novosMap[key] = (novosMap[key] || 0) + 1
        allMonths.add(key)
      }
      // Encerrados: processos com status encerrado/arquivado e data de sentença
      const statusLower = (p.status_processo || '').toLowerCase()
      if (statusLower.includes('encerrado') || statusLower.includes('arquivado')) {
        const sentDate = parseDate(p.data_sentenca) || parseDate(p.data_ultima_movimentacao)
        if (sentDate) {
          const key = getMonthYear(sentDate)
          encerradosMap[key] = (encerradosMap[key] || 0) + 1
          allMonths.add(key)
        }
      }
    })

    return Array.from(allMonths)
      .sort((a, b) => {
        const [ma, ya] = a.split('/').map(Number)
        const [mb, yb] = b.split('/').map(Number)
        return ya !== yb ? ya - yb : ma - mb
      })
      .map(month => ({
        month,
        Novos: novosMap[month] || 0,
        Encerrados: encerradosMap[month] || 0,
      }))
  }, [processos])

  // Status dos Processos
  const statusData = useMemo(() => {
    if (!processos.length) return []
    const map = {}
    processos.forEach(p => {
      const status = p.status_processo || 'Não Informado'
      map[status] = (map[status] || 0) + 1
    })
    return Object.entries(map)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
  }, [processos])

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

  const topRisk = riskData[0]

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-5 gap-4">
        <KPICard
          icon={Building2}
          iconBg="bg-slate-700"
          label="Processos Ativos"
          value={kpis?.processosAtivos ?? 0}
        />
        <KPICard
          icon={DollarSign}
          iconBg="bg-emerald-700"
          label="Passivo Total"
          value={formatCurrency(kpis?.passivoTotal, true)}
        />
        <KPICard
          icon={TrendingUp}
          iconBg="bg-accent"
          label="Total Pedido"
          value={formatCurrency(kpis?.totalPedido, true)}
          subtitle={`Condenado: ${formatCurrency(kpis?.totalCondenado)}`}
        />
        <KPICard
          icon={BarChart3}
          iconBg="bg-blue-700"
          label="Ticket Medio"
          value={formatCurrency(kpis?.ticketMedio, true)}
        />
        <KPICard
          icon={AlertTriangle}
          iconBg="bg-red-700"
          label="Risco Provavel"
          value={`${kpis?.riscoProvavel ?? 0} proc.`}
          subtitle={formatCurrency(kpis?.riscoProvavelValor)}
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-2 gap-6">
        {/* Distribuição por Risco */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-base font-semibold text-gray-800 mb-4">Distribuicao por Risco</h3>
          <div className="flex items-center">
            <ResponsiveContainer width="55%" height={220}>
              <PieChart>
                <Pie
                  data={riskData}
                  dataKey="count"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={95}
                  paddingAngle={2}
                  label={false}
                >
                  {riskData.map((entry) => (
                    <Cell
                      key={entry.name}
                      fill={RISK_COLORS[entry.name] || '#D7D7D7'}
                    />
                  ))}
                </Pie>
                {topRisk && (
                  <text x="50%" y="46%" textAnchor="middle" dominantBaseline="central" fontSize="11" fill="#666">
                    {topRisk.name}
                  </text>
                )}
                {topRisk && (
                  <text x="50%" y="56%" textAnchor="middle" dominantBaseline="central" fontSize="11" fontWeight="600" fill="#333">
                    {formatCurrency(topRisk.value)}
                  </text>
                )}
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-col gap-3 ml-2">
              {riskData.map(entry => (
                <div key={entry.name} className="flex items-center gap-2 text-sm">
                  <span
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: RISK_COLORS[entry.name] || '#D7D7D7' }}
                  />
                  <span className="text-gray-700 font-medium">{entry.name}</span>
                  <span className="text-gray-500">- {entry.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Filiais por Passivo */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-base font-semibold text-gray-800 mb-1">Filiais por Passivo</h3>
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-800" />
            <span className="text-xs text-gray-500">
              Passivo - {formatCurrency(branchData.reduce((s, b) => s + b.passivo, 0))}
            </span>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={branchData} layout="vertical" margin={{ left: 10, right: 20 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis
                type="number"
                tickFormatter={v => formatCurrency(v, true)}
                tick={{ fontSize: 11 }}
              />
              <YAxis
                type="category"
                dataKey="name"
                width={110}
                tick={{ fontSize: 11 }}
              />
              <Tooltip content={<CustomTooltip isCurrency />} />
              <Bar dataKey="passivo" name="Passivo" radius={[0, 4, 4, 0]} barSize={22}>
                {branchData.map((_, i) => (
                  <Cell key={i} fill={BRANCH_BLUES[i % BRANCH_BLUES.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-2 gap-6">
        {/* Evolução Mensal */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-base font-semibold text-gray-800 mb-4">Evolucao Mensal de Processos</h3>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={monthlyData} margin={{ left: 0, right: 10 }}>
              <defs>
                <linearGradient id="gradNovos" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#170C80" stopOpacity={0.75} />
                  <stop offset="95%" stopColor="#170C80" stopOpacity={0.05} />
                </linearGradient>
                <linearGradient id="gradEncerrados" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4977C2" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#4977C2" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" tick={{ fontSize: 10 }} angle={-45} textAnchor="end" height={50} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                verticalAlign="top"
                align="center"
                iconType="square"
                wrapperStyle={{ fontSize: 12 }}
              />
              <Area
                type="monotone"
                dataKey="Novos"
                stroke="#170C80"
                fill="url(#gradNovos)"
                strokeWidth={2.5}
              />
              <Area
                type="monotone"
                dataKey="Encerrados"
                stroke="#4977C2"
                fill="url(#gradEncerrados)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Status dos Processos */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-base font-semibold text-gray-800 mb-4">Status dos Processos</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={statusData} margin={{ left: 0, right: 10 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="count" name="Processos" radius={[4, 4, 0, 0]} barSize={50}>
                {statusData.map((entry, i) => (
                  <Cell
                    key={entry.name}
                    fill={STATUS_COLORS[entry.name] || '#D7D7D7'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
