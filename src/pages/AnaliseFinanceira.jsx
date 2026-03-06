import { useMemo, useState } from 'react'
import {
  DollarSign,
  Loader2,
  AlertTriangle,
  Scale,
  Handshake,
  ShieldCheck,
  FileText,
  Info,
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
  PieChart,
  Pie,
  Cell,
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

const STATUS_COLORS = {
  'Ativo': '#7E1E00',
  'Encerrado-Acordo': '#BD2D00',
  'Encerrado-Improcedente': '#FF3E00',
  'Encerrado-Pagamento': '#FFAF96',
  'Arquivado': '#999999',
  'Suspenso': '#D7D7D7',
}

// ─── Info Card ───────────────────────────────────────────
function InfoCard({ icon: Icon, iconColor, borderColor, label, value, subtitle, source, children }) {
  const [showSource, setShowSource] = useState(false)

  return (
    <div className={`bg-white rounded-xl shadow-sm p-5 border-l-4 ${borderColor} relative`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Icon size={18} className={iconColor} />
          <p className="text-sm font-medium text-gray-500">{label}</p>
        </div>
        {source && (
          <button
            onClick={() => setShowSource(prev => !prev)}
            className="w-5 h-5 flex items-center justify-center rounded-full text-gray-300 hover:text-gray-500 hover:bg-gray-100 transition-colors"
          >
            <Info size={13} />
          </button>
        )}
      </div>
      {children || (
        <>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
        </>
      )}
      {source && showSource && (
        <div className="absolute top-10 right-3 z-10 px-3 py-2 bg-gray-800 text-white text-[11px] rounded-lg max-w-[220px] shadow-lg">
          <p className="font-medium mb-0.5">Fonte do dado:</p>
          <p className="text-gray-300">{source}</p>
        </div>
      )}
    </div>
  )
}

// ─── Chart Card ─────────────────────────────────────────
function ChartCard({ title, source, children, className = '' }) {
  const [showSource, setShowSource] = useState(false)

  return (
    <div className={`bg-white rounded-xl shadow-sm p-6 relative ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold text-gray-800">{title}</h3>
        {source && (
          <button
            onClick={() => setShowSource(prev => !prev)}
            className="w-5 h-5 flex items-center justify-center rounded-full text-gray-300 hover:text-gray-500 hover:bg-gray-100 transition-colors"
          >
            <Info size={14} />
          </button>
        )}
      </div>
      {source && showSource && (
        <div className="absolute top-12 right-4 z-10 px-3 py-2 bg-gray-800 text-white text-[11px] rounded-lg max-w-[260px] shadow-lg">
          {source}
        </div>
      )}
      {children}
    </div>
  )
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
      (sum, p) => sum + parseCurrency(p.valor_causa_original), 0
    )
    const comAcordo = processos.filter(p => p.status_processo === 'Encerrado-Acordo')
    const totalAcordo = comAcordo.reduce(
      (sum, p) => sum + parseCurrency(p.valor_acordo_pos_sentenca), 0
    )
    const pedidoComAcordo = comAcordo.reduce(
      (sum, p) => sum + parseCurrency(p.valor_causa_original), 0
    )
    const economiaAcordos = pedidoComAcordo - totalAcordo
    const pctReducao = pedidoComAcordo > 0
      ? ((economiaAcordos / pedidoComAcordo) * 100).toFixed(1)
      : 0

    const totalAtualizado = processos.reduce(
      (sum, p) => sum + parseCurrency(p.valor_atualizado || p.valor_provisionado), 0
    )
    const processosAtualizados = processos.filter(
      p => parseCurrency(p.valor_atualizado || p.valor_provisionado) > 0
    ).length

    // Condenações: processos com valor_total_condenacao > 0
    const condenados = processos.filter(p => parseCurrency(p.valor_total_condenacao) > 0)
    const totalCondenacoes = processos.reduce(
      (sum, p) => sum + parseCurrency(p.valor_total_condenacao) + parseCurrency(p.valor_acordo_pos_sentenca), 0
    )

    // Absolvições = valor_causa_original dos processos ganhos (Arquivado)
    const absolvidos = processos.filter(p => p.status_processo === 'Absolvido')
    const totalAbsolvicoes = absolvidos.reduce(
      (sum, p) => sum + parseCurrency(p.valor_causa_original), 0
    )

    return {
      totalPedido,
      totalCondenado,
      totalAcordo,
      economiaAcordos,
      pctReducao,
      totalAtualizado,
      processosAtualizados,
      totalCondenacoes,
      totalAbsolvicoes,
      qtdTotal: processos.length,
      qtdCondenados: condenados.length,
      qtdAbsolvidos: absolvidos.length,
      qtdComAcordo: comAcordo.length,
    }
  }, [processos])

  // Status dos Processos (pizza)
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

  // Comparativo por Filial
  const filialData = useMemo(() => {
    if (!processos.length) return []
    const map = {}
    processos.forEach(p => {
      const filial = p.filial_unidade_processo || 'Não Informada'
      if (!map[filial]) map[filial] = { name: filial, pedido: 0, condenado: 0, acordo: 0 }
      map[filial].pedido += parseCurrency(p.valor_causa_original)
      map[filial].condenado += parseCurrency(p.valor_causa_original)
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
      {/* Resumo Financeiro */}
      <div className="grid grid-cols-4 gap-4">
        <InfoCard icon={FileText} iconColor="text-blue-500" borderColor="border-blue-500" label="Processos"
          value={formatCurrency(kpis?.totalPedido, true)} subtitle={`${kpis?.qtdTotal ?? 0} processos`}
          source="Soma do valor causa original de todos os processos" />
        <InfoCard icon={Scale} iconColor="text-red-500" borderColor="border-red-500" label="Condenações"
          value={formatCurrency(kpis?.totalCondenacoes, true)} subtitle={`${kpis?.qtdCondenados ?? 0} processos com condenação`}
          source="Soma do valor total de condenação + valor de acordo pós-sentença de todos os processos" />
        <InfoCard icon={Handshake} iconColor="text-yellow-500" borderColor="border-yellow-500" label="Acordos"
          value={formatCurrency(kpis?.economiaAcordos, true)} subtitle={`${kpis?.qtdComAcordo ?? 0} processos com acordo`}
          source="Valor pedido menos valor do acordo, apenas dos processos com status 'Encerrado-Acordo'" />
        <InfoCard icon={ShieldCheck} iconColor="text-green-500" borderColor="border-green-500" label="Absolvições"
          value={formatCurrency(kpis?.totalAbsolvicoes, true)} subtitle={`${kpis?.qtdAbsolvidos ?? 0} processos ganhos`}
          source="Soma do valor causa original dos processos com status 'Absolvido'" />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-2 gap-6">
        <ChartCard title="Status dos Processos" source="Contagem de processos agrupados por status (Ativo, Encerrado-Acordo, Encerrado-Improcedente, etc.)">
          <div className="flex items-center gap-6">
            <div className="shrink-0">
              <ResponsiveContainer width={220} height={220}>
                <PieChart>
                  <Pie
                    data={statusData}
                    dataKey="count"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={95}
                  >
                    {statusData.map((entry, i) => (
                      <Cell
                        key={entry.name}
                        fill={STATUS_COLORS[entry.name] || ['#D7D7D7', '#AAAAAA', '#888888', '#666666'][i % 4]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value, name) => [`${value} processos`, name]}
                    contentStyle={{ fontSize: 12, borderRadius: 8 }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-col gap-2 flex-1">
              {statusData.map((entry, i) => (
                <div key={entry.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: STATUS_COLORS[entry.name] || ['#D7D7D7', '#AAAAAA', '#888888', '#666666'][i % 4] }}
                    />
                    <span className="text-xs text-gray-600">{entry.name}</span>
                  </div>
                  <span className="text-xs font-semibold text-gray-800">{entry.count}</span>
                </div>
              ))}
            </div>
          </div>
        </ChartCard>

        <ChartCard title="Comparativo por Filial" source="Valores de causa original (Pedido), causa original (Condenado) e acordo pós-sentença (Acordo) agrupados por filial">
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
        </ChartCard>
      </div>

      <ChartCard title="Processos por Valor Atualizado" source="Top 10 processos ordenados pelo maior valor atualizado (ou provisionado como alternativa)">
        <div className="overflow-auto max-h-[400px]">
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
      </ChartCard>
    </div>
  )
}
