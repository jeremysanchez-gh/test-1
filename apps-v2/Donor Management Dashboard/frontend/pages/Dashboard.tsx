import { useEffect } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Users, DollarSign, AlertTriangle, Repeat } from 'lucide-react'
import { useGetKpis, useGetGiftsByMonth, useGetRiskBreakdown } from '../hooks/backend/donors'
import { Card, CardContent, CardHeader, CardTitle } from '../lib/shadcn/card'
import { formatCurrency, formatMonthAxis } from '../utils/format'

interface GiftsByMonthRow {
  month: string
  raised: number
  gifts: number
}

interface RiskBreakdownRow {
  risk_tier: string
  donors: number
}

const RISK_ORDER = ['new', 'safe', 'watch', 'at_risk', 'lapsed']
const RISK_LABELS: Record<string, string> = {
  new: 'New',
  safe: 'Safe',
  watch: 'Watch',
  at_risk: 'At risk',
  lapsed: 'Lapsed',
}

export default function Dashboard() {
  const kpis = useGetKpis()
  const giftsByMonth = useGetGiftsByMonth()
  const riskBreakdown = useGetRiskBreakdown()

  useEffect(() => {
    kpis.trigger()
    giftsByMonth.trigger()
    riskBreakdown.trigger()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const monthRows: GiftsByMonthRow[] = giftsByMonth.data ?? []
  const monthData = monthRows.map((row: GiftsByMonthRow) => ({
    ...row,
    label: formatMonthAxis(row.month),
  }))

  const riskRows: RiskBreakdownRow[] = riskBreakdown.data ?? []
  const riskData = RISK_ORDER.filter((tier) =>
    riskRows.some((row: RiskBreakdownRow) => row.risk_tier === tier)
  ).map((tier) => {
    const row = riskRows.find((r: RiskBreakdownRow) => r.risk_tier === tier)
    return { risk_tier: RISK_LABELS[tier] ?? tier, donors: row ? row.donors : 0 }
  })

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Donors"
          value={kpis.data ? kpis.data.total_donors.toLocaleString() : '—'}
          loading={kpis.loading}
          icon={Users}
          accent="text-blue-600 bg-blue-100 dark:text-blue-300 dark:bg-blue-950"
        />
        <StatCard
          label="Raised YTD"
          value={kpis.data ? formatCurrency(kpis.data.raised_ytd) : '—'}
          loading={kpis.loading}
          icon={DollarSign}
          accent="text-green-600 bg-green-100 dark:text-green-300 dark:bg-green-950"
        />
        <StatCard
          label="Need attention"
          value={kpis.data ? kpis.data.needs_attention.toLocaleString() : '—'}
          loading={kpis.loading}
          icon={AlertTriangle}
          accent="text-orange-600 bg-orange-100 dark:text-orange-300 dark:bg-orange-950"
        />
        <StatCard
          label="Repeat-donor rate"
          value={kpis.data ? `${kpis.data.repeat_donor_pct}%` : '—'}
          caption="Sector avg: 43.3% (FEP)"
          loading={kpis.loading}
          icon={Repeat}
          accent="text-purple-600 bg-purple-100 dark:text-purple-300 dark:bg-purple-950"
        />
      </div>

      {kpis.error ? <p className="text-sm text-destructive">Error: {kpis.error}</p> : null}
      {!kpis.error && kpis.dataAccessErrors.length > 0 ? (
        <p className="text-sm text-destructive">
          Access restricted: {kpis.dataAccessErrors.map((e) => e.message).join('; ')}
        </p>
      ) : null}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Giving by month, last 24 months</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis dataKey="label" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis
                  tickFormatter={(v: number) => formatCurrency(v)}
                  width={80}
                  tick={{ fontSize: 12 }}
                  stroke="hsl(var(--muted-foreground))"
                />
                <Tooltip
                  formatter={(value) => formatCurrency(Number(value))}
                  contentStyle={{
                    backgroundColor: 'hsl(var(--popover))',
                    borderColor: 'hsl(var(--border))',
                    borderRadius: 8,
                    color: 'hsl(var(--popover-foreground))',
                  }}
                />
                <Bar dataKey="raised" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Donors by risk tier</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={riskData} layout="vertical" margin={{ left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
                <XAxis type="number" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis
                  type="category"
                  dataKey="risk_tier"
                  width={70}
                  tick={{ fontSize: 12 }}
                  stroke="hsl(var(--muted-foreground))"
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--popover))',
                    borderColor: 'hsl(var(--border))',
                    borderRadius: 8,
                    color: 'hsl(var(--popover-foreground))',
                  }}
                />
                <Bar dataKey="donors" fill="hsl(var(--chart-2))" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

interface StatCardProps {
  label: string
  value: string
  caption?: string
  loading: boolean
  icon: typeof Users
  accent: string
}

function StatCard({ label, value, caption, loading, icon: Icon, accent }: StatCardProps) {
  return (
    <Card className="transition-shadow hover:shadow-retool-md">
      <CardContent className="pt-density-xl">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="mt-1 text-3xl font-bold text-foreground">{loading ? '…' : value}</p>
            {caption ? <p className="mt-1 text-xs text-muted-foreground">{caption}</p> : null}
          </div>
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${accent}`}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
