'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase'
import { RefreshCw } from 'lucide-react'

interface MessageRow {
  id: string
  content: string
  created_at: string
  match_id: string
  senderName: string
}

function formatDateTime(d: string) {
  return new Date(d).toLocaleString('en-EG', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function truncate(str: string, max: number) {
  if (str.length <= max) return str
  return str.slice(0, max) + 'â€¦'
}

function SkeletonRows({ rows = 10 }: { rows?: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <tr key={i}>
          {Array.from({ length: 4 }).map((_, j) => (
            <td key={j} className="px-4 py-3">
              <div className="h-4 w-full animate-pulse rounded bg-muted/20" />
            </td>
          ))}
        </tr>
      ))}
    </>
  )
}

export default function AdminMessagesPage() {
  const [messages, setMessages] = useState<MessageRow[]>([])
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    setLoading(true)
    const supabase = createClient()

    const { data } = await supabase
      .from('messages')
      .select(
        `
        id,
        content,
        created_at,
        match_id,
        sender_id,
        users:sender_id (
          full_name
        )
      `
      )
      .order('created_at', { ascending: false })
      .limit(100)

    if (!data) {
      setMessages([])
      setLoading(false)
      return
    }

    const rows: MessageRow[] = data.map((m: Record<string, unknown>) => {
      const sender = m.users as { full_name: string | null } | null
      return {
        id: m.id as string,
        content: m.content as string,
        created_at: m.created_at as string,
        match_id: m.match_id as string,
        senderName: sender?.full_name ?? 'Unknown',
      }
    })

    setMessages(rows)
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold text-navy">Messages</h1>
          <p className="mt-1 text-sm text-muted">
            Recent messages across all chats â€” read only for moderation
          </p>
        </div>
        <button
          onClick={fetchData}
          disabled={loading}
          className="inline-flex items-center gap-2 border border-muted/40 bg-white/60 px-4 py-2 rounded text-sm font-medium text-navy transition-colors hover:bg-white disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Table */}
      <div className="glass-card shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-[rgba(8,10,20,0.10)] text-[10px] tracking-[3px] uppercase text-[rgba(255,255,255,0.35)] font-body font-medium">
                <th className="px-6 py-4">Sender</th>
                <th className="px-6 py-4">Message</th>
                <th className="px-6 py-4">Match ID</th>
                <th className="px-6 py-4">Sent At</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgba(8,10,20,0.08)]">
              {loading ? (
                <SkeletonRows />
              ) : messages.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-10 text-center text-[rgba(255,255,255,0.35)] font-body font-light text-sm">
                    No messages yet.
                  </td>
                </tr>
              ) : (
                messages.map((msg) => (
                  <tr key={msg.id} className="transition-colors hover:bg-[rgba(255,255,255,0.04)]">
                    <td className="whitespace-nowrap px-6 py-4 font-body font-light text-[13px] text-[rgba(255,255,255,0.95)]">
                      {msg.senderName}
                    </td>
                    <td className="max-w-md px-6 py-4 font-body font-light text-[13px] text-[rgba(255,255,255,0.75)]">
                      <span title={msg.content}>{truncate(msg.content, 100)}</span>
                    </td>
                    <td className="px-6 py-4 font-body font-light text-[13px] text-[rgba(255,255,255,0.75)]">
                      <code className="rounded-[4px] bg-[rgba(255,255,255,0.08)] border border-[rgba(255,255,255,0.12)] px-2 py-0.5 text-xs text-gold">
                        {msg.match_id.slice(0, 8)}â€¦
                      </code>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 font-body font-light text-[13px] text-[rgba(255,255,255,0.75)]">
                      {formatDateTime(msg.created_at)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

