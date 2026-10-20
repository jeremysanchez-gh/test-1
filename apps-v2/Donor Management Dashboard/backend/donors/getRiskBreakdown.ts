interface Params {}

export interface RiskBreakdownRow {
  risk_tier: string
  donors: number
}

export default async function getRiskBreakdown(_req: { params: Params }) {
  const result = await retoolDb.query<{ risk_tier: string; donors: string }>(`
    select risk_tier, count(*) as donors from donors group by 1 order by 2 desc
  `)

  return result.data.map((row) => ({
    risk_tier: row.risk_tier,
    donors: Number(row.donors),
  }))
}
