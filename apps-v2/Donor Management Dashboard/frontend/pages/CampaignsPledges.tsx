import { useEffect } from 'react'
import { Target, CircleDollarSign } from 'lucide-react'
import { useGetCampaigns, useGetPledges } from '../hooks/backend/donors'
import { Table, TableBody, TableCell, TableHeader, TableRow } from '../lib/shadcn/table'
import { Card } from '../lib/shadcn/card'
import { Progress } from '../lib/shadcn/progress'
import { SortableTableHead } from '../components/SortableTableHead'
import { useSortableData } from '../hooks/useSortableData'
import { formatCurrency, formatDate } from '../utils/format'

interface CampaignRow {
  name: string
  status: string
  goal_amount: number
  raised: number
  pct_to_goal: number
}

interface PledgeRow {
  id: number
  donor: string
  installment_amount: number
  frequency: string
  next_due_date: string | null
  remaining_balance: number
  status: string
  due_soon: boolean
}

export default function CampaignsPledges() {
  const campaignsQuery = useGetCampaigns()
  const pledgesQuery = useGetPledges()

  useEffect(() => {
    campaignsQuery.trigger()
    pledgesQuery.trigger()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const campaigns: CampaignRow[] = campaignsQuery.data ?? []
  const { sortedData: sortedCampaigns, sortConfig: campaignSort, requestSort: requestCampaignSort } =
    useSortableData<CampaignRow>(campaigns)

  const pledges: PledgeRow[] = pledgesQuery.data ?? []
  const { sortedData: sortedPledges, sortConfig: pledgeSort, requestSort: requestPledgeSort } =
    useSortableData<PledgeRow>(pledges)

  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <Target className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-lg font-semibold">Campaigns</h2>
        </div>
        {campaignsQuery.error ? (
          <p className="text-sm text-destructive">Error: {campaignsQuery.error}</p>
        ) : null}
        {!campaignsQuery.error && campaignsQuery.dataAccessErrors.length > 0 ? (
          <p className="text-sm text-destructive">
            Access restricted: {campaignsQuery.dataAccessErrors.map((e) => e.message).join('; ')}
          </p>
        ) : null}
        <Card className="overflow-hidden py-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <SortableTableHead sortKey="name" sortConfig={campaignSort} onSort={requestCampaignSort}>
                  Campaign
                </SortableTableHead>
                <SortableTableHead sortKey="status" sortConfig={campaignSort} onSort={requestCampaignSort}>
                  Status
                </SortableTableHead>
                <SortableTableHead
                  sortKey="goal_amount"
                  sortConfig={campaignSort}
                  onSort={requestCampaignSort}
                  align="right"
                  className="text-right"
                >
                  Goal
                </SortableTableHead>
                <SortableTableHead
                  sortKey="raised"
                  sortConfig={campaignSort}
                  onSort={requestCampaignSort}
                  align="right"
                  className="text-right"
                >
                  Raised
                </SortableTableHead>
                <SortableTableHead
                  sortKey="pct_to_goal"
                  sortConfig={campaignSort}
                  onSort={requestCampaignSort}
                  className="w-64"
                >
                  Progress
                </SortableTableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {campaignsQuery.loading && campaigns.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    Loading…
                  </TableCell>
                </TableRow>
              ) : null}
              {!campaignsQuery.loading && campaigns.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    No campaigns found.
                  </TableCell>
                </TableRow>
              ) : null}
              {sortedCampaigns.map((campaign) => (
                <TableRow key={campaign.name}>
                  <TableCell className="font-medium">{campaign.name}</TableCell>
                  <TableCell>
                    <span
                      className={
                        campaign.status === 'active'
                          ? 'inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold capitalize text-green-800 dark:bg-green-950 dark:text-green-200'
                          : 'inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-xs font-semibold capitalize text-muted-foreground'
                      }
                    >
                      {campaign.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">{formatCurrency(campaign.goal_amount)}</TableCell>
                  <TableCell className="text-right font-medium">{formatCurrency(campaign.raised)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Progress value={Math.min(campaign.pct_to_goal, 100)} className="h-2" />
                      <span className="w-12 shrink-0 text-right text-xs text-muted-foreground">
                        {campaign.pct_to_goal}%
                      </span>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </section>

      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <CircleDollarSign className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-lg font-semibold">Pledges</h2>
        </div>
        {pledgesQuery.error ? <p className="text-sm text-destructive">Error: {pledgesQuery.error}</p> : null}
        {!pledgesQuery.error && pledgesQuery.dataAccessErrors.length > 0 ? (
          <p className="text-sm text-destructive">
            Access restricted: {pledgesQuery.dataAccessErrors.map((e) => e.message).join('; ')}
          </p>
        ) : null}
        <Card className="overflow-hidden py-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <SortableTableHead sortKey="donor" sortConfig={pledgeSort} onSort={requestPledgeSort}>
                  Donor
                </SortableTableHead>
                <SortableTableHead
                  sortKey="installment_amount"
                  sortConfig={pledgeSort}
                  onSort={requestPledgeSort}
                  align="right"
                  className="text-right"
                >
                  Installment
                </SortableTableHead>
                <SortableTableHead sortKey="frequency" sortConfig={pledgeSort} onSort={requestPledgeSort}>
                  Frequency
                </SortableTableHead>
                <SortableTableHead sortKey="next_due_date" sortConfig={pledgeSort} onSort={requestPledgeSort}>
                  Next due
                </SortableTableHead>
                <SortableTableHead
                  sortKey="remaining_balance"
                  sortConfig={pledgeSort}
                  onSort={requestPledgeSort}
                  align="right"
                  className="text-right"
                >
                  Remaining
                </SortableTableHead>
                <SortableTableHead sortKey="status" sortConfig={pledgeSort} onSort={requestPledgeSort}>
                  Status
                </SortableTableHead>
                <TableCell className="p-density-lg text-left align-middle font-medium text-muted-foreground">
                  Due soon
                </TableCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pledgesQuery.loading && pledges.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                    Loading…
                  </TableCell>
                </TableRow>
              ) : null}
              {!pledgesQuery.loading && pledges.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                    No pledges found.
                  </TableCell>
                </TableRow>
              ) : null}
              {sortedPledges.map((pledge) => (
                <TableRow key={pledge.id}>
                  <TableCell className="font-medium">{pledge.donor}</TableCell>
                  <TableCell className="text-right">{formatCurrency(pledge.installment_amount)}</TableCell>
                  <TableCell className="capitalize text-muted-foreground">{pledge.frequency}</TableCell>
                  <TableCell className="text-muted-foreground">{formatDate(pledge.next_due_date)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(pledge.remaining_balance)}</TableCell>
                  <TableCell className="capitalize text-muted-foreground">{pledge.status}</TableCell>
                  <TableCell>
                    {pledge.due_soon ? (
                      <span className="inline-flex items-center rounded-full bg-orange-100 px-2.5 py-0.5 text-xs font-semibold text-orange-800 dark:bg-orange-950 dark:text-orange-200">
                        Due soon
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </section>
    </div>
  )
}
