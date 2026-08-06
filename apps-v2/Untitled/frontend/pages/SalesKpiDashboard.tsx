import { useState } from 'react'
import { Activity, CalendarClock, DollarSign, TrendingDown, TrendingUp } from 'lucide-react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../lib/shadcn/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../lib/shadcn/table'
import { Tabs, TabsList, TabsTrigger } from '../lib/shadcn/tabs'
import { salesKpiData, type WinLossGroupBy } from './data/salesKpis'

type KpiCardProps = {
  title: string
  value: string
  helper: string
  trend: string
  tone: 'primary' | 'success' | 'muted'
  icon: typeof DollarSign
}

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
})

function formatCurrency(value: number): string {
  return currencyFormatter.format(value)
}

function formatCompactCurrency(value: number): string {
  if (Math.abs(value) >= 1_000_000) {
    return `$${(value / 1_000_000).toFixed(2)}M`
  }

  if (Math.abs(value) >= 1_000) {
    return `$${(value / 1_000).toFixed(0)}K`
  }

  return formatCurrency(value)
}

function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`
}

function getWinLossLabel(groupBy: WinLossGroupBy): string {
  const labels: Record<WinLossGroupBy, string> = {
    reason: 'Reason',
    segment: 'Segment',
    competitor: 'Competitor',
  }

  return labels[groupBy]
}

function KpiCard({ title, value, helper, trend, tone, icon: Icon }: KpiCardProps) {
  const toneClasses = {
    primary: 'bg-primary text-primary-foreground',
    success: 'bg-success text-success-foreground',
    muted: 'bg-muted text-muted-foreground',
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex-row items-start justify-between space-y-0 pb-3">
        <div className="space-y-1">
          <CardDescription>{title}</CardDescription>
          <CardTitle className="text-3xl tracking-tight">{value}</CardTitle>
        </div>
        <div className={`rounded-md p-2 ${toneClasses[tone]}`}>
          <Icon className="h-5 w-5" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between gap-3 text-sm">
          <span className="text-muted-foreground">{helper}</span>
          <span className="font-medium text-foreground">{trend}</span>
        </div>
      </CardContent>
    </Card>
  )
}

export default function SalesKpiDashboard() {
  const data = salesKpiData
  const [winLossGroup, setWinLossGroup] = useState<WinLossGroupBy>('reason')
  const winLossBreakdowns = {
    reason: data.winLoss.byReason,
    segment: data.winLoss.bySegment,
    competitor: data.winLoss.byCompetitor,
  }
  const selectedWinLossBreakdown = winLossBreakdowns[winLossGroup]

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-5 py-6 sm:px-8 lg:px-10">
        <header className="flex flex-col gap-4 rounded-xl border bg-card p-6 shadow-retool-sm lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-wide text-muted-foreground">Sales performance</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">KPI dashboard</h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              Current reporting period is {data.currentMonthLabel}, using daily-refresh sales metrics.
            </p>
          </div>
          <div className="flex items-center gap-3 rounded-lg border bg-background px-4 py-3 text-sm shadow-retool-sm">
            <CalendarClock className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="font-medium">Last refreshed</p>
              <p className="text-muted-foreground">{data.lastRefreshedLabel}</p>
            </div>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <KpiCard
            title="Current MRR"
            value={formatCompactCurrency(data.currentMrr)}
            helper="Monthly recurring revenue"
            trend={formatCurrency(data.currentMrr)}
            tone="primary"
            icon={DollarSign}
          />
          <KpiCard
            title="MoM MRR growth"
            value={formatPercent(data.momMrrGrowthPct)}
            helper="Versus prior month"
            trend="Positive momentum"
            tone="success"
            icon={TrendingUp}
          />
          <KpiCard
            title="Gross churn"
            value={formatPercent(data.grossChurnPct)}
            helper="Current customer churn"
            trend={data.currentMonthLabel}
            tone="muted"
            icon={TrendingDown}
          />
          <KpiCard
            title="Net churn"
            value={formatPercent(data.netChurnPct)}
            helper="After expansions"
            trend="Revenue retained"
            tone="muted"
            icon={Activity}
          />
        </section>

        <section className="grid gap-6 xl:grid-cols-5">
          <Card className="xl:col-span-3">
            <CardHeader>
              <CardTitle>MRR over time</CardTitle>
              <CardDescription>Monthly recurring revenue across the last 10 reporting periods.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data.mrrSeries} margin={{ left: 8, right: 16, top: 10, bottom: 0 }}>
                    <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" vertical={false} />
                    <XAxis
                      dataKey="label"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                      tickFormatter={formatCompactCurrency}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        borderColor: 'hsl(var(--border))',
                        borderRadius: 'var(--radius)',
                        color: 'hsl(var(--card-foreground))',
                      }}
                      formatter={(value) => [formatCurrency(Number(value)), 'MRR']}
                      labelStyle={{ color: 'hsl(var(--foreground))' }}
                    />
                    <Area
                      type="monotone"
                      dataKey="mrr"
                      name="MRR"
                      stroke="hsl(var(--chart-1))"
                      fill="hsl(var(--chart-1))"
                      fillOpacity={0.18}
                      strokeWidth={3}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="xl:col-span-2">
            <CardHeader>
              <CardTitle>Churn over time</CardTitle>
              <CardDescription>Gross churn compared with net churn by month.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data.churnSeries} margin={{ left: 0, right: 16, top: 10, bottom: 0 }}>
                    <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" vertical={false} />
                    <XAxis
                      dataKey="label"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                      tickFormatter={formatPercent}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        borderColor: 'hsl(var(--border))',
                        borderRadius: 'var(--radius)',
                        color: 'hsl(var(--card-foreground))',
                      }}
                      formatter={(value, name) => [formatPercent(Number(value)), name]}
                      labelStyle={{ color: 'hsl(var(--foreground))' }}
                    />
                    <Legend wrapperStyle={{ color: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                    <Line
                      type="monotone"
                      dataKey="grossChurn"
                      name="Gross churn"
                      stroke="hsl(var(--chart-1))"
                      strokeWidth={3}
                      dot={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="netChurn"
                      name="Net churn"
                      stroke="hsl(var(--chart-2))"
                      strokeWidth={3}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-6 xl:grid-cols-5">
          <Card className="xl:col-span-3">
            <CardHeader className="gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <CardTitle>Win / loss breakdown</CardTitle>
                <CardDescription>Deals won vs. lost grouped by {getWinLossLabel(winLossGroup).toLowerCase()}.</CardDescription>
              </div>
              <Tabs
                value={winLossGroup}
                onValueChange={(value) => setWinLossGroup(value as WinLossGroupBy)}
                className="w-full lg:w-auto"
              >
                <TabsList className="grid w-full grid-cols-3 lg:w-auto">
                  <TabsTrigger value="reason">Reason</TabsTrigger>
                  <TabsTrigger value="segment">Segment</TabsTrigger>
                  <TabsTrigger value="competitor">Competitor</TabsTrigger>
                </TabsList>
              </Tabs>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-lg border bg-background p-4">
                  <p className="text-sm text-muted-foreground">Won deals</p>
                  <p className="mt-2 text-2xl font-semibold">{data.winLoss.totalWon}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{formatCompactCurrency(data.winLoss.totalWonAmount)}</p>
                </div>
                <div className="rounded-lg border bg-background p-4">
                  <p className="text-sm text-muted-foreground">Lost deals</p>
                  <p className="mt-2 text-2xl font-semibold">{data.winLoss.totalLost}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{formatCompactCurrency(data.winLoss.totalLostAmount)}</p>
                </div>
                <div className="rounded-lg border bg-background p-4">
                  <p className="text-sm text-muted-foreground">Win rate</p>
                  <p className="mt-2 text-2xl font-semibold">{formatPercent(data.winLoss.winRate)}</p>
                  <p className="mt-1 text-sm text-muted-foreground">Closed-won share</p>
                </div>
              </div>

              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={selectedWinLossBreakdown} margin={{ left: 0, right: 16, top: 10, bottom: 0 }}>
                    <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" vertical={false} />
                    <XAxis
                      dataKey="name"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      allowDecimals={false}
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        borderColor: 'hsl(var(--border))',
                        borderRadius: 'var(--radius)',
                        color: 'hsl(var(--card-foreground))',
                      }}
                      formatter={(value, name) => [Number(value).toLocaleString(), name]}
                      labelStyle={{ color: 'hsl(var(--foreground))' }}
                    />
                    <Legend wrapperStyle={{ color: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                    <Bar dataKey="won" name="Won" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="lost" name="Lost" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="xl:col-span-2">
            <CardHeader>
              <CardTitle>{getWinLossLabel(winLossGroup)} details</CardTitle>
              <CardDescription>Volume, win rate, and closed value for each group.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-hidden rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{getWinLossLabel(winLossGroup)}</TableHead>
                      <TableHead className="text-right">Won</TableHead>
                      <TableHead className="text-right">Lost</TableHead>
                      <TableHead className="text-right">Win rate</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedWinLossBreakdown.map((row) => (
                      <TableRow key={row.name}>
                        <TableCell className="font-medium">{row.name}</TableCell>
                        <TableCell className="text-right">{row.won}</TableCell>
                        <TableCell className="text-right">{row.lost}</TableCell>
                        <TableCell className="text-right">{formatPercent(row.winRate)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </main>
  )
}
