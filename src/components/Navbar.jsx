import { NavLink } from 'react-router-dom'
import {
  BarChart3,
  DollarSign,
  Award,
  Clock,
  Shield,
  FileText,
  Filter,
} from 'lucide-react'

const navItems = [
  { path: '/visao_executiva', label: 'Visao Executiva', icon: BarChart3 },
  { path: '/analise_financeira', label: 'Analise Financeira', icon: DollarSign },
  { path: '/ranking_verbas', label: 'Ranking de Verbas', icon: Award },
  { path: '/timeline', label: 'Timeline', icon: Clock },
  { path: '/prevencao', label: 'Prevencao', icon: Shield },
  { path: '/detalhamento', label: 'Detalhamento', icon: FileText },
]

export default function Navbar({ filtersOpen, onToggleFilters }) {
  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-[1280px] mx-auto px-6 flex items-center justify-between h-16">
        {/* Logo */}
        <div className="flex flex-col leading-none shrink-0">
          <div className="flex items-baseline">
            <span className="text-3xl font-extrabold leading-none" style={{ color: '#FF5500' }}>med</span>
            <span className="text-3xl font-extrabold leading-none" style={{ color: '#FF5500' }}>+</span>
          </div>
          <span className="text-[11px] font-semibold tracking-wide ml-0.5" style={{ color: '#FF5500' }}>Group</span>
        </div>

        {/* Navigation */}
        <nav className="flex items-center gap-1 ml-8">
          {navItems.map(({ path, label, icon: Icon }) => (
            <NavLink
              key={path}
              to={path}
              className={({ isActive }) =>
                `flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                  isActive
                    ? 'bg-accent text-white'
                    : 'text-fig-black hover:bg-gray-100'
                }`
              }
            >
              <Icon size={16} />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-4 ml-6 shrink-0">
          <button
            onClick={onToggleFilters}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              filtersOpen
                ? 'bg-brand-200 text-brand-500'
                : 'text-brand-500 hover:bg-brand-200/50'
            }`}
          >
            <Filter size={16} />
            Filtros
          </button>
        </div>
      </div>
    </header>
  )
}
