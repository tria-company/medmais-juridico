import { useState, useMemo, useRef, useEffect } from 'react'
import { Search, X, Loader2, AlertTriangle, ChevronUp, ChevronDown, Navigation } from 'lucide-react'
import { useFilterContext } from '../hooks/useFilters'
import { parseCurrency, formatCurrency, parseDate } from '../utils/format'
import { supabase } from '../lib/supabase'

// ─── Badge colors por tipo de ato ────────────────────────
const TYPE_BADGE = {
  'Despacho': 'bg-green-600 text-white',
  'Sentença': 'bg-red-600 text-white',
  'Audiência': 'bg-blue-600 text-white',
  'Ata da Audiência': 'bg-blue-500 text-white',
  'Movimentação': 'bg-yellow-500 text-white',
  'Decisão': 'bg-purple-600 text-white',
  'Acordo': 'bg-emerald-600 text-white',
}

// ─── Info Row ────────────────────────────────────────────
function InfoRow({ label, value }) {
  return (
    <div className="flex justify-between py-1.5">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-sm text-gray-800 font-medium text-right max-w-[55%]">{value || '—'}</span>
    </div>
  )
}


// ─── Timeline Item (etapa0) ──────────────────────────────
function AtoItem({ ato, isLast }) {
  const tipo = ato.tipo && ato.tipo !== 'undefined' ? ato.tipo : null
  const badgeClass = tipo ? (TYPE_BADGE[tipo] || 'bg-gray-600 text-white') : null
  const justificativa = ato.justificativa && ato.justificativa !== 'Sem evidencia no documento analisado.' ? ato.justificativa : null

  // Formatar data (limpar prefixos como "Data do documento: ")
  const dataFormatada = useMemo(() => {
    if (!ato.data) return '—'
    try {
      // Extrair a parte ISO da string (ex: "Data do documento: 2026-03-03T14:05:51")
      const isoMatch = ato.data.match(/\d{4}-\d{2}-\d{2}T[\d:.]+/)
      const raw = isoMatch ? isoMatch[0] : ato.data
      const d = new Date(raw)
      if (isNaN(d.getTime())) return '—'
      return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    } catch {
      return '—'
    }
  }, [ato.data])

  return (
    <div className="flex gap-4">
      {/* Dot + Line */}
      <div className="flex flex-col items-center">
        <div className="w-3.5 h-3.5 rounded-full border-2 border-red-500 bg-white shrink-0 mt-1" />
        {!isLast && <div className="w-px flex-1 bg-gray-200" />}
      </div>
      {/* Content */}
      <div className="bg-gray-50 rounded-xl border border-gray-100 px-5 py-4 mb-4 flex-1">
        {/* Header */}
        <div className="flex items-center gap-3 mb-2">
          <span className="text-xs text-gray-500">{dataFormatada}</span>
          {tipo && (
            <span className={`text-xs px-2 py-0.5 rounded font-medium ${badgeClass}`}>
              {tipo}
            </span>
          )}
          {ato.id && ato.id !== 'undefined' && (
            <span className="text-[10px] font-mono text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
              {ato.id}
            </span>
          )}
        </div>

        {/* Descrição */}
        {ato.descricao && (
          <p className="text-sm text-gray-700 leading-relaxed">
            {ato.descricao}
          </p>
        )}

        {/* Justificativa */}
        {justificativa && (
          <p className="text-xs text-gray-500 mt-2 italic leading-relaxed">
            {justificativa}
          </p>
        )}
      </div>
    </div>
  )
}

// ─── Agrupar processos por numero_processo ───────────────
function useProcessosAgrupados(processos) {
  return useMemo(() => {
    const map = {}
    processos.forEach(p => {
      const key = p.numero_processo || `#${p.id}`
      if (!map[key]) {
        map[key] = { ...p, _duplicatas: [p] }
      } else {
        map[key]._duplicatas.push(p)
      }
    })
    return Object.values(map)
  }, [processos])
}

// ─── Search Box com autocomplete + keyboard nav ─────────
function ProcessoSearch({ processos, selectedKey, onSelect }) {
  const [query, setQuery] = useState('')
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
    if (!query.trim()) return processos.slice(0, 20)
    const q = query.toLowerCase()
    return processos.filter(p =>
      (p.numero_processo || '').toLowerCase().includes(q) ||
      (p.nome_reclamante || '').toLowerCase().includes(q) ||
      (p.parte_contraria || '').toLowerCase().includes(q)
    ).slice(0, 20)
  }, [query, processos])

  // Reset highlight when results change
  useEffect(() => { setHighlightIdx(-1) }, [results])

  // Scroll highlighted item into view
  useEffect(() => {
    if (highlightIdx < 0 || !listRef.current) return
    const items = listRef.current.querySelectorAll('[data-item]')
    if (items[highlightIdx]) {
      items[highlightIdx].scrollIntoView({ block: 'nearest' })
    }
  }, [highlightIdx])

  const selectItem = (p) => {
    const key = p.numero_processo || `#${p.id}`
    onSelect(key)
    setQuery(p.numero_processo || `Processo #${p.id}`)
    setOpen(false)
    setHighlightIdx(-1)
  }

  const handleKeyDown = (e) => {
    if (!open) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        setOpen(true)
        e.preventDefault()
      }
      return
    }

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
          selectItem(results[highlightIdx])
        }
        break
      case 'Escape':
        setOpen(false)
        setHighlightIdx(-1)
        break
    }
  }

  const selectedLabel = useMemo(() => {
    if (!selectedKey) return ''
    const p = processos.find(p => (p.numero_processo || `#${p.id}`) === selectedKey)
    return p ? (p.numero_processo || `Processo #${p.id}`) : ''
  }, [selectedKey, processos])

  return (
    <div ref={ref} className="relative">
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Buscar por número do processo ou nome do reclamante..."
          value={open ? query : (query || selectedLabel)}
          onChange={(e) => { setQuery(e.target.value); setOpen(true) }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg text-sm text-gray-700 hover:border-gray-400 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors"
        />
        {(query || selectedKey) && (
          <button
            onClick={() => { setQuery(''); onSelect(''); setOpen(false) }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={16} />
          </button>
        )}
      </div>
      {open && (
        <div ref={listRef} className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-auto">
          {results.length === 0 ? (
            <div className="px-4 py-3 text-sm text-gray-400">Nenhum processo encontrado</div>
          ) : (
            results.map((p, i) => {
              const key = p.numero_processo || `#${p.id}`
              const isHighlighted = i === highlightIdx
              return (
                <button
                  key={key}
                  data-item
                  onClick={() => selectItem(p)}
                  className={`w-full text-left px-4 py-2.5 text-sm transition-colors border-b border-gray-50 ${
                    isHighlighted
                      ? 'bg-brand-500/10 text-brand-500'
                      : key === selectedKey
                        ? 'bg-brand-500/5 text-brand-500 font-medium'
                        : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <span className="font-mono text-xs">{p.numero_processo || `#${p.id}`}</span>
                  {(p.nome_reclamante || p.parte_contraria) && (
                    <span className="text-gray-400 ml-2">— {p.nome_reclamante || p.parte_contraria}</span>
                  )}
                  {p._duplicatas.length > 1 && (
                    <span className="text-xs text-gray-400 ml-2">({p._duplicatas.length} registros)</span>
                  )}
                </button>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}

// ─── Componente principal ────────────────────────────────
export default function TimelinePage() {
  const { processos, loading, error } = useFilterContext()
  const [selectedKey, setSelectedKey] = useState('')
  const [navMode, setNavMode] = useState(false)
  const agrupados = useProcessosAgrupados(processos)

  // Navegação global por setas quando navMode ativo
  useEffect(() => {
    if (!navMode || !agrupados.length) return
    function handleKey(e) {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault()
        const currentIdx = agrupados.findIndex(p => (p.numero_processo || `#${p.id}`) === selectedKey)
        let nextIdx
        if (e.key === 'ArrowDown') {
          nextIdx = currentIdx < agrupados.length - 1 ? currentIdx + 1 : 0
        } else {
          nextIdx = currentIdx > 0 ? currentIdx - 1 : agrupados.length - 1
        }
        const next = agrupados[nextIdx]
        setSelectedKey(next.numero_processo || `#${next.id}`)
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [navMode, selectedKey, agrupados])

  const selected = useMemo(() => {
    if (!selectedKey) return null
    return agrupados.find(p => (p.numero_processo || `#${p.id}`) === selectedKey) || null
  }, [selectedKey, agrupados])

  // Buscar atos da tabela resultados_analise_medmais
  const [atosTimeline, setAtosTimeline] = useState([])
  const [loadingAtos, setLoadingAtos] = useState(false)

  useEffect(() => {
    if (!selected?.numero_processo) {
      setAtosTimeline([])
      return
    }

    let cancelled = false
    async function fetchAtos() {
      setLoadingAtos(true)
      const { data, error } = await supabase
        .from('resultados_analise_medmais')
        .select('table')
        .eq('numero_caso', selected.numero_processo)

      if (cancelled) return
      if (error || !data?.length) {
        setAtosTimeline([])
        setLoadingAtos(false)
        return
      }

      const allAtos = []
      data.forEach(row => {
        try {
          const raw = typeof row.table === 'string' ? JSON.parse(row.table) : row.table
          // table pode ser: array, objeto com chaves numéricas, ou um único ato
          let items
          if (Array.isArray(raw)) {
            items = raw
          } else if (raw && typeof raw === 'object' && 'data' in raw) {
            // Objeto único (um ato só)
            items = [raw]
          } else {
            // Objeto com chaves numéricas {"0": {...}, "1": {...}}
            items = Object.values(raw || {})
          }
          allAtos.push(...items)
        } catch { /* ignore parse errors */ }
      })

      // Extrair parte ISO de datas com prefixo
      const extractIso = (d) => {
        if (!d) return ''
        const m = d.match(/\d{4}-\d{2}-\d{2}T[\d:.]+/)
        return m ? m[0] : d
      }

      // Ordenar por data (mais recente primeiro)
      allAtos.sort((a, b) => {
        const da = extractIso(a.data)
        const db = extractIso(b.data)
        if (!da && !db) return 0
        if (!da) return 1
        if (!db) return -1
        return db.localeCompare(da)
      })

      // Filtrar itens sem descrição
      const filtered = allAtos.filter(a => a.descricao && a.descricao.trim())
      setAtosTimeline(filtered)
      setLoadingAtos(false)
    }

    fetchAtos()
    return () => { cancelled = true }
  }, [selected?.numero_processo])

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
      {/* Search Box */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-base font-semibold text-gray-800 mb-3">Buscar Processo</h3>
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <ProcessoSearch
              processos={agrupados}
              selectedKey={selectedKey}
              onSelect={setSelectedKey}
            />
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <span className="text-xs text-gray-400 whitespace-nowrap">Nav teclado</span>
              <button
                onClick={() => setNavMode(prev => !prev)}
                className={`relative w-9 h-5 rounded-full transition-colors ${navMode ? 'bg-brand-500' : 'bg-gray-300'}`}
              >
                <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${navMode ? 'translate-x-4' : 'translate-x-0.5'}`} />
              </button>
            </label>
            {navMode && (
              <>
                <div className="w-px h-5 bg-gray-200" />
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => {
                      const idx = agrupados.findIndex(p => (p.numero_processo || `#${p.id}`) === selectedKey)
                      const prev = idx > 0 ? idx - 1 : agrupados.length - 1
                      const p = agrupados[prev]
                      setSelectedKey(p.numero_processo || `#${p.id}`)
                    }}
                    className="p-1 rounded bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors"
                  >
                    <ChevronUp size={16} />
                  </button>
                  <button
                    onClick={() => {
                      const idx = agrupados.findIndex(p => (p.numero_processo || `#${p.id}`) === selectedKey)
                      const next = idx < agrupados.length - 1 ? idx + 1 : 0
                      const p = agrupados[next]
                      setSelectedKey(p.numero_processo || `#${p.id}`)
                    }}
                    className="p-1 rounded bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors"
                  >
                    <ChevronDown size={16} />
                  </button>
                  <span className="text-xs text-gray-400 tabular-nums whitespace-nowrap">
                    {agrupados.findIndex(p => (p.numero_processo || `#${p.id}`) === selectedKey) + 1}/{agrupados.length}
                  </span>
                </div>
              </>
            )}
          </div>
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
                <InfoRow label="Fase" value={selected.fase_processual_atual} />
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
                <InfoRow label="Depto" value={selected.departamento_reclamante} />
                <InfoRow label="Desligamento" value={selected.tipo_desligamento} />
                <InfoRow label="Tempo Casa" value={selected.tempo_casa_meses} />
                <InfoRow label="Último Salário" value={selected.ultimo_salario ? formatCurrency(parseCurrency(selected.ultimo_salario)) : null} />
                <InfoRow label="Motivo Principal" value={selected.motivo_principal_reclamacao} />
              </div>
            </div>

            {/* Risco */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-base font-semibold text-gray-800 mb-3">
                Risco: {selected.classificacao_risco || 'Não Informado'}
              </h3>
              <div className="divide-y divide-gray-100">
                <InfoRow label="Prob. Perda" value={selected.percentual_probabilidade_perda || '—'} />
                <InfoRow label="Provisionado" value={formatCurrency(parseCurrency(selected.valor_provisionado))} />
                <InfoRow label="Cenário Base" value={formatCurrency(parseCurrency(selected.valor_provisionado))} />
                <InfoRow label="Recomendação" value={selected.recomendacao_estrategica} />
              </div>
            </div>
          </div>

          {/* Coluna Direita - Timeline */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-base font-semibold text-gray-800">Timeline dos Atos</h3>
              <span className="text-xs text-gray-400">{atosTimeline.length} ato(s)</span>
            </div>
            <div className="pl-2 max-h-[700px] overflow-auto pr-2">
              {loadingAtos ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="animate-spin text-gray-400" size={24} />
                </div>
              ) : atosTimeline.length > 0 ? (
                atosTimeline.map((ato, i) => (
                  <AtoItem key={i} ato={ato} isLast={i === atosTimeline.length - 1} />
                ))
              ) : (
                <p className="text-sm text-gray-400 text-center py-8">
                  Nenhum ato registrado para este processo
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {!selected && (
        <div className="flex items-center justify-center h-64 text-gray-400">
          <p className="text-sm">Busque um processo para ver os detalhes e timeline</p>
        </div>
      )}
    </div>
  )
}
