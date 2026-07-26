import { BrandMark } from '@/components/BrandMark'

export function AuthShell({
  children,
  kicker,
  wide = false,
}: {
  children: React.ReactNode
  kicker: string
  wide?: boolean
}) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-parchment px-5 py-8 text-ink sm:px-8">
      <div className="paper-grain pointer-events-none absolute inset-0 opacity-25" />
      <div className="pointer-events-none absolute -left-32 top-20 h-[410px] w-[410px] rounded-full border border-ink/10" />
      <div className="pointer-events-none absolute -bottom-48 -right-24 h-[560px] w-[560px] rounded-full border border-blue-accent/20" />
      <div className={`relative w-full ${wide ? 'max-w-[760px]' : 'max-w-[480px]'}`}>
        <div className="mb-7 flex items-center justify-between gap-4">
          <BrandMark />
          <p className="font-mono text-[10px] font-bold uppercase tracking-[.12em] text-ink/40">{kicker}</p>
        </div>
        <div className="glass-light rounded-[28px] p-6 sm:p-9">{children}</div>
        <p className="mt-6 text-center text-xs text-ink/45">Private by default. Built for serious conversations.</p>
      </div>
    </div>
  )
}
