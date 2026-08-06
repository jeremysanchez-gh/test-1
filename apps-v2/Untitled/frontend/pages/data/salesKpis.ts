import churnSource from '../../data/churn.json'
import revenueSource from '../../data/revenue.json'
import winLossSource from '../../data/win-loss.json'

export type RevenuePoint = {
  month: string
  mrr: number
  new_mrr: number
  expansion_mrr: number
  contraction_mrr: number
  churned_mrr: number
}

export type ChurnPoint = {
  month: string
  gross_churn_pct: number
  net_churn_pct: number
  customers_lost: number
  customers_total: number
}

export type MrrChartPoint = {
  month: string
  label: string
  mrr: number
}

export type ChurnChartPoint = {
  month: string
  label: string
  grossChurn: number
  netChurn: number
}

export type WinLossOutcome = 'won' | 'lost'

export type WinLossGroupBy = 'reason' | 'segment' | 'competitor'

export type WinLossDeal = {
  id: string
  outcome: WinLossOutcome
  reason: string
  segment: string
  competitor: string
  amount: number
}

export type WinLossBreakdownPoint = {
  name: string
  won: number
  lost: number
  winRate: number
  wonAmount: number
  lostAmount: number
}

export type WinLossSummary = {
  totalWon: number
  totalLost: number
  winRate: number
  totalWonAmount: number
  totalLostAmount: number
  byReason: WinLossBreakdownPoint[]
  bySegment: WinLossBreakdownPoint[]
  byCompetitor: WinLossBreakdownPoint[]
}

export type SalesKpiData = {
  currentMonth: string
  currentMonthLabel: string
  lastRefreshedLabel: string
  refreshCadence: 'daily'
  currentMrr: number
  momMrrGrowthPct: number
  grossChurnPct: number
  netChurnPct: number
  mrrSeries: MrrChartPoint[]
  churnSeries: ChurnChartPoint[]
  winLoss: WinLossSummary
}

const revenue = revenueSource as RevenuePoint[]
const churn = churnSource as ChurnPoint[]
const winLossDeals = winLossSource as WinLossDeal[]

function getLastItem<T>(items: T[], label: string): T {
  const item = items[items.length - 1]
  if (!item) {
    throw new Error(`Missing ${label} data`)
  }
  return item
}

function formatMonth(value: string): string {
  const [year, month] = value.split('-')
  if (!year || !month) {
    return value
  }

  const date = new Date(Number(year), Number(month) - 1, 1)
  return new Intl.DateTimeFormat('en', { month: 'short', year: 'numeric' }).format(date)
}

function calculateMomGrowth(current: RevenuePoint, previous: RevenuePoint): number {
  if (previous.mrr === 0) {
    return 0
  }

  return ((current.mrr - previous.mrr) / previous.mrr) * 100
}

function calculateWinRate(won: number, lost: number): number {
  const total = won + lost
  if (total === 0) {
    return 0
  }

  return (won / total) * 100
}

function buildWinLossBreakdown(groupBy: WinLossGroupBy): WinLossBreakdownPoint[] {
  const buckets: Record<string, WinLossBreakdownPoint> = {}

  for (const deal of winLossDeals) {
    const groupName = deal[groupBy]
    const existingBucket = buckets[groupName]
    const bucket = existingBucket ?? {
      name: groupName,
      won: 0,
      lost: 0,
      winRate: 0,
      wonAmount: 0,
      lostAmount: 0,
    }

    if (deal.outcome === 'won') {
      bucket.won += 1
      bucket.wonAmount += deal.amount
    } else {
      bucket.lost += 1
      bucket.lostAmount += deal.amount
    }

    bucket.winRate = calculateWinRate(bucket.won, bucket.lost)
    buckets[groupName] = bucket
  }

  return Object.values(buckets).sort((left, right) => right.won + right.lost - (left.won + left.lost))
}

function buildWinLossSummary(): WinLossSummary {
  const totals = winLossDeals.reduce(
    (summary, deal) => {
      if (deal.outcome === 'won') {
        summary.totalWon += 1
        summary.totalWonAmount += deal.amount
      } else {
        summary.totalLost += 1
        summary.totalLostAmount += deal.amount
      }

      return summary
    },
    { totalWon: 0, totalLost: 0, totalWonAmount: 0, totalLostAmount: 0 },
  )

  return {
    ...totals,
    winRate: calculateWinRate(totals.totalWon, totals.totalLost),
    byReason: buildWinLossBreakdown('reason'),
    bySegment: buildWinLossBreakdown('segment'),
    byCompetitor: buildWinLossBreakdown('competitor'),
  }
}

const currentRevenue = getLastItem(revenue, 'revenue')
const previousRevenue = revenue.length > 1 ? revenue[revenue.length - 2] : currentRevenue
const currentChurn = getLastItem(churn, 'churn')

if (!previousRevenue) {
  throw new Error('Missing previous revenue data')
}

export const salesKpiData: SalesKpiData = {
  currentMonth: currentRevenue.month,
  currentMonthLabel: formatMonth(currentRevenue.month),
  lastRefreshedLabel: formatMonth(currentRevenue.month),
  refreshCadence: 'daily',
  currentMrr: currentRevenue.mrr,
  momMrrGrowthPct: calculateMomGrowth(currentRevenue, previousRevenue),
  grossChurnPct: currentChurn.gross_churn_pct,
  netChurnPct: currentChurn.net_churn_pct,
  mrrSeries: revenue.map((point) => ({
    month: point.month,
    label: formatMonth(point.month),
    mrr: point.mrr,
  })),
  churnSeries: churn.map((point) => ({
    month: point.month,
    label: formatMonth(point.month),
    grossChurn: point.gross_churn_pct,
    netChurn: point.net_churn_pct,
  })),
  winLoss: buildWinLossSummary(),
}
