'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getNotificationsDB, markAllReadDB, markOneReadDB } from '@/lib/notifications'
import type { Notification } from '@/lib/types'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Bell, ArrowRight, ArrowLeft } from 'lucide-react'

function timeAgo(iso: string) {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (s < 60) return 'just now'
  if (s < 3600) return `${Math.floor(s / 60)}m ago`
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`
  return `${Math.floor(s / 86400)}d ago`
}

const TYPE_LABELS: Record<string, string> = {
  new_interest:            'New interest',
  interest_accepted:       'Interest accepted',
  interest_declined:       'Interest declined',
  new_message:             'New message',
  startup_approved:        'Startup approved',
  startup_rejected:        'Startup rejected',
  startup_changes_requested: 'Changes requested',
  investor_approved:       'Investor approved',
  investor_rejected:       'Investor rejected',
  deal_closed:             'Deal closed',
}

export default function NotificationsPage() {
  const router = useRouter()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getNotificationsDB().then((n) => { setNotifications(n); setLoading(false) })
  }, [])

  const handleMarkAllRead = async () => {
    await markAllReadDB()
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
  }

  const handleClick = async (n: Notification) => {
    if (!n.is_read) {
      await markOneReadDB(n.id)
      setNotifications((prev) => prev.map((x) => x.id === n.id ? { ...x, is_read: true } : x))
    }
    if (n.link) router.push(n.link)
  }

  const hasUnread = notifications.some((n) => !n.is_read)

  return (
    <div className="mx-auto w-full max-w-2xl px-4 pt-20 pb-16 sm:px-6">
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <button
            type="button"
            onClick={() => router.back()}
            className="mb-3 flex items-center gap-1.5 text-[13px] text-cream-muted hover:text-cream transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back
          </button>
          <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.14em] text-cream-muted">Activity</p>
          <h1 className="text-[32px] font-black tracking-tightest text-cream">Notifications</h1>
        </div>
        {hasUnread && (
          <Button variant="secondary" size="sm" onClick={handleMarkAllRead}>Mark all read</Button>
        )}
      </div>

      {loading && (
        <div className="space-y-3">{[1,2,3,4].map(i => <div key={i} className="shimmer h-20 rounded-card" />)}</div>
      )}

      {!loading && notifications.length === 0 && (
        <Card className="py-12 text-center">
          <Bell className="mx-auto mb-3 h-8 w-8 text-cream-subtle" />
          <p className="text-[15px] font-bold text-cream">No notifications yet</p>
          <p className="mt-1 text-[13px] text-cream-muted">Activity from investors and matches will appear here.</p>
        </Card>
      )}

      <div className="space-y-2">
        {notifications.map((n) => (
          <button
            key={n.id}
            onClick={() => handleClick(n)}
            className={`w-full text-left transition-all duration-150 ${n.link ? 'cursor-pointer' : 'cursor-default'}`}
          >
            <Card className={`${!n.is_read ? 'border-[rgba(75,124,246,0.25)] bg-[rgba(75,124,246,0.05)]' : 'opacity-70'} hover:opacity-100 transition-opacity`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-cream-subtle">
                      {TYPE_LABELS[n.type] ?? n.type}
                    </span>
                    {!n.is_read && <Badge variant="blue">New</Badge>}
                  </div>
                  <p className="text-[14px] text-cream leading-relaxed">{n.message}</p>
                  <p className="mt-1.5 text-[11px] text-cream-subtle">{timeAgo(n.created_at)}</p>
                </div>
                {n.link && <ArrowRight className="h-4 w-4 text-cream-subtle shrink-0 mt-0.5" />}
              </div>
            </Card>
          </button>
        ))}
      </div>
    </div>
  )
}
