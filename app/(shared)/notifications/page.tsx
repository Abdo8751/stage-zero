'use client'

import { useEffect, useState } from 'react'
import {
  getNotifications,
  markAllNotificationsRead,
  type AppNotification,
} from '@/lib/auth'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<AppNotification[]>([])

  useEffect(() => {
    setNotifications(getNotifications())
  }, [])

  const handleMarkAllRead = () => {
    markAllNotificationsRead()
    setNotifications(getNotifications())
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8 sm:py-12">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl sm:text-4xl">Notifications</h1>
          <p className="mt-2 text-muted">Your latest activity</p>
        </div>
        {notifications.some((n) => !n.is_read) && (
          <Button variant="secondary" size="sm" onClick={handleMarkAllRead}>
            Mark all read
          </Button>
        )}
      </div>

      {notifications.length === 0 && (
        <div className="mt-12 text-center text-muted">
          <p>No notifications yet.</p>
        </div>
      )}

      <div className="mt-8 space-y-3">
        {notifications.map((n) => (
          <Card key={n.id} className={n.is_read ? 'opacity-70' : ''}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-medium">{n.title}</h3>
                <p className="mt-1 text-sm text-muted">{n.body}</p>
                <p className="mt-2 text-xs text-muted/80">
                  {new Date(n.created_at).toLocaleString()}
                </p>
              </div>
              {!n.is_read && <Badge variant="gold">New</Badge>}
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
