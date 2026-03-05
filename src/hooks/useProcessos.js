import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

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
      const { data, error } = await supabase
        .from('medmais_processos')
        .select('*')
        .order('id', { ascending: false })

      if (error) throw error
      setProcessos(data || [])
    } catch (err) {
      console.error('Erro ao buscar processos:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return { processos, loading, error, refetch: fetchProcessos }
}
