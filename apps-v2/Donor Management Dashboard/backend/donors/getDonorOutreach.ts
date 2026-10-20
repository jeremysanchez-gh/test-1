interface Params {
  donorId: number
}

export interface DonorOutreachRow {
  date: string
  type: string
  status: string
  subject: string | null
  created_by: string
}

export default async function getDonorOutreach(req: { params: Params }) {
  const result = await retoolDb.query<DonorOutreachRow>(
    `
    select created_at::date as date, type, status, subject, created_by
    from outreach
    where donor_id = $1
    order by created_at desc
    `,
    [req.params.donorId]
  )

  return result.data
}
