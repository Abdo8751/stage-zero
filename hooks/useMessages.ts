'use client'

import { useCallback, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import type { MessageWithSender } from '@/lib/types'

interface UseMessagesReturn {
  messages: MessageWithSender[]
  loading: boolean
  error: string | null
  sendMessage: (content: string) => Promise<string | null>
  refresh: () => Promise<void>
}

export function useMessages(matchId: string): UseMessagesReturn {
  const [messages, setMessages] = useState<MessageWithSender[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    if (!matchId) return
    setLoading(true)
    setError(null)

    try {
      const supabase = createClient()
      const { data, error: fetchError } = await supabase
        .from('messages')
        .select('*, users(full_name, avatar_url)')
        .eq('match_id', matchId)
        .order('created_at', { ascending: true })

      if (fetchError) throw fetchError
      setMessages((data ?? []) as MessageWithSender[])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load messages')
    } finally {
      setLoading(false)
    }
  }, [matchId])

  useEffect(() => {
    void refresh()

    const supabase = createClient()
    const channel = supabase
      .channel(`messages:${matchId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `match_id=eq.${matchId}` },
        () => {
          void refresh()
        }
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [matchId, refresh])

  const sendMessage = async (content: string): Promise<string | null> => {
    const trimmed = content.trim()
    if (!trimmed) return 'Message cannot be empty'

    try {
      const supabase = createClient()
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser()

      if (authError) throw authError
      if (!user) return 'Not authenticated'

      const { error: insertError } = await supabase.from('messages').insert({
        match_id: matchId,
        sender_id: user.id,
        content: trimmed,
        is_read: false,
      })

      if (insertError) throw insertError
      return null
    } catch (err) {
      return err instanceof Error ? err.message : 'Failed to send message'
    }
  }

  return { messages, loading, error, sendMessage, refresh }
}
