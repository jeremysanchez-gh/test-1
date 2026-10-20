interface Params {}

export interface GiftsByMonthRow {
  month: string
  raised: number
  gifts: number
}

export default async function getGiftsByMonth(_req: { params: Params }) {
  const result = await retoolDb.query<{ month: string; raised: number; gifts: string }>(`
    select date_trunc('month', gift_date)::date as month,
           sum(amount)::float as raised,
           count(*) as gifts
    from gifts
    where gift_date >= current_date - interval '24 months'
    group by 1 order by 1
  `)

  return result.data.map((row) => ({
    month: row.month,
    raised: Number(row.raised),
    gifts: Number(row.gifts),
  }))
}
