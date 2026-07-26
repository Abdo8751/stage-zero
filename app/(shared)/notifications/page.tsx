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
  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (seconds < 60) return 'just now'
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  return `${Math.floor(seconds / 86400)}d ago`
}

const typeLabels: Record<string, string> = {
  new_interest: 'New interest', interest_accepted: 'Interest accepted', interest_declined: 'Interest declined', new_message: 'New message', startup_approved: 'Startup approved', startup_rejected: 'Startup rejected', startup_changes_requested: 'Changes requested', investor_approved: 'Investor approved', investor_rejected: 'Investor rejected', deal_closed: 'Deal closed',
}

export default function NotificationsPage() {
  const router = useRouter()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  useEffect(() => { getNotificationsDB().then((items) => { setNotifications(items); setLoading(false) }) }, [])

  const handleMarkAllRead = async () => { await markAllReadDB(); setNotifications((items) => items.map((item) => ({ ...item, is_read: true }))) }
  const handleClick = async (notification: Notification) => {
    if (!notification.is_read) { await markOneReadDB(notification.id); setNotifications((items) => items.map((item) => item.id === notification.id ? { ...item, is_read: true } : item)) }
    if (notification.link) router.push(notification.link)
  }
  const hasUnread = notifications.some((notification) => !notification.is_read)

  return (
    <div className="relative mx-auto w-full max-w-3xl px-4 pb-16 pt-28 sm:px-6">
      <div className="paper-grain pointer-events-none fixed inset-0 -z-10 opacity-20" />
      <div className="mb-8 flex items-start justify-between gap-4">
        <div><button type="button" onClick={() => router.back()} className="mb-5 flex items-center gap-1.5 text-[13px] text-ink/60 transition-colors hover:text-ink"><ArrowLeft className="h-3.5 w-3.5" />Back</button><p className="font-mono text-[10px] font-bold uppercase tracking-[.14em] text-blue-accent">Activity</p><h1 className="mt-4 font-serif text-[clamp(2.7rem,6vw,4rem)] font-semibold tracking-[-.04em] text-ink">Notifications</h1></div>
        {hasUnread && <Button variant="secondary" size="sm" onClick={handleMarkAllRead}>Mark all read</Button>}
      </div>

      {loading && <div className="space-y-3">{[1, 2, 3, 4].map((item) => <div key={item} className="shimmer h-20 rounded-card" />)}</div>}
      {!loading && notifications.length === 0 && <Card className="py-12 text-center sm:py-16"><span className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-warm-cream"><Bell className="h-6 w-6 text-amber" /></span><p className="font-serif text-3xl font-semibold tracking-[-.035em] text-ink">No notifications yet</p><p className="mt-3 text-[13px] font-normal text-ink/60">Activity from investors and matches will appear here.</p></Card>}

      <div className="space-y-2">
        {notifications.map((notification) => (
          <button key={notification.id} onClick={() => handleClick(notification)} className={`w-full text-left transition-all duration-150 ${notification.link ? 'cursor-pointer' : 'cursor-default'}`}>
            <Card className={`${!notification.is_read ? 'border-blue-accent/25 bg-blue-accent/5' : 'opacity-70'} transition-opacity hover:opacity-100`}>
              <div className="flex items-start justify-between gap-3"><div className="min-w-0 flex-1"><div className="mb-1 flex flex-wrap items-center gap-2"><span className="font-mono text-[10px] font-bold uppercase tracking-[.12em] text-ink/45">{typeLabels[notification.type] ?? notification.type}</span>{!notification.is_read && <Badge variant="blue">New</Badge>}</div><p className="text-[14px] font-normal leading-relaxed text-ink">{notification.message}</p><p className="mt-1.5 text-[11px] text-ink/45">{timeAgo(notification.created_at)}</p></div>{notification.link && <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-ink/40" />}</div>
            </Card>
          </button>
        ))}
      </div>
    </div>
  )
}
