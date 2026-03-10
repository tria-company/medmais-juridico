import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const COLUMNS = [
  'id',
  'numero_processo',
  'status_processo',
  'fase_processual_atual',
  'tribunal',
  'vara',
  'nome_reclamante',
  'cargo_reclamante',
  'departamento_reclamante',
  'filial_unidade_processo',
  'tipo_desligamento',
  'tempo_casa_meses',
  'ultimo_salario',
  'motivo_principal_reclamacao',
  'valor_causa_original',
  'valor_total_condenacao',
  'valor_provisionado',
  'valor_acordo_pos_sentenca',
  'valor_total_atualizado',
  'valor_liquido_estimado',
  'percentual_probabilidade_perda',
  'classificacao_risco',
  'recomendacao_estrategica',
  'resultado_sentenca',
  'data_distribuicao',
  'data_sentenca',
  'data_ultima_movimentacao',
  'pedidos_verbas',
  'gestor_direto',
  'advogados_ambas_partes',
].join(',')

export function useProcessos() {
  const [processos, setProcessos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchProcessos()
  }, [])

  async function fetchProcessos() {
    try {
      setLoading(true)
      setError(null)
      const { data, error } = await supabase
        .from('medmais_processos')
        .select(COLUMNS)
        .order('id', { ascending: false })
        .limit(2000)

      if (error) throw error
      setProcessos(data || [])
    } catch (err) {
      console.error('Erro ao buscar processos:', err)
      setError(err?.message || String(err))
    } finally {
      setLoading(false)
    }
  }

  return { processos, loading, error, refetch: fetchProcessos }
}
