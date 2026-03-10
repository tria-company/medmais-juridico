import { useState, useMemo, createContext, useContext } from 'react'

const FilterContext = createContext(null)

export function useFilterContext() {
  return useContext(FilterContext)
}

export { FilterContext }

export function useFilters(processos) {
  const [filters, setFilters] = useState({
    filial: '',
    departamento: '',
    risco: '',
    fase: '',
    status: '',
    desligamento: '',
    tribunal: '',
    periodo: '',
  })

  // Extrair opções únicas dos dados
  const options = useMemo(() => {
    if (!processos.length) return {}

    const unique = (key) => {
      const values = processos
        .map(p => p[key])
        .filter(Boolean)
        .filter((v, i, arr) => arr.indexOf(v) === i)
        .sort()
      return values
    }

    return {
      filiais: unique('filial_unidade_processo'),
      departamentos: unique('departamento_reclamante'),
      riscos: unique('classificacao_risco'),
      fases: unique('fase_processual_atual'),
      status: unique('status_processo'),
      desligamentos: unique('tipo_desligamento'),
      tribunais: unique('tribunal'),
    }
  }, [processos])

  // Aplicar filtros
  const filtered = useMemo(() => {
    return processos.filter(p => {
      if (filters.filial && p.filial_unidade_processo !== filters.filial) return false
      if (filters.departamento && p.departamento_reclamante !== filters.departamento) return false
      if (filters.risco && p.classificacao_risco !== filters.risco) return false
      if (filters.fase && p.fase_processual_atual !== filters.fase) return false
      if (filters.status && p.status_processo !== filters.status) return false
      if (filters.desligamento && p.tipo_desligamento !== filters.desligamento) return false
      if (filters.tribunal && p.tribunal !== filters.tribunal) return false
      return true
    })
  }, [processos, filters])

  const setFilter = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const clearFilters = () => {
    setFilters({
      filial: '',
      departamento: '',
      risco: '',
      fase: '',
      status: '',
      desligamento: '',
      tribunal: '',
      periodo: '',
    })
  }

  return { filters, setFilter, clearFilters, options, filtered }
}
