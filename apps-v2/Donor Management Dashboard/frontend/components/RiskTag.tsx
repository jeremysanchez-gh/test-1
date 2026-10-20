interface RiskTagProps {
  riskTier: string
}

const RISK_STYLES: Record<string, string> = {
  new: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200',
  safe: 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200',
  watch: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-200',
  at_risk: 'bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-200',
  lapsed: 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200',
}

const RISK_LABELS: Record<string, string> = {
  new: 'New',
  safe: 'Safe',
  watch: 'Watch',
  at_risk: 'At risk',
  lapsed: 'Lapsed',
}

export function RiskTag({ riskTier }: RiskTagProps) {
  const style = RISK_STYLES[riskTier] ?? 'bg-muted text-muted-foreground'
  const label = RISK_LABELS[riskTier] ?? riskTier
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${style}`}>
      {label}
    </span>
  )
}
