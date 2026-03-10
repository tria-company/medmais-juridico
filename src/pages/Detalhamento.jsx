import { useState, useMemo, useRef, useEffect, Fragment } from 'react'
import { Search, X, ChevronDown, ChevronRight, Loader2, AlertTriangle, Download } from 'lucide-react'
import { useFilterContext } from '../hooks/useFilters'
import { parseCurrency, formatCurrency } from '../utils/format'

// ─── Risk / Status badges ────────────────────────────────
const RISK_BADGE = {
  'Possível': 'bg-yellow-100 text-yellow-700',
  'Provável': 'bg-red-100 text-red-600',
  'Remoto': 'bg-green-100 text-green-700',
}
const STATUS_COLOR = {
  'Ativo': 'text-green-600',
  'Arquivado': 'text-gray-500',
  'Encerrado-Acordo': 'text-gray-500',
  'Suspenso': 'text-yellow-600',
}

// ─── Info Row ────────────────────────────────────────────
function InfoRow({ label, value }) {
  return (
    <div className="flex justify-between py-1">
      <span className="text-xs text-gray-500">{label}</span>
      <span className="text-xs text-gray-800 font-medium text-right max-w-[60%] truncate">{value || '—'}</span>
    </div>
  )
}

// ─── Search Box com autocomplete ─────────────────────────
function ProcessoSearchBox({ processos, search, onSearch }) {
  const [open, setOpen] = useState(false)
  const [highlightIdx, setHighlightIdx] = useState(-1)
  const ref = useRef(null)
  const listRef = useRef(null)

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const results = useMemo(() => {
    if (!search.trim()) return []
    const q = search.toLowerCase()
    return processos.filter(p =>
      (p.numero_processo || '').toLowerCase().includes(q) ||
      (p.nome_reclamante || '').toLowerCase().includes(q) ||
      (p.parte_contraria || '').toLowerCase().includes(q) ||
      (p.filial_unidade_processo || '').toLowerCase().includes(q)
    ).slice(0, 15)
  }, [search, processos])

  useEffect(() => { setHighlightIdx(-1) }, [results])

  useEffect(() => {
    if (highlightIdx < 0 || !listRef.current) return
    const items = listRef.current.querySelectorAll('[data-item]')
    if (items[highlightIdx]) items[highlightIdx].scrollIntoView({ block: 'nearest' })
  }, [highlightIdx])

  const handleKeyDown = (e) => {
    if (!open || !results.length) return
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setHighlightIdx(prev => Math.min(prev + 1, results.length - 1))
        break
      case 'ArrowUp':
        e.preventDefault()
        setHighlightIdx(prev => Math.max(prev - 1, 0))
        break
      case 'Enter':
        e.preventDefault()
        if (highlightIdx >= 0 && results[highlightIdx]) {
          const p = results[highlightIdx]
          onSearch(p.numero_processo || p.nome_reclamante || '')
          setOpen(false)
        }
        break
      case 'Escape':
        setOpen(false)
        setHighlightIdx(-1)
        break
    }
  }

  return (
    <div ref={ref} className="relative flex-1">
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Buscar por número do processo, reclamante ou filial..."
          value={search}
          onChange={(e) => { onSearch(e.target.value); setOpen(true) }}
          onFocus={() => { if (search) setOpen(true) }}
          onKeyDown={handleKeyDown}
          className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-700 hover:border-gray-400 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors"
        />
        {search && (
          <button
            onClick={() => { onSearch(''); setOpen(false) }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={16} />
          </button>
        )}
      </div>
      {open && results.length > 0 && (
        <div ref={listRef} className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-auto">
          {results.map((p, i) => (
            <button
              key={p.id}
              data-item
              onClick={() => { onSearch(p.numero_processo || p.nome_reclamante || ''); setOpen(false) }}
              className={`w-full text-left px-4 py-2.5 text-sm transition-colors border-b border-gray-50 ${
                i === highlightIdx ? 'bg-brand-500/10 text-brand-500' : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <span className="font-mono text-xs">{p.numero_processo || `#${p.id}`}</span>
              {(p.nome_reclamante || p.parte_contraria) && (
                <span className="text-gray-400 ml-2">— {p.nome_reclamante || p.parte_contraria}</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Expanded Detail ─────────────────────────────────────
function ProcessDetail({ p }) {
  return (
    <tr>
      <td colSpan={7} className="px-4 pb-4 pt-0">
        <div className="grid grid-cols-3 gap-4 mt-2">
          {/* Reclamante */}
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
            <h4 className="text-sm font-semibold text-gray-800 mb-2">Reclamante</h4>
            <InfoRow label="Cargo" value={p.cargo_reclamante || p.cargo} />
            <InfoRow label="Depto" value={p.departamento_reclamante} />
            <InfoRow label="Desligamento" value={p.tipo_desligamento} />
            <InfoRow label="Motivo Principal" value={p.motivo_principal_reclamacao} />
          </div>

          {/* Pedidos */}
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
            <h4 className="text-sm font-semibold text-gray-800 mb-2">Pedidos</h4>
            <InfoRow label="Valor Causa" value={formatCurrency(parseCurrency(p.valor_causa_original))} />
            <InfoRow label="Provisionado" value={formatCurrency(parseCurrency(p.valor_provisionado))} />
            <InfoRow label="Condenação" value={formatCurrency(parseCurrency(p.valor_total_condenacao))} />
            <InfoRow label="Acordo" value={formatCurrency(parseCurrency(p.valor_acordo_pos_sentenca))} />
          </div>

          {/* Sentença */}
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
            <h4 className="text-sm font-semibold text-gray-800 mb-2">Sentença</h4>
            <InfoRow label="Resultado" value={p.resultado_sentenca} />
            <InfoRow label="Condenação" value={formatCurrency(parseCurrency(p.valor_total_condenacao))} />
            <InfoRow label="Data" value={p.data_sentenca} />
          </div>

          {/* Risco */}
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
            <h4 className="text-sm font-semibold text-gray-800 mb-2">Risco</h4>
            <InfoRow label="Classificação" value={p.classificacao_risco} />
            <InfoRow label="Provisionado" value={formatCurrency(parseCurrency(p.valor_provisionado))} />
            <InfoRow label="Recomendação" value={p.recomendacao_estrategica} />
          </div>

          {/* Atualização Financeira */}
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
            <h4 className="text-sm font-semibold text-gray-800 mb-2">Atualização Financeira</h4>
            <InfoRow label="Atualizado" value={formatCurrency(parseCurrency(p.valor_total_atualizado || p.valor_provisionado))} />
            <InfoRow label="Líquido" value={formatCurrency(parseCurrency(p.valor_liquido_estimado || '0'))} />
          </div>

          {/* Últimos Atos */}
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
            <h4 className="text-sm font-semibold text-gray-800 mb-2">Últimos Atos</h4>
            <div className="space-y-2">
              {p.data_ultima_movimentacao && (
                <div className="text-xs">
                  <span className="text-gray-400">{p.data_ultima_movimentacao}</span>
                  <p className="text-gray-700 mt-0.5 leading-relaxed">
                    {p.descricao_ultima_movimentacao || p.ultima_movimentacao || 'Movimentação registrada'}
                  </p>
                </div>
              )}
              {!p.data_ultima_movimentacao && (
                <p className="text-xs text-gray-400">Nenhum ato registrado</p>
              )}
            </div>
          </div>
        </div>
      </td>
    </tr>
  )
}

// ─── Componente principal ────────────────────────────────
export default function Detalhamento() {
  const { processos, loading, error } = useFilterContext()
  const [search, setSearch] = useState('')
  const [expandedId, setExpandedId] = useState(null)

  // Filtrar por busca textual
  const filtered = useMemo(() => {
    if (!search) return processos
    const s = search.toLowerCase()
    return processos.filter(p => {
      return (
        (p.numero_processo || '').toLowerCase().includes(s) ||
        (p.nome_reclamante || '').toLowerCase().includes(s) ||
        (p.parte_contraria || '').toLowerCase().includes(s) ||
        (p.filial_unidade_processo || '').toLowerCase().includes(s)
      )
    })
  }, [processos, search])

  // Export CSV
  const exportCSV = () => {
    const headers = ['Processo', 'Reclamante', 'Filial', 'Fase', 'Status', 'Valor Causa', 'Risco']
    const rows = filtered.map(p => [
      p.numero_processo || '',
      p.nome_reclamante || p.parte_contraria || '',
      p.filial_unidade_processo || '',
      p.fase_processual_atual || '',
      p.status_processo || '',
      parseCurrency(p.valor_causa_original),
      p.classificacao_risco || '',
    ])
    const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(',')).join('\n')
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'processos_detalhamento.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

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
    <div className="space-y-4">
      {/* Search + Count + Export */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="flex items-center gap-4">
          <ProcessoSearchBox processos={processos} search={search} onSearch={setSearch} />
          <div className="flex items-center gap-3 shrink-0">
            <span className="text-xs text-gray-400 whitespace-nowrap">{filtered.length} processo(s)</span>
            <button
              onClick={exportCSV}
              className="flex items-center gap-1.5 bg-brand-500 text-white text-xs font-medium px-4 py-2 rounded-lg hover:bg-brand-600 transition-colors whitespace-nowrap"
            >
              <Download size={14} />
              Exportar CSV
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-base font-semibold text-gray-800 mb-4">Processos por Valor Atualizado</h3>
        <div className="overflow-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b border-gray-200">
                <th className="pb-2 font-medium w-8"></th>
                <th className="pb-2 font-medium">Processo</th>
                <th className="pb-2 font-medium">Reclamante</th>
                <th className="pb-2 font-medium">Filia</th>
                <th className="pb-2 font-medium">Fase</th>
                <th className="pb-2 font-medium">Status</th>
                <th className="pb-2 font-medium text-right">Valor Causa</th>
                <th className="pb-2 font-medium text-center">Risco</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => {
                const isOpen = expandedId === p.id
                return (
                  <Fragment key={p.id}>
                    <tr
                      onClick={() => setExpandedId(isOpen ? null : p.id)}
                      className={`border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${isOpen ? 'bg-gray-50' : ''}`}
                    >
                      <td className="py-3 pl-2">
                        {isOpen
                          ? <ChevronDown size={16} className="text-gray-400" />
                          : <ChevronRight size={16} className="text-gray-400" />
                        }
                      </td>
                      <td className="py-3 text-gray-700 text-xs font-mono">{p.numero_processo || '-'}</td>
                      <td className="py-3 text-gray-700 text-xs">{p.nome_reclamante || p.parte_contraria || '-'}</td>
                      <td className="py-3 text-gray-600 text-xs">{p.filial_unidade_processo || '-'}</td>
                      <td className="py-3 text-gray-600 text-xs">{p.fase_processual_atual || '-'}</td>
                      <td className={`py-3 text-xs font-medium ${STATUS_COLOR[p.status_processo] || 'text-gray-600'}`}>
                        {p.status_processo || '-'}
                      </td>
                      <td className="py-3 text-gray-900 text-xs font-medium text-right whitespace-nowrap">
                        {formatCurrency(parseCurrency(p.valor_causa_original))}
                      </td>
                      <td className="py-3 text-center">
                        <span className={`text-xs px-2 py-0.5 rounded font-medium ${RISK_BADGE[p.classificacao_risco] || 'bg-gray-100 text-gray-600'}`}>
                          {p.classificacao_risco || '-'}
                        </span>
                      </td>
                    </tr>
                    {isOpen && <ProcessDetail p={p} />}
                  </Fragment>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
