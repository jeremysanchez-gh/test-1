interface Params {}

export interface KpiRow {
  total_donors: number
  raised_ytd: number
  needs_attention: number
  repeat_donor_pct: number
}

export default async function getKpis(_req: { params: Params }) {
  const result = await retoolDb.query<{
    total_donors: string
    raised_ytd: string
    needs_attention: string
    repeat_donor_pct: string
  }>(`
    select
      (select count(*) from donors) as total_donors,
      (select coalesce(sum(amount),0) from gifts
        where extract(year from gift_date) = extract(year from current_date)) as raised_ytd,
      (select count(*) from donors where risk_tier in ('at_risk','lapsed')) as needs_attention,
      (select round(100.0 * count(*) filter (where n >= 2) / count(*), 1)
         from (select donor_id, count(*) n from gifts group by 1) s) as repeat_donor_pct
  `)

  const row = result.data[0]
  if (!row) {
    return { total_donors: 0, raised_ytd: 0, needs_attention: 0, repeat_donor_pct: 0 }
  }

  return {
    total_donors: Number(row.total_donors),
    raised_ytd: Number(row.raised_ytd),
    needs_attention: Number(row.needs_attention),
    repeat_donor_pct: Number(row.repeat_donor_pct),
  }
}
