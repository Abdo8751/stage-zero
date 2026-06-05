/*
 * Path endpoint math
 * ──────────────────
 * Investor center: (95,150)  solid-ring radius: 35  → right edge: (130,150)
 * Founder  center: (385,150) solid-ring radius: 35  → left  edge: (350,150)
 *
 * Both nodes animate on an 8 s cycle.
 * Founder's animateTransform begins at -4 s (half-phase offset).
 *
 * At each PATH keyframe the active deltas are:
 *  kf0 (0 %)  inv=(0,0)    fnd=kf2=(-8,-13)   → start(130,150) end(342,137)
 *  kf1 (25%)  inv=(-13,-12) fnd=kf3=(11,5)    → start(117,138) end(361,155)
 *  kf2 (50%)  inv=(9,15)   fnd=kf0=(0,0)       → start(139,165) end(350,150)
 *  kf3 (75%)  inv=(-6,-4)  fnd=kf1=(14,8)      → start(124,146) end(364,158)
 *  kf4 =kf0
 *
 * Control points shift proportionally with each endpoint so the curve
 * always grows tighter when nodes pull apart and sags when they converge.
 */

const PATH_D =
  'M 130 150 C 195 90 277 197 342 137;' +
  'M 117 138 C 181 77 296 216 361 155;' +
  'M 139 165 C 205 107 285 209 350 150;' +
  'M 124 146 C 189 85 299 219 364 158;' +
  'M 130 150 C 195 90 277 197 342 137'

// 8 s — same period as both nodes so endpoints stay welded to ring edges
const PT = {
  keyTimes:    '0; 0.25; 0.5; 0.75; 1',
  dur:         '8s',
  repeatCount: 'indefinite' as const,
  calcMode:    'spline'    as const,
  keySplines:  '0.42 0 0.58 1; 0.42 0 0.58 1; 0.42 0 0.58 1; 0.42 0 0.58 1',
}

const NT = { ...PT } // node timing — identical

// Dot travel period drives the brightness alternation
const DOT_DUR = '2.6s'
const DOT_SPLINE = '0.42 0 0.58 1; 0.42 0 0.58 1'

export function HeroAnimation() {
  return (
    <div className="relative w-full select-none" aria-hidden="true">
      <svg viewBox="0 0 480 300" className="w-full" xmlns="http://www.w3.org/2000/svg">
        <defs>
          {/* ── Filters ── */}
          <filter id="hz-dot-glow" x="-200%" y="-200%" width="500%" height="500%">
            <feGaussianBlur stdDeviation="5" result="b" />
            <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <filter id="hz-node-glow" x="-80%" y="-80%" width="260%" height="260%">
            <feGaussianBlur stdDeviation="14" result="b" />
            <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <filter id="hz-halo" x="-15%" y="-400%" width="130%" height="900%">
            <feGaussianBlur stdDeviation="7" result="b" />
            <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>

          {/* ── Colour gradients ── */}
          <radialGradient id="hz-inv" cx="45%" cy="35%" r="65%">
            <stop offset="0%"   stopColor="rgba(150,185,255,0.95)" />
            <stop offset="100%" stopColor="rgba(60,105,225,0.75)" />
          </radialGradient>
          <radialGradient id="hz-fnd" cx="45%" cy="35%" r="65%">
            <stop offset="0%"   stopColor="rgba(255,215,105,0.95)" />
            <stop offset="100%" stopColor="rgba(205,135,25,0.75)" />
          </radialGradient>
        </defs>

        {/* ══════════════════════════════════════
            INVISIBLE PATH — mpath reference
        ══════════════════════════════════════ */}
        <path id="hz-path" fill="none" stroke="none">
          <animate attributeName="d" values={PATH_D} {...PT} />
        </path>

        {/* ══════════════════════════════════════
            CONNECTION LINES
            Three layers:
              1. Halo — thick blur that also pulses
              2. Base — constant dim line so there's always *something*
              3. Cream flash — brightens when cream dot travels L→R
              4. Amber flash — brightens when amber dot travels R→L
        ══════════════════════════════════════ */}

        {/* 1. Halo */}
        <path fill="none" stroke="rgba(240,228,200,0.18)" strokeWidth="12"
              strokeLinecap="round" filter="url(#hz-halo)">
          <animate attributeName="d" values={PATH_D} {...PT} />
          <animate attributeName="opacity" values="0.5;1;0.5" dur={DOT_DUR}
            repeatCount="indefinite" calcMode="spline" keySplines={DOT_SPLINE} />
        </path>

        {/* 2. Base dim line */}
        <path fill="none" stroke="rgba(240,228,200,0.20)" strokeWidth="1.5"
              strokeLinecap="round" opacity="0.5">
          <animate attributeName="d" values={PATH_D} {...PT} />
        </path>

        {/* 3. Cream flash — synced with cream dot (L→R, no offset) */}
        <path fill="none" stroke="rgba(240,228,200,0.85)" strokeWidth="1.8"
              strokeLinecap="round">
          <animate attributeName="d" values={PATH_D} {...PT} />
          <animate attributeName="opacity"
            values="0.08;0.88;0.08"
            dur={DOT_DUR}
            repeatCount="indefinite"
            calcMode="spline"
            keySplines={DOT_SPLINE} />
        </path>

        {/* 4. Amber flash — synced with amber dot (R→L, half-period offset) */}
        <path fill="none" stroke="rgba(240,185,60,0.80)" strokeWidth="1.8"
              strokeLinecap="round">
          <animate attributeName="d" values={PATH_D} {...PT} />
          <animate attributeName="opacity"
            values="0.08;0.88;0.08"
            dur={DOT_DUR}
            begin="-1.3s"
            repeatCount="indefinite"
            calcMode="spline"
            keySplines={DOT_SPLINE} />
        </path>

        {/* ══════════════════════════════════════
            INVESTOR NODE  — blue, 8 s float
        ══════════════════════════════════════ */}
        <g>
          <animateTransform attributeName="transform" type="translate"
            values="0,0; -13,-12; 9,15; -6,-4; 0,0" {...NT} />

          <circle cx="95" cy="150" r="62" fill="none" stroke="rgba(75,124,246,0.06)" strokeWidth="1">
            <animate attributeName="r"       values="62;74;62"   dur="3.4s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="1;0.12;1"   dur="3.4s" repeatCount="indefinite" />
          </circle>
          <circle cx="95" cy="150" r="47" fill="none" stroke="rgba(75,124,246,0.14)" strokeWidth="1">
            <animate attributeName="r"       values="47;54;47"    dur="3.4s" begin="0.7s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.9;0.22;0.9" dur="3.4s" begin="0.7s" repeatCount="indefinite" />
          </circle>
          <circle cx="95" cy="150" r="35"
            fill="rgba(75,124,246,0.08)" stroke="rgba(75,124,246,0.32)" strokeWidth="1.5" />
          <circle cx="95" cy="150" r="35"
            fill="rgba(75,124,246,0.16)" filter="url(#hz-node-glow)" />
          <circle cx="95" cy="150" r="22"
            fill="url(#hz-inv)" stroke="rgba(150,185,255,0.52)" strokeWidth="1.5" />
          <circle cx="95" cy="150" r="7.5"
            fill="rgba(255,255,255,0.95)" filter="url(#hz-dot-glow)" />
        </g>

        {/* ══════════════════════════════════════
            FOUNDER NODE  — amber, half-phase offset
        ══════════════════════════════════════ */}
        <g>
          <animateTransform attributeName="transform" type="translate"
            values="0,0; 14,8; -8,-13; 11,5; 0,0" {...NT} begin="-4s" />

          <circle cx="385" cy="150" r="62" fill="none" stroke="rgba(232,165,60,0.06)" strokeWidth="1">
            <animate attributeName="r"       values="62;74;62"   dur="4.2s" begin="1.4s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="1;0.12;1"   dur="4.2s" begin="1.4s" repeatCount="indefinite" />
          </circle>
          <circle cx="385" cy="150" r="47" fill="none" stroke="rgba(232,165,60,0.14)" strokeWidth="1">
            <animate attributeName="r"       values="47;54;47"    dur="4.2s" begin="2.1s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.9;0.22;0.9" dur="4.2s" begin="2.1s" repeatCount="indefinite" />
          </circle>
          <circle cx="385" cy="150" r="35"
            fill="rgba(232,165,60,0.08)" stroke="rgba(232,165,60,0.32)" strokeWidth="1.5" />
          <circle cx="385" cy="150" r="35"
            fill="rgba(232,165,60,0.16)" filter="url(#hz-node-glow)" />
          <circle cx="385" cy="150" r="22"
            fill="url(#hz-fnd)" stroke="rgba(255,215,105,0.52)" strokeWidth="1.5" />
          <circle cx="385" cy="150" r="7.5"
            fill="rgba(255,255,255,0.95)" filter="url(#hz-dot-glow)" />
        </g>

        {/* ══════════════════════════════════════
            TRAVELING DOTS
        ══════════════════════════════════════ */}

        {/* Primary cream — L→R */}
        <circle r="5.5" fill="rgba(240,230,208,0.97)" filter="url(#hz-dot-glow)">
          <animateMotion dur={DOT_DUR} repeatCount="indefinite" keyTimes="0;1" keyPoints="0;1" calcMode="linear">
            <mpath href="#hz-path" />
          </animateMotion>
          <animate attributeName="r" values="5.5;7;5.5" dur={DOT_DUR} repeatCount="indefinite" />
        </circle>

        {/* Primary amber — R→L */}
        <circle r="5" fill="rgba(240,185,60,0.95)" filter="url(#hz-dot-glow)">
          <animateMotion dur={DOT_DUR} begin="-1.3s" repeatCount="indefinite" keyTimes="0;1" keyPoints="1;0" calcMode="linear">
            <mpath href="#hz-path" />
          </animateMotion>
          <animate attributeName="r" values="5;6.5;5" dur={DOT_DUR} begin="-1.3s" repeatCount="indefinite" />
        </circle>

        {/* Small trailing cream */}
        <circle r="2.8" fill="rgba(240,230,208,0.55)" filter="url(#hz-dot-glow)">
          <animateMotion dur="3.8s" begin="-0.9s" repeatCount="indefinite" keyTimes="0;1" keyPoints="0;1" calcMode="linear">
            <mpath href="#hz-path" />
          </animateMotion>
        </circle>

        {/* Small trailing amber */}
        <circle r="2.8" fill="rgba(240,185,60,0.55)" filter="url(#hz-dot-glow)">
          <animateMotion dur="3.8s" begin="-2.8s" repeatCount="indefinite" keyTimes="0;1" keyPoints="1;0" calcMode="linear">
            <mpath href="#hz-path" />
          </animateMotion>
        </circle>
      </svg>
    </div>
  )
}
