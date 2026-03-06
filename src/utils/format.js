/**
 * Converte string de valor monetário brasileiro para número.
 * Aceita formatos: "R$ 1.234,56", "1.234,56", "1234.56", "1234", etc.
 */
export function parseCurrency(value) {
  if (!value || value === '-' || value === 'N/A' || value === 'informacao nao disponivel') return 0
  const cleaned = String(value)
    .replace(/R\$\s*/g, '')
    .replace(/\s/g, '')
    .trim()
  if (!cleaned) return 0
  // Formato brasileiro: 1.234,56 → remover pontos e trocar vírgula por ponto
  if (cleaned.includes(',')) {
    return parseFloat(cleaned.replace(/\./g, '').replace(',', '.')) || 0
  }
  return parseFloat(cleaned) || 0
}

/**
 * Formata número para moeda brasileira.
 */
export function formatCurrency(value, compact = false) {
  if (value == null || isNaN(value)) return 'R$ 0'
  if (compact) {
    if (Math.abs(value) >= 1_000_000_000) {
      return `R$ ${(value / 1_000_000_000).toFixed(1).replace('.', ',')}B`
    }
    if (Math.abs(value) >= 1_000_000) {
      return `R$ ${(value / 1_000_000).toFixed(1).replace('.', ',')}M`
    }
    if (Math.abs(value) >= 1_000) {
      return `R$ ${(value / 1_000).toFixed(1).replace('.', ',')}k`
    }
  }
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

/**
 * Formata número com separadores brasileiros.
 */
export function formatNumber(value) {
  if (value == null || isNaN(value)) return '0'
  return value.toLocaleString('pt-BR')
}

/**
 * Converte string de data brasileira para Date.
 * Aceita: "DD/MM/YYYY", "YYYY-MM-DD", timestamp ISO.
 */
export function parseDate(value) {
  if (!value) return null
  const str = String(value).trim()
  // DD/MM/YYYY
  const brMatch = str.match(/^(\d{2})\/(\d{2})\/(\d{4})/)
  if (brMatch) {
    return new Date(+brMatch[3], +brMatch[2] - 1, +brMatch[1])
  }
  // ISO ou YYYY-MM-DD
  const d = new Date(str)
  return isNaN(d.getTime()) ? null : d
}

/**
 * Retorna mês/ano no formato "MM/YYYY".
 */
export function getMonthYear(date) {
  if (!date) return null
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const y = date.getFullYear()
  return `${m}/${y}`
}
