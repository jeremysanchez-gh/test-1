interface Params {}

export interface PledgeRow {
  id: number
  donor: string
  installment_amount: number
  frequency: string
  next_due_date: string | null
  remaining_balance: number
  status: string
  due_soon: boolean
}

export default async function getPledges(_req: { params: Params }) {
  const result = await retoolDb.query<{
    id: number
    donor: string
    installment_amount: string
    frequency: string
    next_due_date: string | null
    remaining_balance: string
    status: string
    due_soon: boolean
  }>(`
    select p.id, d.first_name || ' ' || d.last_name as donor, p.installment_amount, p.frequency,
           p.next_due_date, p.remaining_balance, p.status,
           (p.next_due_date <= current_date + 3) as due_soon
    from pledges p join donors d on d.id = p.donor_id
    order by p.next_due_date nulls last
  `)

  return result.data.map((row) => ({
    ...row,
    installment_amount: Number(row.installment_amount),
    remaining_balance: Number(row.remaining_balance),
  }))
}
