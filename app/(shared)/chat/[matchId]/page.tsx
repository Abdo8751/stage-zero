'use client'

import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { ChatWindow } from '@/components/ChatWindow'
import { useUser } from '@/hooks/useUser'
import { useToast } from '@/components/ui/Toast'

export default function ChatDetailPage() {
  const params = useParams()
  const router = useRouter()
  const matchId = params.matchId as string
  const { user } = useUser()
  const { showToast } = useToast()

  const handleDealClosed = async () => {
    if (!confirm('Mark this deal as closed?')) return

    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('matches')
        .update({ is_deal_closed: true, updated_at: new Date().toISOString() })
        .eq('id', matchId)

      if (error) throw error
      showToast('Deal marked as closed', 'success')
      router.push('/chat')
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to update', 'error')
    }
  }

  const handleReport = () => {
    showToast('Report submitted. Our team will review.', 'info')
  }

  if (!user) {
    return <div className="py-16 text-center text-muted">Loading…</div>
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:py-12">
      <Link href="/chat" className="text-sm text-muted hover:text-navy">
        ← Back to chats
      </Link>
      <h1 className="mt-4 text-2xl sm:text-3xl">Conversation</h1>

      <div className="mt-6">
        <ChatWindow
          matchId={matchId}
          currentUserId={user.id}
          onDealClosed={handleDealClosed}
        />
      </div>

      <button
        type="button"
        onClick={handleReport}
        className="mt-4 text-xs text-muted hover:text-red-600"
      >
        Report user
      </button>
    </div>
  )
}
