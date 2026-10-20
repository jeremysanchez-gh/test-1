interface Params {
  risk?: string
  tier?: string
  search?: string
}

export interface DonorRow {
  id: number
  donor: string
  email: string
  giving_tier: string
  risk_tier: string
  donor_since: string
  last_gift_date: string | null
  lifetime_giving: number
}

export default async function getDonors(req: { params: Params }) {
  const risk = req.params.risk ?? ''
  const tier = req.params.tier ?? ''
  const search = req.params.search ?? ''

  const result = await retoolDb.query<{
    id: number
    donor: string
    email: string
    giving_tier: string
    risk_tier: string
    donor_since: string
    last_gift_date: string | null
    lifetime_giving: string
  }>(
    `
    select id, first_name || ' ' || last_name as donor, email, giving_tier, risk_tier,
           donor_since, last_gift_date, lifetime_giving
    from donors
    where ($1 = '' or risk_tier = $2)
      and ($3 = '' or giving_tier = $4)
      and ($5 = '' or (first_name || ' ' || last_name || ' ' || email) ilike $6)
    order by last_gift_date desc nulls last
    limit 200
    `,
    [risk, risk, tier, tier, search, `%${search}%`]
  )

  return result.data.map((row) => ({
    ...row,
    lifetime_giving: Number(row.lifetime_giving),
  }))
}
