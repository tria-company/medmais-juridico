import { useState, useMemo } from 'react'
import { ChevronDown, Loader2, AlertTriangle } from 'lucide-react'
import { useFilterContext } from '../hooks/useFilters'
import { parseCurrency, formatCurrency, parseDate } from '../utils/format'

// ─── Info Row ────────────────────────────────────────────
function InfoRow({ label, value }) {
  return (
    <div className="flex justify-between py-1.5">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-sm text-gray-800 font-medium text-right max-w-[55%]">{value || '—'}</span>
    </div>
  )
}

// ─── Timeline Item ───────────────────────────────────────
function TimelineItem({ date, type, description }) {
  return (
    <div className="flex gap-4">
      {/* Dot + Line */}
      <div className="flex flex-col items-center">
        <div className="w-3.5 h-3.5 rounded-full border-2 border-red-500 bg-white shrink-0 mt-1" />
        <div className="w-px flex-1 bg-gray-200" />
      </div>
      {/* Content */}
      <div className="bg-gray-50 rounded-xl border border-gray-100 px-5 py-4 mb-4 flex-1">
        <div className="flex items-center gap-3 mb-1.5">
          <span className="text-xs text-gray-500">{date}</span>
          {type && (
            <span className="text-xs bg-green-600 text-white px-2 py-0.5 rounded font-medium">
              {type}
            </span>
          )}
        </div>
        <p className="text-sm text-gray-700 leading-relaxed">{description}</p>
      </div>
    </div>
  )
}

// ─── Componente principal ────────────────────────────────
export default function TimelinePage() {
  const { processos, loading, error } = useFilterContext()
  const [selectedId, setSelectedId] = useState('')

  const selected = useMemo(() => {
    if (!selectedId) return null
    return processos.find(p => String(p.id) === selectedId) || null
  }, [selectedId, processos])

  // Gerar timeline de atos do processo selecionado
  const timelineItems = useMemo(() => {
    if (!selected) return []
    const items = []

    // Movimentações do processo
    if (selected.ultima_movimentacao || selected.descricao_ultima_movimentacao) {
      items.push({
        date: selected.data_ultima_movimentacao || '—',
        type: 'Movimentação',
        description: selected.descricao_ultima_movimentacao || selected.ultima_movimentacao || 'Última movimentação do processo',
      })
    }

    if (selected.data_sentenca) {
      items.push({
        date: selected.data_sentenca,
        type: 'Sentença',
        description: selected.resultado_sentenca || 'Sentença proferida',
      })
    }

    if (selected.data_audiencia) {
      items.push({
        date: selected.data_audiencia,
        type: 'Audiência',
        description: selected.tipo_audiencia || 'Audiência realizada',
      })
    }

    if (selected.data_distribuicao) {
      items.push({
        date: selected.data_distribuicao,
        type: 'Despacho',
        description: `Processo distribuído na ${selected.vara || 'vara'} - ${selected.tribunal || ''}. ${selected.materia || ''}`,
      })
    }

    // Se não tem nenhum evento, criar um placeholder
    if (items.length === 0) {
      items.push({
        date: selected.data_distribuicao || '—',
        type: 'Despacho',
        description: 'Registro do processo no sistema',
      })
    }

    return items
  }, [selected])

  // Calcular tramitação em dias
  const tramitacaoDias = useMemo(() => {
    if (!selected?.data_distribuicao) return '—'
    const dist = parseDate(selected.data_distribuicao)
    if (!dist) return '—'
    const now = new Date()
    const diff = Math.floor((now - dist) / (1000 * 60 * 60 * 24))
    return `${diff} dias`
  }, [selected])

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
      {/* Seletor de Processo */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-base font-semibold text-gray-800 mb-3">Selecione um Processo</h3>
        <div className="relative">
          <select
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
            className="appearance-none w-full bg-white border border-gray-300 rounded-lg px-4 py-3 pr-10 text-sm text-gray-700 cursor-pointer hover:border-gray-400 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors"
          >
            <option value="">- Selecione -</option>
            {processos.map(p => (
              <option key={p.id} value={String(p.id)}>
                {p.numero_processo || `Processo #${p.id}`}
              </option>
            ))}
          </select>
          <ChevronDown
            size={16}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
          />
        </div>
      </div>

      {selected && (
        <div className="grid grid-cols-[380px_1fr] gap-6">
          {/* Coluna Esquerda - Dados */}
          <div className="space-y-6">
            {/* Dados do Processo */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-base font-semibold text-gray-800 mb-3">Dados do Processo</h3>
              <div className="divide-y divide-gray-100">
                <InfoRow label="Número" value={selected.numero_processo} />
                <InfoRow label="Fase" value={selected.fase_atual} />
                <InfoRow label="Status" value={selected.status_processo} />
                <InfoRow label="Tribunal" value={selected.tribunal} />
                <InfoRow label="Vara" value={selected.vara} />
                <InfoRow label="Filial" value={selected.filial_unidade_processo} />
                <InfoRow label="Valor da Causa" value={formatCurrency(parseCurrency(selected.valor_causa_original))} />
                <InfoRow label="Tramitação" value={tramitacaoDias} />
              </div>
            </div>

            {/* Reclamante */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-base font-semibold text-gray-800 mb-3">Reclamante</h3>
              <div className="divide-y divide-gray-100">
                <InfoRow label="Cargo" value={selected.cargo_reclamante || selected.cargo} />
                <InfoRow label="Depto" value={selected.departamento} />
                <InfoRow label="Desligamento" value={selected.tipo_desligamento} />
                <InfoRow label="Tempo Casa" value={selected.tempo_casa} />
                <InfoRow label="Último Salário" value={selected.ultimo_salario ? formatCurrency(parseCurrency(selected.ultimo_salario)) : null} />
                <InfoRow label="Motivo Principal" value={selected.materia || selected.natureza} />
              </div>
            </div>

            {/* Risco */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-base font-semibold text-gray-800 mb-3">
                Risco: {selected.classificacao_risco || 'Não Informado'}
              </h3>
              <div className="divide-y divide-gray-100">
                <InfoRow label="Prob. Perda" value={selected.probabilidade_perda || '—'} />
                <InfoRow label="Provisionado" value={formatCurrency(parseCurrency(selected.valor_provisionado))} />
                <InfoRow label="Cenário Base" value={formatCurrency(parseCurrency(selected.valor_provisionado))} />
                <InfoRow label="Recomendação" value={selected.recomendacao} />
              </div>
            </div>
          </div>

          {/* Coluna Direita - Timeline */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-base font-semibold text-gray-800 mb-6">Timeline dos Atos</h3>
            <div className="pl-2">
              {timelineItems.map((item, i) => (
                <TimelineItem
                  key={i}
                  date={item.date}
                  type={item.type}
                  description={item.description}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {!selected && (
        <div className="flex items-center justify-center h-64 text-gray-400">
          <p className="text-sm">Selecione um processo para ver os detalhes e timeline</p>
        </div>
      )}
    </div>
  )
}
