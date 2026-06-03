import Link from 'next/link'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import type { Startup, StartupStage } from '@/lib/types'
import { STARTUP_STAGES } from '@/lib/types'
import { Bookmark, TrendingUp } from 'lucide-react'

interface StartupCardProps {
  startup: Startup
  href?: string
  onSave?: () => void
  isSaved?: boolean
  showSave?: boolean
}

function stageLabel(stage: StartupStage): string {
  return STARTUP_STAGES.find((s) => s.value === stage)?.label ?? stage
}

function formatRaise(amount: number | null): string {
  if (!amount) return 'Undisclosed'
  if (amount >= 1_000_000) return `EGP ${(amount / 1_000_000).toFixed(1)}M`.replace('.0M', 'M')
  return `EGP ${(amount / 1_000).toFixed(0)}K`
}

export function StartupCard({ startup, href, onSave, isSaved, showSave }: StartupCardProps) {
  const content = (
    <Card hoverable className="flex h-full flex-col">
      {/* Header row */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-[rgba(75,124,246,0.12)] border border-[rgba(75,124,246,0.20)] text-blue-bright font-black text-[15px]">
          {startup.name[0]}
        </div>
        <Badge variant="gold">{stageLabel(startup.stage)}</Badge>
      </div>

      {/* Text */}
      <div className="mt-4 flex-1">
        <h3 className="text-[16px] font-bold tracking-tight text-cream leading-snug">{startup.name}</h3>
        {startup.tagline && (
          <p className="mt-1.5 line-clamp-2 text-[13px] leading-relaxed text-cream-muted">{startup.tagline}</p>
        )}
      </div>

      {/* Sectors */}
      <div className="mt-4 flex flex-wrap gap-1.5">
        {startup.sector.slice(0, 3).map((s) => (
          <Badge key={s} variant="muted">{s}</Badge>
        ))}
      </div>

      {/* Footer */}
      <div className="mt-4 flex items-center justify-between border-t border-[rgba(240,230,208,0.06)] pt-4">
        <div className="flex items-center gap-1.5">
          <TrendingUp className="h-3.5 w-3.5 text-amber" />
          <span className="text-[13px] font-bold text-amber">{formatRaise(startup.raise_amount)}</span>
        </div>
        {showSave && onSave && (
          <button
            type="button"
            onClick={(e) => { e.preventDefault(); onSave() }}
            className="flex items-center gap-1 text-[12px] text-cream-subtle hover:text-cream transition-colors cursor-pointer"
          >
            <Bookmark className={`h-3.5 w-3.5 ${isSaved ? 'fill-cream text-cream' : ''}`} />
            <span>{isSaved ? 'Saved' : 'Save'}</span>
          </button>
        )}
      </div>
    </Card>
  )

  if (href) return <Link href={href} className="block h-full">{content}</Link>
  return content
}
