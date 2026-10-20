interface Params {
  id: number
  subject: string
  body: string
}

export default async function saveDraft(req: { params: Params }) {
  const result = await retoolDb.query<{ id: number; subject: string; body: string }>(
    `update outreach set subject = $1, body = $2 where id = $3 returning id, subject, body`,
    [req.params.subject, req.params.body, req.params.id]
  )

  return result.data
}
