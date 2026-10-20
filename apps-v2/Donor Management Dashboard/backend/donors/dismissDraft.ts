interface Params {
  id: number
}

export default async function dismissDraft(req: { params: Params }) {
  const result = await retoolDb.query<{ id: number; status: string }>(
    `update outreach set status = 'dismissed' where id = $1 returning id, status`,
    [req.params.id]
  )

  return result.data
}
