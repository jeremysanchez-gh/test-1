interface Params {
  donorId: number
}

export interface DonorGiftRow {
  gift_date: string
  amount: number
  campaign: string | null
  payment_method: string
  source: string
  is_first_gift: boolean
}

export default async function getDonorGifts(req: { params: Params }) {
  const result = await retoolDb.query<{
    gift_date: string
    amount: string
    campaign: string | null
    payment_method: string
    source: string
    is_first_gift: boolean
  }>(
    `
    select g.gift_date, g.amount, c.name as campaign, g.payment_method, g.source, g.is_first_gift
    from gifts g left join campaigns c on c.id = g.campaign_id
    where g.donor_id = $1
    order by g.gift_date desc
    `,
    [req.params.donorId]
  )

  return result.data.map((row) => ({
    ...row,
    amount: Number(row.amount),
  }))
}
