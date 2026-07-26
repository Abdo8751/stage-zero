import Link from 'next/link'
import { Bookmark, BookmarkCheck, ChevronRight, TrendingUp } from 'lucide-react'
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
  return STARTUP_STAGES.find((item) => item.value === stage)?.label ?? stage
}

function formatRaise(amount: number | null): string {
  if (!amount) return 'Undisclosed'
  if (amount >= 1_000_000) return `EGP ${(amount / 1_000_000).toFixed(1)}M`.replace('.0M', 'M')
  return `EGP ${(amount / 1_000).toFixed(0)}K`
}

export function StartupCard({
  startup,
  href,
  onSave,
  isSaved = false,
  showSave = false,
}: StartupCardProps) {
  return (
    <article className="flex h-full flex-col overflow-hidden rounded-[20px] border border-ink/10 bg-paper transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_8px_32px_rgba(8,10,20,.10)]">
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start gap-3">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-blue-accent/20 bg-blue-accent/10 font-serif text-xl font-bold text-blue-accent">
            {startup.name.slice(0, 1).toUpperCase()}
          </span>

          <div className="min-w-0 flex-1">
            <h3 className="truncate font-serif text-[19px] font-semibold leading-snug tracking-[-.025em] text-ink">
              {startup.name}
            </h3>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {startup.sector.slice(0, 2).map((sector) => (
                <span
                  key={sector}
                  className="rounded-full border border-ink/12 px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-[.1em] text-ink/50"
                >
                  {sector}
                </span>
              ))}
              <span className="rounded-full border border-blue-accent/30 px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-[.1em] text-blue-accent">
                {stageLabel(startup.stage)}
              </span>
            </div>
          </div>

          {showSave && onSave && (
            <button
              type="button"
              onClick={onSave}
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border transition-all ${
                isSaved
                  ? 'border-blue-accent bg-blue-accent text-white'
                  : 'border-ink/15 bg-warm-cream text-ink/45 hover:border-blue-accent/40 hover:text-blue-accent'
              }`}
              aria-label={isSaved ? `Remove ${startup.name} from saved startups` : `Save ${startup.name}`}
              aria-pressed={isSaved}
            >
              {isSaved ? <BookmarkCheck className="h-4 w-4" /> : <Bookmark className="h-4 w-4" />}
            </button>
          )}
        </div>

        {startup.tagline && (
          <p className="mt-4 flex-1 line-clamp-3 text-[13px] leading-[1.65] text-ink/65">
            {startup.tagline}
          </p>
        )}

        <div className="mt-5 flex items-center gap-2 border-t border-ink/10 pt-4">
          <TrendingUp className="h-3.5 w-3.5 text-amber" />
          <span className="font-mono text-[10px] font-bold uppercase tracking-[.08em] text-ink/40">
            Raising
          </span>
          <span className="ml-auto text-[12px] font-semibold text-amber">
            {formatRaise(startup.raise_amount)}
          </span>
        </div>
      </div>

      {href && (
        <div className="border-t border-ink/10 bg-warm-cream/50 p-4">
          <Link
            href={href}
            className="flex w-full items-center justify-between rounded-full bg-blue-accent px-4 py-2.5 text-[12px] font-semibold text-white transition-all hover:bg-blue-bright hover:shadow-[0_4px_14px_rgba(75,124,246,.3)]"
          >
            View full profile
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      )}
    </article>
  )
}
