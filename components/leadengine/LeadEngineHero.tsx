'use client'

import Link from 'next/link'

/**
 * Lead Engine hero.
 *
 * Matches the main outlio.io hero deliberately: paper background with the dotted
 * grid, heavy black uppercase headline with one accent word, muted subtitle,
 * black pill + outlined pill CTAs, and floating product cards at the edges.
 *
 * NOTE ON THE VOLUMETRIC VERSION: an earlier build used a dark 3D spotlight
 * room. It was replaced because volumetric beams are only visible against
 * darkness — the effect physically cannot work on a paper-white background, so
 * it could never sit alongside the main hero's palette. Removing it also drops
 * ~30 MB of three.js dependencies and a 908 KB chunk.
 */

const EASE = 'cubic-bezier(0.22, 1, 0.36, 1)'

export function LeadEngineHero() {
  return (
    /*
     * Sized so the three cards are ABOVE THE FOLD on a laptop.
     *
     * The first build used a 5.2rem headline with 24px section padding and the
     * cards landed ~200px below the viewport — the before/after contrast is the
     * whole pitch, so burying it defeated the section. Padding, headline clamp
     * and inter-block gaps are all tightened to fit within ~800px.
     */
    <section className="relative overflow-hidden bg-paper px-4 pb-12 pt-10 sm:pb-16 sm:pt-12">
      {/* Dotted grid, matching the main hero's texture. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: 'radial-gradient(circle, rgba(22,21,15,0.09) 1px, transparent 1px)',
          backgroundSize: '22px 22px',
        }}
      />
      {/* Soft accent bloom, same treatment as the landing page aurora. */}
      <div
        aria-hidden
        className="hero-aurora pointer-events-none absolute inset-0"
      />

      <div className="relative mx-auto max-w-5xl">
        <div className="text-center">
          <p
            className="text-[13px] font-semibold uppercase tracking-[0.22em] text-accent"
            style={{ animation: `fade-in 0.6s ${EASE} both` }}
          >
            Outlio · Lead Engine
          </p>

          <h1
            className="mx-auto mt-4 max-w-4xl text-[clamp(2rem,5vw,3.9rem)] font-bold uppercase leading-[0.98] tracking-tight text-ink"
            style={{ animation: `fade-in 0.7s ${EASE} 0.05s both` }}
          >
            Stop retyping your
            <br />
            <span className="text-accent">Sales Navigator</span> lists.
          </h1>

          <p
            className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-muted sm:text-lg"
            style={{ animation: `fade-in 0.7s ${EASE} 0.12s both` }}
          >
            You spent an hour building the perfect search. Then you spent three
            copying names into a spreadsheet. Save the results page instead —
            Outlio turns it into a clean, de-duplicated CSV in seconds.
          </p>

          <div
            className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row"
            style={{ animation: `fade-in 0.7s ${EASE} 0.18s both` }}
          >
            <Link
              href="/sign-up"
              className="rounded-full bg-ink px-7 py-3.5 text-base font-semibold text-cream transition-colors duration-150 hover:bg-accent"
            >
              Start your 3-day free trial
            </Link>
            <Link
              href="#how-it-works"
              className="rounded-full border border-ink px-7 py-3.5 text-base font-semibold text-ink transition-colors duration-150 hover:bg-cream"
            >
              See how it works
            </Link>
          </div>

          <p
            className="mt-4 text-sm text-muted"
            style={{ animation: `fade-in 0.7s ${EASE} 0.24s both` }}
          >
            No card required · Plans from $38/month
          </p>
        </div>

        {/* Floating product cards, echoing the main hero's pinboard treatment. */}
        <div className="pointer-events-none mt-10 grid gap-4 sm:grid-cols-3">
          <FloatCard delay="0.28s" tilt="-1.2deg">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-muted">
              Before
            </p>
            <p className="mt-2 text-sm leading-relaxed text-ink">
              25 leads open in 25 tabs. Copy name. Paste. Copy title. Paste.
              Realise you already had this person.
            </p>
          </FloatCard>

          <FloatCard delay="0.34s" tilt="0.6deg" accent>
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-accent">
              After
            </p>
            <p className="mt-2 text-sm leading-relaxed text-ink">
              <span className="font-semibold">Cmd+S</span> on the results page.
              Drop the file in. Download the CSV.
            </p>
            <p className="mt-3 text-2xl font-black tracking-tight text-ink">
              ~8 seconds
            </p>
          </FloatCard>

          <FloatCard delay="0.4s" tilt="1.1deg">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-muted">
              Every row
            </p>
            <ul className="mt-2 space-y-1 text-sm text-ink">
              <li>Name · Profile link</li>
              <li>Title · Company</li>
              <li>Location · Tenure</li>
            </ul>
          </FloatCard>
        </div>
      </div>
    </section>
  )
}

function FloatCard({
  children,
  delay,
  tilt,
  accent = false,
}: {
  children: React.ReactNode
  delay: string
  tilt: string
  accent?: boolean
}) {
  return (
    <div
      className={
        accent
          ? 'rounded-[var(--radius-lg)] border-2 border-accent bg-panel p-5 shadow-[var(--shadow-md)]'
          : 'rounded-[var(--radius-lg)] border border-border bg-panel p-5 shadow-[var(--shadow-sm)]'
      }
      style={{
        transform: `rotate(${tilt})`,
        animation: `fade-in 0.7s ${EASE} ${delay} both`,
      }}
    >
      {children}
    </div>
  )
}
