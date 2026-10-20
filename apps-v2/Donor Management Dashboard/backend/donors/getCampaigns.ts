interface Params {}

export interface CampaignRow {
  name: string
  status: string
  goal_amount: number
  raised: number
  pct_to_goal: number
}

export default async function getCampaigns(_req: { params: Params }) {
  const result = await retoolDb.query<{
    name: string
    status: string
    goal_amount: string
    raised: string
    pct_to_goal: string
  }>(`
    select c.name, c.status, c.goal_amount, coalesce(sum(g.amount),0) as raised,
           round(100 * coalesce(sum(g.amount),0) / c.goal_amount) as pct_to_goal
    from campaigns c left join gifts g on g.campaign_id = c.id
    group by c.id
    order by c.start_date desc
  `)

  return result.data.map((row) => ({
    ...row,
    goal_amount: Number(row.goal_amount),
    raised: Number(row.raised),
    pct_to_goal: Number(row.pct_to_goal),
  }))
}
