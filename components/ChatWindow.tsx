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
      <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm sm:max-w-[70%] ${isOwn ? 'bg-navy text-paper shadow-[0_6px_18px_rgba(4,11,26,.18)]' : 'border border-ink/10 bg-paper/80 text-ink'}`}>
        {!isOwn && message.users?.full_name && <p className="mb-1 text-xs font-semibold text-ink/60">{message.users.full_name}</p>}
        <p className="font-normal leading-6">{message.content}</p>
        <p className={`mt-1.5 font-mono text-[10px] ${isOwn ? 'text-paper/55' : 'text-ink/40'}`}>{new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
      </div>
    </div>
  )
}

export function ChatWindow({ matchId, currentUserId, onDealClosed }: ChatWindowProps) {
  const { messages, loading, error, sendMessage } = useMessages(matchId)
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)
  const [sendError, setSendError] = useState<string | null>(null)

  const handleSend = async (event: React.FormEvent) => {
    event.preventDefault()
    setSending(true)
    setSendError(null)
    const sendError = await sendMessage(draft)
    if (sendError) setSendError(sendError)
    else setDraft('')
    setSending(false)
  }

  return (
    <div className="glass-light flex h-[calc(100vh-13rem)] flex-col overflow-hidden rounded-[28px] sm:h-[600px]">
      <div className="flex-1 space-y-3 overflow-y-auto p-5 sm:p-6">
        {loading && <p className="text-sm text-ink/50">Loading messages…</p>}
        {error && <p className="rounded-xl border border-red-700/20 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
        {!loading && messages.length === 0 && <p className="py-12 text-center text-sm text-ink/50">No messages yet. Say hello!</p>}
        {messages.map((message) => <MessageBubble key={message.id} message={message} isOwn={message.sender_id === currentUserId} />)}
      </div>
      <form onSubmit={handleSend} className="border-t border-ink/10 bg-paper/55 p-4 sm:p-5">
        {sendError && <p className="mb-2 text-sm text-red-700">{sendError}</p>}
        <div className="flex flex-col gap-2 sm:flex-row"><Input value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Type a message…" className="flex-1" /><Button type="submit" disabled={sending || !draft.trim()}>{sending ? 'Sending…' : 'Send'}</Button></div>
        {onDealClosed && <button type="button" onClick={onDealClosed} className="mt-3 text-xs font-medium text-ink/50 transition hover:text-ink">Mark deal as closed</button>}
      </form>
    </div>
  )
}
