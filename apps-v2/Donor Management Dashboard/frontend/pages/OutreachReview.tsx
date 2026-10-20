import { useEffect, useState } from 'react'
import { Send, XCircle, Mail, Save, Pencil } from 'lucide-react'
import { useGetDrafts, useApproveSend, useDismissDraft, useSaveDraft } from '../hooks/backend/donors'
import { Table, TableBody, TableCell, TableHeader, TableRow } from '../lib/shadcn/table'
import { Card, CardContent } from '../lib/shadcn/card'
import { Button } from '../lib/shadcn/button'
import { Input } from '../lib/shadcn/input'
import { Textarea } from '../lib/shadcn/textarea'
import { SortableTableHead } from '../components/SortableTableHead'
import { useSortableData } from '../hooks/useSortableData'
import { formatDate } from '../utils/format'
import { toast } from '../lib/shadcn/sonner'
import { cn } from '../lib/shadcn/utils'

interface DraftRow {
  id: number
  donor: string
  type: string
  subject: string | null
  body: string | null
  created_at: string
}

export default function OutreachReview() {
  const draftsQuery = useGetDrafts()
  const approveSend = useApproveSend()
  const dismissDraft = useDismissDraft()
  const saveDraft = useSaveDraft()
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [actioningId, setActioningId] = useState<number | null>(null)
  const [subjectDraft, setSubjectDraft] = useState('')
  const [bodyDraft, setBodyDraft] = useState('')

  useEffect(() => {
    draftsQuery.trigger()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const drafts: DraftRow[] = draftsQuery.data ?? []
  const { sortedData: sortedDrafts, sortConfig, requestSort } = useSortableData<DraftRow>(drafts)
  const selectedDraft = drafts.find((d) => d.id === selectedId) ?? null

  // Reset the editable fields whenever the selected draft (or its saved content) changes.
  useEffect(() => {
    setSubjectDraft(selectedDraft?.subject ?? '')
    setBodyDraft(selectedDraft?.body ?? '')
  }, [selectedDraft?.id, selectedDraft?.subject, selectedDraft?.body])

  const isDirty =
    !!selectedDraft && (subjectDraft !== (selectedDraft.subject ?? '') || bodyDraft !== (selectedDraft.body ?? ''))

  async function handleSave(id: number) {
    setActioningId(id)
    try {
      await saveDraft.trigger({ id, subject: subjectDraft, body: bodyDraft }).result
      toast.success('Draft saved')
      draftsQuery.trigger(undefined, { skipCache: true })
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      toast.error(`Failed to save: ${message}`)
    } finally {
      setActioningId(null)
    }
  }

  async function handleApprove(id: number) {
    setActioningId(id)
    try {
      await approveSend.trigger({ id, subject: subjectDraft, body: bodyDraft }).result
      toast.success('Outreach sent')
      if (selectedId === id) setSelectedId(null)
      draftsQuery.trigger(undefined, { skipCache: true })
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      toast.error(`Failed to send: ${message}`)
    } finally {
      setActioningId(null)
    }
  }

  async function handleDismiss(id: number) {
    setActioningId(id)
    try {
      await dismissDraft.trigger({ id }).result
      toast.success('Draft dismissed')
      if (selectedId === id) setSelectedId(null)
      draftsQuery.trigger(undefined, { skipCache: true })
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      toast.error(`Failed to dismiss: ${message}`)
    } finally {
      setActioningId(null)
    }
  }

  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">
          {draftsQuery.loading ? 'Loading drafts…' : `${drafts.length} draft${drafts.length === 1 ? '' : 's'} awaiting review`}
        </p>
        {draftsQuery.error ? <p className="text-sm text-destructive">Error: {draftsQuery.error}</p> : null}
        {!draftsQuery.error && draftsQuery.dataAccessErrors.length > 0 ? (
          <p className="text-sm text-destructive">
            Access restricted: {draftsQuery.dataAccessErrors.map((e) => e.message).join('; ')}
          </p>
        ) : null}
        <Card className="overflow-hidden py-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <SortableTableHead sortKey="donor" sortConfig={sortConfig} onSort={requestSort}>
                  Donor
                </SortableTableHead>
                <SortableTableHead sortKey="type" sortConfig={sortConfig} onSort={requestSort}>
                  Type
                </SortableTableHead>
                <SortableTableHead sortKey="subject" sortConfig={sortConfig} onSort={requestSort}>
                  Subject
                </SortableTableHead>
                <SortableTableHead sortKey="created_at" sortConfig={sortConfig} onSort={requestSort}>
                  Created
                </SortableTableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {draftsQuery.loading && drafts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    Loading…
                  </TableCell>
                </TableRow>
              ) : null}
              {!draftsQuery.loading && drafts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    No drafts awaiting review.
                  </TableCell>
                </TableRow>
              ) : null}
              {sortedDrafts.map((draft) => (
                <TableRow
                  key={draft.id}
                  onClick={() => setSelectedId(draft.id)}
                  data-state={selectedId === draft.id ? 'selected' : undefined}
                  className="cursor-pointer"
                >
                  <TableCell className="font-medium">{draft.donor}</TableCell>
                  <TableCell className="capitalize text-muted-foreground">
                    {draft.type.replace(/_/g, ' ')}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{draft.subject ?? '—'}</TableCell>
                  <TableCell className="text-muted-foreground">{formatDate(draft.created_at)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </div>

      <Card className={cn('h-fit', !selectedDraft && 'flex items-center justify-center')}>
        <CardContent className="w-full pt-density-xl">
          {selectedDraft ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">To</p>
                  <p className="text-sm font-medium">{selectedDraft.donor}</p>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Pencil className="h-3.5 w-3.5" />
                  Editable before sending
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground" htmlFor="draft-subject">
                  Subject
                </label>
                <Input
                  id="draft-subject"
                  value={subjectDraft}
                  onChange={(e) => setSubjectDraft(e.target.value)}
                  disabled={actioningId === selectedDraft.id}
                  className="font-medium"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground" htmlFor="draft-body">
                  Message
                </label>
                <Textarea
                  id="draft-body"
                  value={bodyDraft}
                  onChange={(e) => setBodyDraft(e.target.value)}
                  disabled={actioningId === selectedDraft.id}
                  rows={10}
                  className="leading-relaxed"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2 border-t border-border pt-4">
                <Button
                  onClick={() => handleApprove(selectedDraft.id)}
                  disabled={actioningId === selectedDraft.id || subjectDraft.trim() === '' || bodyDraft.trim() === ''}
                >
                  <Send className="h-4 w-4" />
                  Approve and send
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleSave(selectedDraft.id)}
                  disabled={actioningId === selectedDraft.id || !isDirty}
                >
                  <Save className="h-4 w-4" />
                  Save changes
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => handleDismiss(selectedDraft.id)}
                  disabled={actioningId === selectedDraft.id}
                >
                  <XCircle className="h-4 w-4" />
                  Dismiss
                </Button>
                {isDirty ? <span className="text-xs text-muted-foreground">Unsaved changes</span> : null}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 py-10 text-center text-muted-foreground">
              <Mail className="h-8 w-8 opacity-40" />
              <p className="text-sm">Select a draft to preview and edit it here.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
