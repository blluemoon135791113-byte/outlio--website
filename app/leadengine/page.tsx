import type { Metadata } from 'next'
import Link from 'next/link'

import Footer from '@/app/components/Footer'
import Nav from '@/app/components/Nav'
import { LeadEngineHero } from '@/components/leadengine/LeadEngineHero'
import { Pricing } from '@/components/leadengine/Pricing'

export const metadata: Metadata = {
  title: 'Outlio Lead Engine | Sales Navigator Lists Into Clean CSVs',
  description:
    'Stop copying LinkedIn Sales Navigator leads by hand. Save the search-results page, upload it, and get a de-duplicated CSV with names, titles, companies, locations and profile links. Plans from $38/month. 3-day free trial, no card required.',
  alternates: { canonical: 'https://outlio.io/leadengine' },
  openGraph: {
    type: 'website',
    url: 'https://outlio.io/leadengine',
    siteName: 'Outlio',
    title: 'Outlio Lead Engine | Sales Navigator Lists Into Clean CSVs',
    description:
      'Save a Sales Navigator search-results page, upload it, get a de-duplicated CSV. Plans from $38/month. 3-day free trial, no card required.',
  },
}

const PAINS = [
  {
    title: 'The copy-paste tax',
    body: 'Twenty-five results per page. Ten fields worth keeping. That is 250 copy-pastes for one page of search results — and Sales Navigator has no export button.',
  },
  {
    title: 'The same people, twice',
    body: 'You run a similar search next month and half the names are ones you already contacted. You find out after you have emailed them.',
  },
  {
    title: 'Tools that want your password',
    body: 'Most Sales Navigator scrapers ask you to log in through them or install an extension that drives your account. That risks your seat and your data.',
  },
]

const STEPS = [
  {
    n: '01',
    title: 'Save the results page',
    body: 'On any Sales Navigator lead search, press Cmd+S (Ctrl+S on Windows) and choose "Webpage, Complete". That is a file on your own computer.',
  },
  {
    n: '02',
    title: 'Drop it into Outlio',
    body: 'One page or a hundred. We check every file really is a saved Sales Navigator results page before touching it, and reject anything that is not.',
  },
  {
    n: '03',
    title: 'Download the CSV',
    body: 'Every lead, every field, duplicates already removed — including people from your previous uploads. Then clear the data with one click.',
  },
]

const FIELDS = [
  ['Full name', 'Exactly as shown on the profile'],
  ['LinkedIn profile', 'A direct link to the person'],
  ['Job title', 'Their actual role, not their tenure'],
  ['Company', 'Plus a company link where one exists'],
  ['Location', 'City, region, country'],
  ['Summary', 'The short bio line under their name'],
  ['Time in role', 'How long in this position'],
  ['Time at company', 'How long at this employer'],
]

const HONEST = [
  {
    title: 'It never logs in as you',
    body: 'No password, no cookie, no session token. Outlio has no way to sign in to LinkedIn and never asks you for credentials.',
  },
  {
    title: 'It never browses LinkedIn',
    body: 'There is no bot and no extension. The only thing Lead Engine ever reads is a file you chose to upload from your own machine.',
  },
  {
    title: 'You decide what is kept',
    body: 'Download the CSV, then clear the data. We keep only an anonymous fingerprint so duplicates are still caught next time — no names, no companies, no links.',
  },
]

export default function LeadEnginePage() {
  return (
    <>
      <Nav homePrefix="/" />

      <LeadEngineHero />

      {/* ---- The problem --------------------------------------------------- */}
      <section className="bg-cream px-4 py-20 sm:py-28">
        <div className="mx-auto max-w-5xl">
          <div className="max-w-2xl">
            <p className="text-[13px] font-semibold uppercase tracking-[0.22em] text-accent">
              The problem
            </p>
            <h2 className="mt-4 text-4xl font-bold uppercase leading-tight tracking-tight sm:text-5xl">
              Sales Navigator won&apos;t let you export
            </h2>
            <p className="mt-5 text-base leading-relaxed text-muted sm:text-lg">
              You pay for it every month. It finds exactly the right people. And
              then it hands you a list you can only read — never download.
            </p>
          </div>

          <div className="mt-14 grid gap-8 md:grid-cols-3">
            {PAINS.map((p) => (
              <div key={p.title}>
                <h3 className="text-xl font-bold tracking-tight">{p.title}</h3>
                <p className="mt-2.5 text-base leading-relaxed text-muted">{p.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---- The solution -------------------------------------------------- */}
      <section className="bg-paper px-4 py-20 sm:py-28">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-[13px] font-semibold uppercase tracking-[0.22em] text-accent">
            The fix
          </p>
          <h2 className="mt-4 text-4xl font-bold uppercase leading-tight tracking-tight sm:text-5xl">
            The page is already on your computer
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-muted sm:text-lg">
            When Sales Navigator shows you results, your browser has already
            downloaded every name, title and company. Saving the page keeps them.
            Lead Engine just reads that file and lays it out as a spreadsheet —
            no account access, no automation, nothing that touches LinkedIn.
          </p>
        </div>
      </section>

      {/* ---- How it works --------------------------------------------------- */}
      <section id="how-it-works" className="scroll-mt-20 bg-cream px-4 py-20 sm:py-28">
        <div className="mx-auto max-w-5xl">
          <h2 className="max-w-2xl text-4xl font-bold uppercase leading-tight tracking-tight sm:text-5xl">
            Three steps. No setup.
          </h2>

          <div className="mt-14 grid gap-8 md:grid-cols-3">
            {STEPS.map((s) => (
              <div key={s.n}>
                <span className="text-[13px] font-bold uppercase tracking-[0.22em] text-accent">
                  {s.n}
                </span>
                <h3 className="mt-3 text-2xl font-bold tracking-tight">{s.title}</h3>
                <p className="mt-2.5 text-base leading-relaxed text-muted">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---- What you get --------------------------------------------------- */}
      <section className="bg-paper px-4 py-20 sm:py-28">
        <div className="mx-auto max-w-5xl">
          <div className="max-w-2xl">
            <p className="text-[13px] font-semibold uppercase tracking-[0.22em] text-accent">
              Every column
            </p>
            <h2 className="mt-4 text-4xl font-bold uppercase leading-tight tracking-tight sm:text-5xl">
              What lands in your CSV
            </h2>
            <p className="mt-5 text-base leading-relaxed text-muted sm:text-lg">
              If a field is not on the page, the cell is empty. We never guess,
              never enrich from elsewhere, and never invent a value to fill a gap.
            </p>
          </div>

          <dl className="mt-12 grid gap-x-10 gap-y-6 sm:grid-cols-2">
            {FIELDS.map(([name, note]) => (
              <div key={name} className="border-t border-border pt-4">
                <dt className="text-base font-semibold text-ink">{name}</dt>
                <dd className="mt-1 text-sm leading-relaxed text-muted">{note}</dd>
              </div>
            ))}
          </dl>

          <p className="mt-10 max-w-2xl rounded-[var(--radius-lg)] border border-border bg-panel p-5 text-sm leading-relaxed text-muted">
            <strong className="font-semibold text-ink">Sales Navigator only.</strong>{' '}
            Lead Engine reads saved <em>Sales Navigator lead search-results</em>{' '}
            pages. A regular linkedin.com search page, a company page, or a file
            from anywhere else will be rejected rather than silently mis-parsed.
          </p>
        </div>
      </section>

      {/* ---- Honesty -------------------------------------------------------- */}
      <section className="bg-cream px-4 py-20 sm:py-28">
        <div className="mx-auto max-w-5xl">
          <h2 className="max-w-2xl text-4xl font-bold uppercase leading-tight tracking-tight sm:text-5xl">
            What it is not
          </h2>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted sm:text-lg">
            Plenty of tools in this category quietly automate your LinkedIn
            account. This one does not, and that is a design decision — not a
            limitation we are working around.
          </p>

          <div className="mt-14 grid gap-8 md:grid-cols-3">
            {HONEST.map((h) => (
              <div
                key={h.title}
                className="rounded-[var(--radius-lg)] border border-border bg-panel p-6"
              >
                <h3 className="text-lg font-bold tracking-tight">{h.title}</h3>
                <p className="mt-2.5 text-base leading-relaxed text-muted">{h.body}</p>
              </div>
            ))}
          </div>

          <p className="mt-10 max-w-2xl text-sm leading-relaxed text-muted">
            You are responsible for having the right to process the information in
            the files you upload, and for complying with LinkedIn&apos;s user
            agreement and applicable privacy law.
          </p>
        </div>
      </section>

      <Pricing />

      {/* ---- Final CTA ------------------------------------------------------ */}
      <section className="bg-cream px-4 py-20 sm:py-28">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-4xl font-bold uppercase leading-tight tracking-tight sm:text-5xl">
            Your next list, in a spreadsheet
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-muted sm:text-lg">
            Three days free, 10 credits, no card. If it does not save you an
            afternoon, do not pay us.
          </p>
          <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              href="/sign-up"
              className="rounded-full bg-ink px-8 py-4 text-base font-semibold text-cream transition-colors duration-150 hover:bg-accent"
            >
              Start your 3-day free trial
            </Link>
            <Link
              href="/sign-in"
              className="rounded-full border border-ink px-8 py-4 text-base font-semibold transition-colors duration-150 hover:bg-paper"
            >
              Sign in
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </>
  )
}

function Tick() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 20 20"
      className="mt-1 h-4 w-4 shrink-0 text-accent"
      fill="currentColor"
    >
      <path
        fillRule="evenodd"
        d="M16.7 5.3a1 1 0 0 1 0 1.4l-7.5 7.5a1 1 0 0 1-1.4 0L3.3 9.7a1 1 0 1 1 1.4-1.4l3.8 3.8 6.8-6.8a1 1 0 0 1 1.4 0Z"
        clipRule="evenodd"
      />
    </svg>
  )
}
