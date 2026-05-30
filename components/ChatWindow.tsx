'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useMessages } from '@/hooks/useMessages'
import type { MessageWithSender } from '@/lib/types'

interface ChatWindowProps {
  matchId: string
  currentUserId: string
  onDealClosed?: () => void
}

function MessageBubble({ message, isOwn }: { message: MessageWithSender; isOwn: boolean }) {
  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[85%] rounded px-4 py-2 text-sm sm:max-w-[70%] ${
          isOwn ? 'bg-navy text-cream' : 'border border-muted/30 bg-white/60 text-navy'
        }`}
      >
        {!isOwn && message.users?.full_name && (
          <p className="mb-1 text-xs font-medium opacity-70">{message.users.full_name}</p>
        )}
        <p>{message.content}</p>
        <p className="mt-1 text-[10px] opacity-60">
          {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
    </div>
  )
}

export function ChatWindow({ matchId, currentUserId, onDealClosed }: ChatWindowProps) {
  const { messages, loading, error, sendMessage } = useMessages(matchId)
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)
  const [sendError, setSendError] = useState<string | null>(null)

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    setSending(true)
    setSendError(null)
    const err = await sendMessage(draft)
    if (err) {
      setSendError(err)
    } else {
      setDraft('')
    }
    setSending(false)
  }

  return (
    <div className="flex h-[calc(100vh-12rem)] flex-col rounded border border-muted/30 bg-white/30 sm:h-[600px]">
      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {loading && <p className="text-sm text-muted">Loading messages…</p>}
        {error && <p className="text-sm text-red-600">{error}</p>}
        {!loading && messages.length === 0 && (
          <p className="text-center text-sm text-muted">No messages yet. Say hello!</p>
        )}
        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} isOwn={msg.sender_id === currentUserId} />
        ))}
      </div>

      <form onSubmit={handleSend} className="border-t border-muted/30 p-4">
        {sendError && <p className="mb-2 text-sm text-red-600">{sendError}</p>}
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Type a message…"
            className="flex-1"
          />
          <Button type="submit" disabled={sending || !draft.trim()}>
            {sending ? 'Sending…' : 'Send'}
          </Button>
        </div>
        {onDealClosed && (
          <button
            type="button"
            onClick={onDealClosed}
            className="mt-3 text-xs text-muted hover:text-navy"
          >
            Mark deal as closed
          </button>
        )}
      </form>
    </div>
  )
}
