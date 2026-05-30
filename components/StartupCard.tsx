import Link from 'next/link'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import type { Startup, StartupStage } from '@/lib/types'
import { STARTUP_STAGES } from '@/lib/types'

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
  return `EGP ${(amount / 1_000_000).toFixed(1)}M`.replace('.0M', 'M')
}

export function StartupCard({ startup, href, onSave, isSaved, showSave }: StartupCardProps) {
  const content = (
    <Card className="flex h-full flex-col transition-colors hover:border-gold/50">
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-lg font-heading sm:text-xl">{startup.name}</h3>
        <Badge variant="gold">{stageLabel(startup.stage)}</Badge>
      </div>
      {startup.tagline && (
        <p className="mt-2 line-clamp-2 text-sm text-muted">{startup.tagline}</p>
      )}
      <div className="mt-3 flex flex-wrap gap-2">
        {startup.sector.slice(0, 3).map((s) => (
          <Badge key={s} variant="muted">
            {s}
          </Badge>
        ))}
      </div>
      <p className="mt-auto pt-4 text-sm font-medium text-navy">
        Raising {formatRaise(startup.raise_amount)}
      </p>
      {showSave && onSave && (
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault()
            onSave()
          }}
          className="mt-3 text-left text-sm text-gold hover:underline"
        >
          {isSaved ? '★ Saved' : '☆ Save to list'}
        </button>
      )}
    </Card>
  )

  if (href) {
    return (
      <Link href={href} className="block h-full">
        {content}
      </Link>
    )
  }

  return content
}
