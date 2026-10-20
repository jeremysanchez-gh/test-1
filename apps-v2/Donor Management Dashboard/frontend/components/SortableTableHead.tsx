import { ReactNode } from 'react'
import { ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react'
import { TableHead } from '../lib/shadcn/table'
import { cn } from '../lib/shadcn/utils'
import type { SortConfig } from '../hooks/useSortableData'

interface SortableTableHeadProps<K extends string> {
  sortKey: K
  sortConfig: SortConfig<K> | null
  onSort: (key: K) => void
  children: ReactNode
  align?: 'left' | 'right'
  className?: string
}

export function SortableTableHead<K extends string>({
  sortKey,
  sortConfig,
  onSort,
  children,
  align = 'left',
  className,
}: SortableTableHeadProps<K>) {
  const isActive = sortConfig?.key === sortKey
  const Icon = isActive ? (sortConfig?.direction === 'asc' ? ArrowUp : ArrowDown) : ArrowUpDown

  return (
    <TableHead className={className}>
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        className={cn(
          'inline-flex items-center gap-1 font-medium text-muted-foreground transition-colors hover:text-foreground',
          isActive && 'text-foreground',
          align === 'right' && 'flex-row-reverse'
        )}
      >
        {children}
        <Icon className={cn('h-3.5 w-3.5', isActive ? 'opacity-100' : 'opacity-40')} />
      </button>
    </TableHead>
  )
}
