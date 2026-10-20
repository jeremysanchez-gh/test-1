import { useMemo, useState } from 'react'

export type SortDirection = 'asc' | 'desc'

export interface SortConfig<K extends string> {
  key: K
  direction: SortDirection
}

/**
 * Generic client-side sorting for an already-fetched array of rows.
 * Pass the row array and an optional default sort; get back the sorted
 * array plus a `requestSort(key)` toggler to wire up to clickable headers.
 */
export function useSortableData<T extends object, K extends Extract<keyof T, string> = Extract<keyof T, string>>(
  data: T[],
  defaultSort?: SortConfig<K>
) {
  const [sortConfig, setSortConfig] = useState<SortConfig<K> | null>(defaultSort ?? null)

  const sortedData = useMemo(() => {
    if (!sortConfig) return data
    const { key, direction } = sortConfig
    const copy = [...data]
    copy.sort((a, b) => {
      const aVal: unknown = a[key]
      const bVal: unknown = b[key]
      if (aVal == null && bVal == null) return 0
      if (aVal == null) return 1
      if (bVal == null) return -1
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return direction === 'asc' ? aVal - bVal : bVal - aVal
      }
      const aStr = String(aVal).toLowerCase()
      const bStr = String(bVal).toLowerCase()
      if (aStr < bStr) return direction === 'asc' ? -1 : 1
      if (aStr > bStr) return direction === 'asc' ? 1 : -1
      return 0
    })
    return copy
  }, [data, sortConfig])

  function requestSort(key: K) {
    setSortConfig((current) => {
      if (!current || current.key !== key) return { key, direction: 'asc' }
      if (current.direction === 'asc') return { key, direction: 'desc' }
      return null
    })
  }

  return { sortedData, sortConfig, requestSort }
}
