interface Params {}

export interface AtRiskRow {
  id: number
  donor: string
  giving_tier: string
  risk_tier: string
  last_gift_date: string | null
  days_quiet: number | null
  lifetime_giving: number
  notes: string | null
}

export default async function getAtRisk(_req: { params: Params }) {
  const result = await retoolDb.query<{
    id: number
    donor: string
    giving_tier: string
    risk_tier: string
    last_gift_date: string | null
    days_quiet: number | null
    lifetime_giving: string
    notes: string | null
  }>(`
    select d.id, d.first_name || ' ' || d.last_name as donor, d.giving_tier, d.risk_tier,
           d.last_gift_date, (current_date - d.last_gift_date) as days_quiet,
           d.lifetime_giving, d.notes
    from donors d
    where d.risk_tier in ('at_risk','lapsed')
    order by case d.giving_tier when 'major' then 0 when 'mid' then 1 else 2 end,
             d.lifetime_giving desc
  `)

  return result.data.map((row) => ({
    ...row,
    lifetime_giving: Number(row.lifetime_giving),
    days_quiet: row.days_quiet === null ? null : Number(row.days_quiet),
  }))
}
