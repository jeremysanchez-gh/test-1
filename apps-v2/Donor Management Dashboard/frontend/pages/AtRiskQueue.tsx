import { useEffect, useState } from 'react'
import { RefreshCw, AlertTriangle, TrendingDown, Users } from 'lucide-react'
import { useGetAtRisk, useRunLapseScan } from '../hooks/backend/donors'
import { Table, TableBody, TableCell, TableHeader, TableRow } from '../lib/shadcn/table'
import { Card, CardContent } from '../lib/shadcn/card'
import { Button } from '../lib/shadcn/button'
import { RiskTag } from '../components/RiskTag'
import { SortableTableHead } from '../components/SortableTableHead'
import { useSortableData } from '../hooks/useSortableData'
import { formatCurrency, formatDate } from '../utils/format'
import { toast } from '../lib/shadcn/sonner'

interface AtRiskRow {
  id: number
  donor: string
  giving_tier: string
  risk_tier: string
  last_gift_date: string | null
  days_quiet: number | null
  lifetime_giving: number
  notes: string | null
}

export default function AtRiskQueue() {
  const atRiskQuery = useGetAtRisk()
  const runLapseScan = useRunLapseScan()
  const [scanning, setScanning] = useState(false)

  useEffect(() => {
    atRiskQuery.trigger()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const rows: AtRiskRow[] = atRiskQuery.data ?? []
  const { sortedData: sortedRows, sortConfig, requestSort } = useSortableData<AtRiskRow>(rows)

  const majorCount = rows.filter((r) => r.giving_tier === 'major').length
  const lapsedCount = rows.filter((r) => r.risk_tier === 'lapsed').length

  async function handleRunScan() {
    setScanning(true)
    try {
      const result = await runLapseScan.trigger().result
      const totalRescored =
        result && typeof result === 'object' && 'total_rescored' in result
          ? (result as { total_rescored: number }).total_rescored
          : null
      toast.success(totalRescored != null ? `Scan complete: ${totalRescored} donors re-scored` : 'Scan complete')
      atRiskQuery.trigger(undefined, { skipCache: true })
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      toast.error(`Scan failed: ${message}`)
    } finally {
      setScanning(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          Donors going quiet, majors first. The nightly scan updates this list; you can also run it now.
        </p>
        <Button onClick={handleRunScan} disabled={scanning} className="shrink-0">
          <RefreshCw className={`h-4 w-4 ${scanning ? 'animate-spin' : ''}`} />
          {scanning ? 'Running scan…' : 'Run lapse scan now'}
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <SummaryCard
          label="Total in queue"
          value={rows.length}
          icon={Users}
          accent="text-blue-600 bg-blue-100 dark:text-blue-300 dark:bg-blue-950"
        />
        <SummaryCard
          label="Major donors"
          value={majorCount}
          icon={AlertTriangle}
          accent="text-orange-600 bg-orange-100 dark:text-orange-300 dark:bg-orange-950"
        />
        <SummaryCard
          label="Lapsed"
          value={lapsedCount}
          icon={TrendingDown}
          accent="text-red-600 bg-red-100 dark:text-red-300 dark:bg-red-950"
        />
      </div>

      {atRiskQuery.error ? <p className="text-sm text-destructive">Error: {atRiskQuery.error}</p> : null}
      {!atRiskQuery.error && atRiskQuery.dataAccessErrors.length > 0 ? (
        <p className="text-sm text-destructive">
          Access restricted: {atRiskQuery.dataAccessErrors.map((e) => e.message).join('; ')}
        </p>
      ) : null}

      <Card className="overflow-hidden py-0">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <SortableTableHead sortKey="donor" sortConfig={sortConfig} onSort={requestSort}>
                Donor
              </SortableTableHead>
              <SortableTableHead sortKey="giving_tier" sortConfig={sortConfig} onSort={requestSort}>
                Tier
              </SortableTableHead>
              <SortableTableHead sortKey="risk_tier" sortConfig={sortConfig} onSort={requestSort}>
                Risk
              </SortableTableHead>
              <SortableTableHead sortKey="last_gift_date" sortConfig={sortConfig} onSort={requestSort}>
                Last gift
              </SortableTableHead>
              <SortableTableHead
                sortKey="days_quiet"
                sortConfig={sortConfig}
                onSort={requestSort}
                align="right"
                className="text-right"
              >
                Days quiet
              </SortableTableHead>
              <SortableTableHead
                sortKey="lifetime_giving"
                sortConfig={sortConfig}
                onSort={requestSort}
                align="right"
                className="text-right"
              >
                Lifetime
              </SortableTableHead>
              <TableCell className="p-density-lg text-left align-middle font-medium text-muted-foreground">
                Notes
              </TableCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {atRiskQuery.loading && rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">
                  Loading…
                </TableCell>
              </TableRow>
            ) : null}
            {!atRiskQuery.loading && rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">
                  No donors are currently at risk.
                </TableCell>
              </TableRow>
            ) : null}
            {sortedRows.map((row) => (
              <TableRow key={row.id} className={row.giving_tier === 'major' ? 'bg-orange-50/60 dark:bg-orange-950/20' : ''}>
                <TableCell className="font-medium">{row.donor}</TableCell>
                <TableCell className="capitalize">{row.giving_tier}</TableCell>
                <TableCell>
                  <RiskTag riskTier={row.risk_tier} />
                </TableCell>
                <TableCell className="text-muted-foreground">{formatDate(row.last_gift_date)}</TableCell>
                <TableCell className="text-right">{row.days_quiet ?? '—'}</TableCell>
                <TableCell className="text-right font-medium">{formatCurrency(row.lifetime_giving)}</TableCell>
                <TableCell className="max-w-xs whitespace-normal text-muted-foreground">
                  {row.notes ?? '—'}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  )
}

interface SummaryCardProps {
  label: string
  value: number
  icon: typeof Users
  accent: string
}

function SummaryCard({ label, value, icon: Icon, accent }: SummaryCardProps) {
  return (
    <Card>
      <CardContent className="flex items-center justify-between pt-density-xl">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="mt-1 text-2xl font-bold">{value.toLocaleString()}</p>
        </div>
        <div className={`flex h-10 w-10 items-center justify-center rounded-full ${accent}`}>
          <Icon className="h-5 w-5" />
        </div>
      </CardContent>
    </Card>
  )
}
