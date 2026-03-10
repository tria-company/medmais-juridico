import { useMemo } from 'react'
import { useState } from 'react'
import { Loader2, AlertTriangle, Info } from 'lucide-react'
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
const BLUES = ['#170C80', '#1e2080', '#252e90', '#294C99', '#3560ab', '#4C7DC5', '#457FFF', '#5a8fd5', '#6da0e0', '#80b0ea', '#93c0f0', '#a6d0f8']
const REDS = ['#7E1E00', '#8B2500', '#9A2B00', '#AA3200', '#BD2D00', '#C32F00', '#D44020', '#E05030', '#EC6040', '#F57050', '#FF8060', '#FF9070']

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
        Valor – {formatCurrency(d.totalValue)}
      </p>
    </div>
  )
}

function TribunalTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  const d = payload[0]?.payload
  if (!d) return null
  return (
    <div className="bg-gray-800 text-white shadow-lg rounded-lg px-3 py-2 text-xs">
      <p className="font-medium mb-1">{d.name}</p>
      <p>Quantidade – {d.count}</p>
      <p>Valor – {formatCurrency(d.totalValue)}</p>
    </div>
  )
}

function ProcessoTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  const d = payload[0]?.payload
  if (!d) return null
  return (
    <div className="bg-gray-800 text-white shadow-lg rounded-lg px-3 py-2 text-xs max-w-xs">
      <p className="font-medium mb-1 truncate">{d.name}</p>
      {d.reclamante && <p className="text-gray-300">{d.reclamante}</p>}
      <p>Valor – {formatCurrency(d.valor)}</p>
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

// ─── Info Tooltip ────────────────────────────────────────
function InfoTip({ text }) {
  const [show, setShow] = useState(false)
  return (
    <span className="relative inline-flex">
      <button
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        className="text-gray-400 hover:text-gray-600 transition-colors"
      >
        <Info size={14} />
      </button>
      {show && (
        <div className="absolute left-0 top-full mt-2 w-64 bg-gray-800 text-white text-xs rounded-lg px-3 py-2 shadow-lg z-50 leading-relaxed pointer-events-none">
          {text}
          <div className="absolute left-3 bottom-full w-0 h-0 border-x-[5px] border-x-transparent border-b-[5px] border-b-gray-800" />
        </div>
      )}
    </span>
  )
}

// ─── Parser de pedidos_verbas (JSON) ─────────────────────
function parsePedidosVerbas(text) {
  if (!text) return []
  try {
    const parsed = typeof text === 'string' ? JSON.parse(text) : text
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function parseValor(v) {
  if (!v || v === 'informacao nao disponivel') return 0
  return parseCurrency(v)
}

// ─── Componente principal ────────────────────────────────
export default function RankingVerbas() {
  const { processos, loading, error } = useFilterContext()

  // Agregar verbas a partir de pedidos_verbas
  const verbaData = useMemo(() => {
    if (!processos.length) return []
    const map = {}
    processos.forEach(p => {
      const verbas = parsePedidosVerbas(p.pedidos_verbas)
      if (!verbas.length) return
      verbas.forEach(v => {
        const nome = v.tipo_verba || 'Não Informada'
        if (!map[nome]) map[nome] = { name: nome, count: 0, totalValue: 0, deferida: 0, valorDeferido: 0 }
        map[nome].count++
        map[nome].totalValue += parseValor(v.valor_pedido)
        const status = (v.status_pedido || '').toLowerCase()
        if (status.includes('deferido') && !status.includes('indeferido')) {
          map[nome].deferida++
          map[nome].valorDeferido += parseValor(v.valor_deferido_sentenca) + parseValor(v.valor_deferido_acordao)
        }
      })
    })
    return Object.values(map).sort((a, b) => b.totalValue - a.totalValue)
  }, [processos])

  // Top por quantidade
  const topByCount = useMemo(() => {
    return [...verbaData].sort((a, b) => b.count - a.count).slice(0, 12)
  }, [verbaData])

  // Top por valor
  const topByValue = useMemo(() => {
    return [...verbaData].sort((a, b) => b.totalValue - a.totalValue).slice(0, 12)
  }, [verbaData])

  const hasValueData = useMemo(() => topByValue.some(v => v.totalValue > 0), [topByValue])

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

  // Ranking de tribunais por valor e quantidade
  const tribunalData = useMemo(() => {
    if (!processos.length) return []
    const map = {}
    processos.forEach(p => {
      const tribunal = p.tribunal || 'Não Informado'
      if (!map[tribunal]) map[tribunal] = { name: tribunal, count: 0, totalValue: 0 }
      map[tribunal].count++
      map[tribunal].totalValue += parseCurrency(p.valor_causa_original)
    })
    return Object.values(map).sort((a, b) => b.totalValue - a.totalValue)
  }, [processos])

  const topTribunaisByValue = useMemo(() => tribunalData.slice(0, 12), [tribunalData])
  const topTribunaisByCount = useMemo(() =>
    [...tribunalData].sort((a, b) => b.count - a.count).slice(0, 12),
    [tribunalData]
  )

  // Ranking de processos individuais por valor
  const topProcessosByValue = useMemo(() => {
    if (!processos.length) return []
    return processos
      .map(p => ({
        name: p.numero_processo || 'Sem Número',
        reclamante: p.nome_reclamante || '',
        valor: parseCurrency(p.valor_causa_original),
      }))
      .filter(p => p.valor > 0)
      .sort((a, b) => b.valor - a.valor)
      .slice(0, 15)
  }, [processos])

  // Tabela de verbas
  const tabelaVerbas = useMemo(() => {
    return verbaData.map(v => ({
      name: v.name,
      qtdPedida: v.count,
      qtdDeferida: v.deferida,
      valorTotal: v.totalValue,
      valorMedio: v.count > 0 ? v.totalValue / v.count : 0,
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
          <h3 className="text-base font-semibold text-gray-800 mb-4 flex items-center gap-2">
            Verbas Mais Pedidas (Quantidade)
            <InfoTip text="Ranking das verbas trabalhistas mais solicitadas nos processos, ordenadas pela quantidade de vezes que foram pedidas." />
          </h3>
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
          <h3 className="text-base font-semibold text-gray-800 mb-4 flex items-center gap-2">
            Verbas por Valor Pedido
            <InfoTip text="Ranking das verbas trabalhistas pelo valor total pedido nos processos. Valores 'não disponíveis' são contabilizados como R$ 0,00." />
          </h3>
          {hasValueData ? (
            <ResponsiveContainer width="100%" height={360}>
              <BarChart data={topByValue} layout="vertical" margin={{ left: 10, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis
                  type="number"
                  tick={{ fontSize: 11 }}
                  domain={[0, 'dataMax']}
                  tickFormatter={v => formatCurrency(v, true)}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={140}
                  tick={{ fontSize: 10 }}
                />
                <Tooltip content={<BarTooltip />} />
                <Bar dataKey="totalValue" name="Valor" radius={[0, 4, 4, 0]} barSize={20}>
                  {topByValue.map((_, i) => (
                    <Cell key={i} fill={REDS[i % REDS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[360px] text-gray-400 text-sm">
              Dados de valor não disponíveis para as verbas encontradas.
            </div>
          )}
        </div>
      </div>

      {/* Ranking de Tribunais */}
      <div className="grid grid-cols-2 gap-6">
        {/* Tribunais por Quantidade */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-base font-semibold text-gray-800 mb-4 flex items-center gap-2">
            Tribunais por Quantidade
            <InfoTip text="Ranking dos tribunais pela quantidade de processos." />
          </h3>
          <ResponsiveContainer width="100%" height={360}>
            <BarChart data={topTribunaisByCount} layout="vertical" margin={{ left: 10, right: 20 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis type="category" dataKey="name" width={140} tick={{ fontSize: 10 }} />
              <Tooltip content={<TribunalTooltip />} />
              <Bar dataKey="count" name="Quantidade" radius={[0, 4, 4, 0]} barSize={20}>
                {topTribunaisByCount.map((_, i) => (
                  <Cell key={i} fill={BLUES[i % BLUES.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Tribunais por Valor */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-base font-semibold text-gray-800 mb-4 flex items-center gap-2">
            Tribunais por Valor
            <InfoTip text="Ranking dos tribunais pelo valor total da causa original dos processos." />
          </h3>
          <ResponsiveContainer width="100%" height={360}>
            <BarChart data={topTribunaisByValue} layout="vertical" margin={{ left: 10, right: 20 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={v => formatCurrency(v, true)} />
              <YAxis type="category" dataKey="name" width={140} tick={{ fontSize: 10 }} />
              <Tooltip content={<TribunalTooltip />} />
              <Bar dataKey="totalValue" name="Valor" radius={[0, 4, 4, 0]} barSize={20}>
                {topTribunaisByValue.map((_, i) => (
                  <Cell key={i} fill={REDS[i % REDS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Ranking de Processos por Valor */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-base font-semibold text-gray-800 mb-4 flex items-center gap-2">
          Maiores Processos por Valor da Causa
          <InfoTip text="Top 15 processos individuais com maior valor da causa original." />
        </h3>
        <ResponsiveContainer width="100%" height={450}>
          <BarChart data={topProcessosByValue} layout="vertical" margin={{ left: 10, right: 20 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
            <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={v => formatCurrency(v, true)} />
            <YAxis
              type="category"
              dataKey="name"
              width={180}
              tick={{ fontSize: 9 }}
            />
            <Tooltip content={<ProcessoTooltip />} />
            <Bar dataKey="valor" name="Valor" radius={[0, 4, 4, 0]} barSize={18}>
              {topProcessosByValue.map((_, i) => (
                <Cell key={i} fill={BLUES[i % BLUES.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Evolução Mensal */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-base font-semibold text-gray-800 mb-4 flex items-center gap-2">
          Evolução Mensal de Processos
          <InfoTip text="Quantidade de processos distribuídos por mês, com base na data de distribuição de cada processo." />
        </h3>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={monthlyData} margin={{ left: 0, right: 10 }}>
            <defs>
              <linearGradient id="gradProcessos" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#170C80" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#170C80" stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" tick={{ fontSize: 10 }} angle={-45} textAnchor="end" height={50} />
            <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
            <Tooltip content={<AreaTooltip />} />
            <Area
              type="monotone"
              dataKey="Processos"
              stroke="#170C80"
              fill="url(#gradProcessos)"
              strokeWidth={2.5}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Tabela de Verbas */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-base font-semibold text-gray-800 mb-4 flex items-center gap-2">
          Ranking de Verbas
          <InfoTip text="Tabela detalhada com quantidade pedida, deferida, valores totais e médios, e taxa de sucesso (% de pedidos deferidos) de cada verba." />
        </h3>
        <div className="overflow-auto max-h-[400px]">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-white z-10">
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
