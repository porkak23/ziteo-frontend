import type { Category } from '../types/tiendaTypes'

interface CategoryChipProps {
  category: Category
  isSelected: boolean
  onSelect: (id: string) => void
}

export function CategoryChip({ category, isSelected, onSelect }: CategoryChipProps) {
  return (
    <button
      onClick={() => onSelect(category.id)}
      className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-label transition-colors whitespace-nowrap ${isSelected ? 'bg-primary text-on-primary' : 'bg-surface-container text-on-surface border border-outline-variant'}`}
    >
      <span className="material-symbols-outlined text-base leading-none">{category.icon_name}</span>
      {category.name}
    </button>
  )
}
