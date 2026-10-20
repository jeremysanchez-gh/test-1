import { useEffect, useState } from 'react'
import { Search, Mail } from 'lucide-react'
import { useGetDonors, useGetDonorGifts, useGetDonorOutreach } from '../hooks/backend/donors'
import { Input } from '../lib/shadcn/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../lib/shadcn/select'
import { Table, TableBody, TableCell, TableHeader, TableRow } from '../lib/shadcn/table'
import { Card, CardContent } from '../lib/shadcn/card'
import { RiskTag } from '../components/RiskTag'
import { SortableTableHead } from '../components/SortableTableHead'
import { useSortableData } from '../hooks/useSortableData'
import { formatCurrency, formatDate, formatMonthYear } from '../utils/format'
import { cn } from '../lib/shadcn/utils'

interface DonorRow {
  id: number
  donor: string
  email: string
  giving_tier: string
  risk_tier: string
  donor_since: string
  last_gift_date: string | null
  lifetime_giving: number
}

interface DonorGiftRow {
  gift_date: string
  amount: number
  campaign: string | null
  payment_method: string
  source: string
  is_first_gift: boolean
}

interface DonorOutreachRow {
  date: string
  type: string
  status: string
  subject: string | null
  created_by: string
}

const RISK_OPTIONS = [
  { value: 'all', label: 'All risk tiers' },
  { value: 'new', label: 'New' },
  { value: 'safe', label: 'Safe' },
  { value: 'watch', label: 'Watch' },
  { value: 'at_risk', label: 'At risk' },
  { value: 'lapsed', label: 'Lapsed' },
]

const TIER_OPTIONS = [
  { value: 'all', label: 'All giving tiers' },
  { value: 'major', label: 'Major' },
  { value: 'mid', label: 'Mid' },
  { value: 'grassroots', label: 'Grassroots' },
]

function initials(name: string): string {
  const parts = name.trim().split(/\s+/)
  const first = parts[0]?.[0] ?? ''
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? '') : ''
  return (first + last).toUpperCase()
}

export default function Donors() {
  const [searchInput, setSearchInput] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [risk, setRisk] = useState('all')
  const [tier, setTier] = useState('all')
  const [selectedDonorId, setSelectedDonorId] = useState<number | null>(null)

  const donorsQuery = useGetDonors()
  const donorGiftsQuery = useGetDonorGifts()
  const donorOutreachQuery = useGetDonorOutreach()

  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedSearch(searchInput), 300)
    return () => clearTimeout(timeout)
  }, [searchInput])

  useEffect(() => {
    donorsQuery.trigger({
      risk: risk === 'all' ? '' : risk,
      tier: tier === 'all' ? '' : tier,
      search: debouncedSearch,
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [risk, tier, debouncedSearch])

  useEffect(() => {
    if (selectedDonorId !== null) {
      donorGiftsQuery.trigger({ donorId: selectedDonorId })
      donorOutreachQuery.trigger({ donorId: selectedDonorId })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDonorId])

  const donors: DonorRow[] = donorsQuery.data ?? []
  const { sortedData: sortedDonors, sortConfig, requestSort } = useSortableData<DonorRow>(donors)
  const selectedDonor = donors.find((d) => d.id === selectedDonorId) ?? null
  const gifts: DonorGiftRow[] = donorGiftsQuery.data ?? []
  const outreach: DonorOutreachRow[] = donorOutreachQuery.data ?? []

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search name or email"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={risk} onValueChange={setRisk}>
          <SelectTrigger className="sm:w-48">
            <SelectValue placeholder="Risk" />
          </SelectTrigger>
          <SelectContent>
            {RISK_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={tier} onValueChange={setTier}>
          <SelectTrigger className="sm:w-48">
            <SelectValue placeholder="Tier" />
          </SelectTrigger>
          <SelectContent>
            {TIER_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {donorsQuery.error ? (
        <p className="text-sm text-destructive">Error: {donorsQuery.error}</p>
      ) : null}
      {!donorsQuery.error && donorsQuery.dataAccessErrors.length > 0 ? (
        <p className="text-sm text-destructive">
          Access restricted: {donorsQuery.dataAccessErrors.map((e) => e.message).join('; ')}
        </p>
      ) : null}

      <p className="text-sm text-muted-foreground">
        {donorsQuery.loading ? 'Loading donors…' : `${donors.length} donor${donors.length === 1 ? '' : 's'} found`}
      </p>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <Card className="overflow-hidden py-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <SortableTableHead sortKey="donor" sortConfig={sortConfig} onSort={requestSort}>
                  Donor
                </SortableTableHead>
                <SortableTableHead sortKey="giving_tier" sortConfig={sortConfig} onSort={requestSort}>
                  Tier
                </SortableTableHead>
                <SortableTableHead sortKey="risk_tier" sortConfig={sortConfig} onSort={requestSort}>
                  Risk
                </SortableTableHead>
                <SortableTableHead sortKey="last_gift_date" sortConfig={sortConfig} onSort={requestSort}>
                  Last gift
                </SortableTableHead>
                <SortableTableHead
                  sortKey="lifetime_giving"
                  sortConfig={sortConfig}
                  onSort={requestSort}
                  align="right"
                  className="text-right"
                >
                  Lifetime
                </SortableTableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {donorsQuery.loading && donors.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    Loading…
                  </TableCell>
                </TableRow>
              ) : null}
              {!donorsQuery.loading && donors.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    No donors match these filters.
                  </TableCell>
                </TableRow>
              ) : null}
              {sortedDonors.map((donor) => (
                <TableRow
                  key={donor.id}
                  onClick={() => setSelectedDonorId(donor.id)}
                  data-state={selectedDonorId === donor.id ? 'selected' : undefined}
                  className="cursor-pointer"
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                        {initials(donor.donor)}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-medium">{donor.donor}</p>
                        <p className="truncate text-xs text-muted-foreground">{donor.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="capitalize">{donor.giving_tier}</TableCell>
                  <TableCell>
                    <RiskTag riskTier={donor.risk_tier} />
                  </TableCell>
                  <TableCell className="text-muted-foreground">{formatDate(donor.last_gift_date)}</TableCell>
                  <TableCell className="text-right font-medium">{formatCurrency(donor.lifetime_giving)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>

        <Card className={cn('h-fit', !selectedDonor && 'flex items-center justify-center')}>
          <CardContent className="w-full pt-density-xl">
            {selectedDonor ? (
              <div>
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                    {initials(selectedDonor.donor)}
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold leading-tight">{selectedDonor.donor}</h2>
                    <p className="text-sm text-muted-foreground">
                      <span className="capitalize">{selectedDonor.giving_tier}</span> · since{' '}
                      {formatMonthYear(selectedDonor.donor_since)} · lifetime{' '}
                      {formatCurrency(selectedDonor.lifetime_giving)}
                    </p>
                  </div>
                </div>

                <div className="mt-5">
                  <h3 className="mb-2 text-sm font-semibold text-muted-foreground">Gifts</h3>
                  {donorGiftsQuery.error ? (
                    <p className="text-sm text-destructive">Error: {donorGiftsQuery.error}</p>
                  ) : null}
                  <div className="overflow-hidden rounded-md border border-border">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/40 hover:bg-muted/40">
                          <TableCell className="p-density-sm px-3 text-xs font-medium text-muted-foreground">
                            Date
                          </TableCell>
                          <TableCell className="p-density-sm px-3 text-xs font-medium text-muted-foreground">
                            Campaign
                          </TableCell>
                          <TableCell className="p-density-sm px-3 text-xs font-medium text-muted-foreground">
                            Method
                          </TableCell>
                          <TableCell className="p-density-sm px-3 text-right text-xs font-medium text-muted-foreground">
                            Amount
                          </TableCell>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {donorGiftsQuery.loading ? (
                          <TableRow>
                            <TableCell colSpan={4} className="p-density-sm px-3 text-center text-muted-foreground">
                              Loading…
                            </TableCell>
                          </TableRow>
                        ) : null}
                        {!donorGiftsQuery.loading && gifts.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={4} className="p-density-sm px-3 text-center text-muted-foreground">
                              No gifts recorded.
                            </TableCell>
                          </TableRow>
                        ) : null}
                        {gifts.map((gift, idx) => (
                          <TableRow key={idx}>
                            <TableCell className="p-density-sm px-3 text-sm">
                              {formatDate(gift.gift_date)}
                              {gift.is_first_gift ? (
                                <span className="ml-2 rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
                                  first gift
                                </span>
                              ) : null}
                            </TableCell>
                            <TableCell className="p-density-sm px-3 text-sm text-muted-foreground">
                              {gift.campaign ?? '—'}
                            </TableCell>
                            <TableCell className="p-density-sm px-3 text-sm capitalize text-muted-foreground">
                              {gift.payment_method}
                            </TableCell>
                            <TableCell className="p-density-sm px-3 text-right text-sm font-medium">
                              {formatCurrency(gift.amount)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>

                <div className="mt-5">
                  <h3 className="mb-2 text-sm font-semibold text-muted-foreground">Outreach</h3>
                  {donorOutreachQuery.error ? (
                    <p className="text-sm text-destructive">Error: {donorOutreachQuery.error}</p>
                  ) : null}
                  <div className="overflow-hidden rounded-md border border-border">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/40 hover:bg-muted/40">
                          <TableCell className="p-density-sm px-3 text-xs font-medium text-muted-foreground">
                            Date
                          </TableCell>
                          <TableCell className="p-density-sm px-3 text-xs font-medium text-muted-foreground">
                            Type
                          </TableCell>
                          <TableCell className="p-density-sm px-3 text-xs font-medium text-muted-foreground">
                            Status
                          </TableCell>
                          <TableCell className="p-density-sm px-3 text-xs font-medium text-muted-foreground">
                            Subject
                          </TableCell>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {donorOutreachQuery.loading ? (
                          <TableRow>
                            <TableCell colSpan={4} className="p-density-sm px-3 text-center text-muted-foreground">
                              Loading…
                            </TableCell>
                          </TableRow>
                        ) : null}
                        {!donorOutreachQuery.loading && outreach.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={4} className="p-density-sm px-3 text-center text-muted-foreground">
                              No outreach recorded.
                            </TableCell>
                          </TableRow>
                        ) : null}
                        {outreach.map((item, idx) => (
                          <TableRow key={idx}>
                            <TableCell className="p-density-sm px-3 text-sm">{formatDate(item.date)}</TableCell>
                            <TableCell className="p-density-sm px-3 text-sm capitalize text-muted-foreground">
                              {item.type.replace(/_/g, ' ')}
                            </TableCell>
                            <TableCell className="p-density-sm px-3 text-sm capitalize text-muted-foreground">
                              {item.status}
                            </TableCell>
                            <TableCell className="p-density-sm px-3 text-sm text-muted-foreground">
                              {item.subject ?? '—'}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 py-10 text-center text-muted-foreground">
                <Mail className="h-8 w-8 opacity-40" />
                <p className="text-sm">Click a donor to see their gift and outreach history.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
