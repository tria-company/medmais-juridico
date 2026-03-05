import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Navbar from './Navbar'
import FilterBar from './FilterBar'
import { useProcessos } from '../hooks/useProcessos'
import { useFilters, FilterContext } from '../hooks/useFilters'

export default function Layout() {
  const [filtersOpen, setFiltersOpen] = useState(false)
  const { processos, loading, error, refetch } = useProcessos()
  const { filters, setFilter, clearFilters, options, filtered } = useFilters(processos)

  return (
    <FilterContext.Provider value={{ processos: filtered, allProcessos: processos, loading, error, refetch, filters, setFilter, clearFilters, options }}>
      <div className="min-h-screen bg-gray-100">
        <Navbar
          filtersOpen={filtersOpen}
          onToggleFilters={() => setFiltersOpen(prev => !prev)}
        />
        <FilterBar
          filters={filters}
          options={options}
          onFilterChange={setFilter}
          visible={filtersOpen}
        />
        <main className="max-w-[1280px] mx-auto px-6 py-6">
          <Outlet />
        </main>
      </div>
    </FilterContext.Provider>
  )
}
