interface Params {}

export interface DraftRow {
  id: number
  donor: string
  type: string
  subject: string | null
  body: string | null
  created_at: string
}

export default async function getDrafts(_req: { params: Params }) {
  const result = await retoolDb.query<DraftRow>(`
    select o.id, d.first_name || ' ' || d.last_name as donor, o.type, o.subject, o.body, o.created_at
    from outreach o join donors d on d.id = o.donor_id
    where o.status = 'draft'
    order by o.created_at desc
  `)

  return result.data
}
