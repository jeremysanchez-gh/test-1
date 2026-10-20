interface Params {
  id: number
  subject: string
  body: string
}

export default async function approveSend(req: { params: Params }) {
  const result = await retoolDb.query<{ id: number; status: string; sent_at: string }>(
    `update outreach set subject = $1, body = $2, status = 'sent', sent_at = now() where id = $3 returning id, status, sent_at`,
    [req.params.subject, req.params.body, req.params.id]
  )

  return result.data
}
