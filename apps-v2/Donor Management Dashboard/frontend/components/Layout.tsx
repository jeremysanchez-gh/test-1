import { ReactNode } from 'react'
import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Users, AlertTriangle, Target, Mail, HeartHandshake } from 'lucide-react'
import { cn } from '../lib/shadcn/utils'

interface LayoutProps {
  children: ReactNode
}

const TABS = [
  { to: '/', label: 'Dashboard', end: true, icon: LayoutDashboard },
  { to: '/donors', label: 'Donors', end: false, icon: Users },
  { to: '/at-risk', label: 'At-Risk Queue', end: false, icon: AlertTriangle },
  { to: '/campaigns', label: 'Campaigns & Pledges', end: false, icon: Target },
  { to: '/outreach', label: 'Outreach Review', end: false, icon: Mail },
]

export function Layout({ children }: LayoutProps) {
  const lastUpdated = new Date().toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })

  return (
    <div className="min-h-screen bg-muted/30 text-foreground">
      <header className="border-b border-border bg-background px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <HeartHandshake className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Donor Command Center</h1>
            <p className="text-sm text-muted-foreground">Last updated {lastUpdated}</p>
          </div>
        </div>
      </header>
      <nav className="flex gap-1 overflow-x-auto border-b border-border bg-background px-6">
        {TABS.map((tab) => {
          const Icon = tab.icon
          return (
            <NavLink
              key={tab.to}
              to={tab.to}
              end={tab.end}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-2 whitespace-nowrap border-b-2 -mb-px px-4 py-3 text-sm font-medium transition-colors',
                  isActive
                    ? 'border-primary text-foreground'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                )
              }
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </NavLink>
          )
        })}
      </nav>
      <main className="p-6">{children}</main>
    </div>
  )
}
