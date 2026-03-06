import { useMemo } from 'react'
import {
  TrendingDown,
  DollarSign,
  Building2,
  ArrowRight,
  Loader2,
  AlertTriangle,
} from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { useFilterContext } from '../hooks/useFilters'
import { parseCurrency, formatCurrency } from '../utils/format'

// ─── Custom Tooltip ──────────────────────────────────────
function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white shadow-lg rounded-lg px-3 py-2 border border-gray-100 text-xs">
      {label && <p className="text-gray-500 mb-1">{label}</p>}
      {payload.map((entry, i) => (
        <p key={i} style={{ color: entry.color }} className="font-medium">
          {entry.name}: {formatCurrency(entry.value)}
        </p>
      ))}
    </div>
  )
}

// ─── Risk badge ──────────────────────────────────────────
const RISK_BADGE = {
  'Possível': 'bg-yellow-100 text-yellow-700',
  'Provável': 'bg-red-100 text-red-600',
  'Remoto': 'bg-green-100 text-green-700',
}

// ─── Componente principal ────────────────────────────────
export default function AnaliseFinanceira() {
  const { processos, loading, error } = useFilterContext()

  // KPIs
  const kpis = useMemo(() => {
    if (!processos.length) return null

    const totalPedido = processos.reduce(
      (sum, p) => sum + parseCurrency(p.valor_causa_original), 0
    )
    const totalCondenado = processos.reduce(
      (sum, p) => sum + parseCurrency(p.valor_total_condenacao), 0
    )
    const totalAcordo = processos.reduce(
      (sum, p) => sum + parseCurrency(p.valor_acordo_pos_sentenca), 0
    )
    const economiaAcordos = totalAcordo - totalCondenado
    const pctReducao = totalCondenado > 0
      ? ((economiaAcordos / totalCondenado) * 100).toFixed(1)
      : 0

    const totalAtualizado = processos.reduce(
      (sum, p) => sum + parseCurrency(p.valor_atualizado || p.valor_provisionado), 0
    )
    const processosAtualizados = processos.filter(
      p => parseCurrency(p.valor_atualizado || p.valor_provisionado) > 0
    ).length

    return {
      totalPedido,
      totalCondenado,
      totalAcordo,
      economiaAcordos,
      pctReducao,
      totalAtualizado,
      processosAtualizados,
    }
  }, [processos])

  // Funil financeiro
  const funil = useMemo(() => {
    if (!kpis) return []
    return [
      { label: 'Valor Perdido', value: kpis.totalPedido, color: 'border-red-500', textColor: 'text-red-600' },
      { label: 'Valor Condenado', value: kpis.totalCondenado, color: 'border-orange-400', textColor: 'text-orange-500' },
      { label: 'Valor Atualizado', value: kpis.totalAtualizado, color: 'border-yellow-500', textColor: 'text-yellow-600' },
      { label: 'Valor Acordo/Pago', value: kpis.totalAcordo, color: 'border-green-500', textColor: 'text-green-600' },
    ]
  }, [kpis])

  // Comparativo por Filial
  const filialData = useMemo(() => {
    if (!processos.length) return []
    const map = {}
    processos.forEach(p => {
      const filial = p.filial_unidade_processo || 'Não Informada'
      if (!map[filial]) map[filial] = { name: filial, pedido: 0, condenado: 0, acordo: 0 }
      map[filial].pedido += parseCurrency(p.valor_causa_original)
      map[filial].condenado += parseCurrency(p.valor_total_condenacao)
      map[filial].acordo += parseCurrency(p.valor_acordo_pos_sentenca)
    })
    return Object.values(map).sort((a, b) => b.pedido - a.pedido).slice(0, 8)
  }, [processos])

  // Top processos por valor atualizado
  const topProcessos = useMemo(() => {
    if (!processos.length) return []
    return [...processos]
      .map(p => ({
        numero: p.numero_processo || '-',
        reclamante: p.nome_reclamante || p.parte_contraria || '-',
        valor: parseCurrency(p.valor_atualizado || p.valor_provisionado),
        risco: p.classificacao_risco || 'Não Informado',
      }))
      .sort((a, b) => b.valor - a.valor)
      .slice(0, 10)
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

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="flex items-center justify-center gap-10">
        {/* Total Pedido */}
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center">
            <TrendingDown size={24} className="text-red-500" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Total pedido</p>
            <p className="text-2xl font-bold text-gray-900">
              {formatCurrency(kpis?.totalPedido, true)}
            </p>
          </div>
        </div>

        {/* Economia em Acordos */}
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-yellow-100 flex items-center justify-center">
            <DollarSign size={24} className="text-yellow-500" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Economia em Acordos</p>
            <p className="text-2xl font-bold text-gray-900">
              {formatCurrency(kpis?.economiaAcordos, true)}
            </p>
            <p className="text-xs text-gray-400">{kpis?.pctReducao}% de redução</p>
          </div>
        </div>

        {/* Processos Atualizados */}
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center">
            <Building2 size={24} className="text-green-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Processos Atualizados</p>
            <p className="text-2xl font-bold text-gray-900">
              {kpis?.processosAtualizados ?? 0}
            </p>
          </div>
        </div>
      </div>

      {/* Funil Financeiro */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-base font-semibold text-gray-800 mb-6">Funil Financeiro</h3>
        <div className="flex items-center justify-center gap-4">
          {funil.map((item, i) => (
            <div key={item.label} className="flex items-center gap-4">
              <div className={`border-l-4 ${item.color} bg-white rounded-xl shadow-sm px-6 py-4 min-w-[180px] text-center`}>
                <p className="text-sm text-gray-600 mb-1">{item.label}</p>
                <p className={`text-xl font-bold ${item.textColor}`}>
                  {formatCurrency(item.value, true)}
                </p>
              </div>
              {i < funil.length - 1 && (
                <ArrowRight size={20} className="text-gray-400 shrink-0" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-2 gap-6">
        {/* Comparativo por Filial */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-base font-semibold text-gray-800 mb-4">Comparativo por Filial</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={filialData} margin={{ left: 10, right: 10, bottom: 40 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 10 }}
                angle={-35}
                textAnchor="end"
                interval={0}
              />
              <YAxis
                tick={{ fontSize: 11 }}
                tickFormatter={v => formatCurrency(v, true)}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                verticalAlign="top"
                align="right"
                iconType="square"
                wrapperStyle={{ fontSize: 12 }}
              />
              <Bar dataKey="pedido" name="Pedido" fill="#7E1E00" radius={[2, 2, 0, 0]} barSize={16} />
              <Bar dataKey="condenado" name="Condenado" fill="#BD2D00" radius={[2, 2, 0, 0]} barSize={16} />
              <Bar dataKey="acordo" name="Acordo" fill="#FF3E00" radius={[2, 2, 0, 0]} barSize={16} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Processos por Valor Atualizado */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-base font-semibold text-gray-800 mb-4">Processos por Valor Atualizado</h3>
          <div className="overflow-auto max-h-[340px]">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-white">
                <tr className="text-left text-gray-500 border-b border-gray-200">
                  <th className="pb-2 font-medium">Processo</th>
                  <th className="pb-2 font-medium">Reclamante</th>
                  <th className="pb-2 font-medium text-right">Valor</th>
                  <th className="pb-2 font-medium text-center">Risco</th>
                </tr>
              </thead>
              <tbody>
                {topProcessos.map((p, i) => (
                  <tr
                    key={i}
                    className={`border-b border-gray-100 ${i % 2 === 0 ? 'bg-gray-50/50' : ''}`}
                  >
                    <td className="py-3 text-gray-700 text-xs font-mono">{p.numero}</td>
                    <td className="py-3 text-gray-700 text-xs truncate max-w-[200px]">{p.reclamante}</td>
                    <td className="py-3 text-gray-900 text-xs font-medium text-right whitespace-nowrap">
                      {formatCurrency(p.valor)}
                    </td>
                    <td className="py-3 text-center">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${RISK_BADGE[p.risco] || 'bg-gray-100 text-gray-600'}`}>
                        {p.risco}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
