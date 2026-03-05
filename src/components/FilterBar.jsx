import { ChevronDown } from 'lucide-react'

function FilterSelect({ label, value, options, onChange }) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="appearance-none bg-white border border-gray-300 rounded-full px-4 py-2 pr-8 text-sm text-gray-600 cursor-pointer hover:border-gray-400 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors min-w-[140px]"
      >
        <option value="">{label}</option>
        {options.map(opt => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
      <ChevronDown
        size={14}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
      />
    </div>
  )
}

export default function FilterBar({ filters, options, onFilterChange, visible }) {
  if (!options || !visible) return null

  return (
    <div className="bg-white/60 backdrop-blur-sm border-b border-gray-200 animate-slideDown">
      <div className="max-w-[1280px] mx-auto px-6 py-3">
        <div className="flex items-center gap-3 flex-wrap">
          <FilterSelect
            label="Todas Filiais"
            value={filters.filial}
            options={options.filiais || []}
            onChange={(v) => onFilterChange('filial', v)}
          />
          <FilterSelect
            label="Todos Deptos"
            value={filters.departamento}
            options={options.departamentos || []}
            onChange={(v) => onFilterChange('departamento', v)}
          />
          <FilterSelect
            label="Todos Riscos"
            value={filters.risco}
            options={options.riscos || []}
            onChange={(v) => onFilterChange('risco', v)}
          />
          <FilterSelect
            label="Todas Fases"
            value={filters.fase}
            options={options.fases || []}
            onChange={(v) => onFilterChange('fase', v)}
          />
          <FilterSelect
            label="Todos Status"
            value={filters.status}
            options={options.status || []}
            onChange={(v) => onFilterChange('status', v)}
          />
          <FilterSelect
            label="Todos Desligamentos"
            value={filters.desligamento}
            options={options.desligamentos || []}
            onChange={(v) => onFilterChange('desligamento', v)}
          />
          <FilterSelect
            label="Período"
            value={filters.periodo}
            options={[]}
            onChange={(v) => onFilterChange('periodo', v)}
          />
        </div>
      </div>
    </div>
  )
}
