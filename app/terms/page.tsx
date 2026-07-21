import type { Metadata } from "next";
import Nav from "../components/Nav";
import Footer from "../components/Footer";

export const metadata: Metadata = {
  title: "Terms and Conditions — Outlio",
  description: "The terms governing Outlio's website and Services.",
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-12">
      <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
      <div className="mt-4 space-y-4 leading-relaxed text-ink/80">{children}</div>
    </section>
  );
}

export default function TermsAndConditions() {
  return (
    <>
      <Nav homePrefix="/" />
      <main className="mx-auto w-full max-w-3xl px-6 py-20 sm:py-28">
        <p className="text-[13px] font-semibold uppercase tracking-[0.22em] text-accent">
          Outlio &middot; Legal
        </p>
        <h1 className="mt-4 text-4xl font-bold uppercase tracking-tight sm:text-5xl">
          Terms and Conditions
        </h1>
        <p className="mt-4 text-sm text-muted">Last updated: Tuesday, 21 July 2026</p>

        <div className="mt-10 space-y-4 leading-relaxed text-ink/80">
          <p>
            Welcome to Outlio (&ldquo;Outlio,&rdquo; &ldquo;we,&rdquo; &ldquo;us,&rdquo; or
            &ldquo;our&rdquo;). These Terms and Conditions (&ldquo;Terms&rdquo;) govern your use of
            our website and any Services you purchase from us, including appointment setting, lead
            generation, SaaS growth outreach, explainer video production, ad creative design, and
            sales training (collectively, the &ldquo;Services&rdquo;).
          </p>
          <p>
            By booking a call, signing a proposal, or paying for any Service, you
            (&ldquo;Client,&rdquo; &ldquo;you&rdquo;) agree to these Terms in full. If you don't
            agree, don't use our Services.
          </p>
        </div>

        <Section title="1. Who We Are">
          <p>
            Outlio is a growth and outbound services provider. We research your market, write and
            send outreach on your behalf, and report results through a shared CRM. We are not a
            marketing consultancy, a law firm, or a compliance advisor — see Section 8.
          </p>
        </Section>

        <Section title="2. The Services">
          <p>
            The exact scope, deliverables, and timelines for your engagement are defined in your
            individual proposal or Statement of Work (&ldquo;SOW&rdquo;). These Terms apply on top
            of, and do not replace, anything specifically agreed in your SOW. If the two conflict,
            the SOW controls.
          </p>
        </Section>

        <Section title="3. Payment Terms & The One-Week Trial">
          <ul className="list-disc space-y-2 pl-5">
            <li>
              New clients start with a one-week paid trial period before any monthly commitment
              begins.
            </li>
            <li>
              Fees for the trial week and any subsequent month are due upfront, before work begins
              for that period, unless otherwise stated in your SOW.
            </li>
            <li>Late payment may result in a pause of Services until payment is received.</li>
          </ul>
        </Section>

        <Section title="4. Refund Policy">
          <p>This is the core of our guarantee, so read it carefully.</p>
          <ul className="list-disc space-y-2 pl-5">
            <li>
              <strong>No refunds after the first week.</strong> Once your one-week trial period ends
              and you move into a paid month, that month's fee is non-refundable, regardless of
              results.
            </li>
            <li>
              <strong>During the trial week only:</strong> if we underperform, you're entitled to a
              refund of that week's fee, or the rest of that month free while we keep working — your
              choice.
            </li>
            <li>
              <strong>Burden of proof is on the client.</strong> To qualify for a trial-week refund,
              you must demonstrate — with specifics — that Outlio failed to deliver the agreed scope
              of work (e.g., failed to launch outreach, failed to hit the agreed activity volume, or
              failed to provide reporting). General dissatisfaction with results, lead quality, or
              lack of booked meetings — where the agreed activity and process were actually carried
              out — does not qualify for a refund. Outbound results depend on market response, which
              we don't control.
            </li>
            <li>
              Refund requests must be submitted in writing within 7 days of the trial week ending.
              Requests made after that window will not be considered.
            </li>
            <li>
              No refunds are issued for any month beyond the first, for setup fees, ad spend already
              deployed on your behalf, or for third-party costs (tools, platforms, ad accounts)
              incurred on your behalf.
            </li>
          </ul>
        </Section>

        <Section title="5. Account & Platform Risk">
          <p>
            Outreach campaigns run through accounts you own or provide access to (e.g., LinkedIn,
            email, ad platforms) — not accounts we own.
          </p>
          <ul className="list-disc space-y-2 pl-5">
            <li>
              <strong>You accept all risk of platform action.</strong> Cold outreach, connection
              requests, and messaging can trigger warnings, restrictions, temporary locks, or
              permanent bans on LinkedIn, email providers, ad platforms, or any other third-party
              platform. Outlio is not responsible or liable for any suspension, ban, restriction, or
              loss of access to any account, platform, or service resulting from campaign activity,
              whether run by us on your behalf or by you.
            </li>
            <li>
              We follow reasonable, industry-standard sending practices to reduce this risk, but we
              cannot guarantee any platform's enforcement decisions, which are outside our control
              and can change without notice.
            </li>
            <li>
              If you provide us access to your own accounts, you're responsible for that account
              being in good standing, correctly set up, and compliant with that platform's own terms
              of service before we begin.
            </li>
          </ul>
        </Section>

        <Section title="6. No Guarantee of Results">
          <p>
            Outreach results depend on your market, offer, pricing, credibility, and how prospects
            respond — all factors outside our control. Case studies and results shown on our website
            or in proposals are real past outcomes for other clients, not a promise of what will
            happen for you. Past performance does not guarantee future results.
          </p>
        </Section>

        <Section title="7. Client Responsibilities">
          <p>To do this properly, we need you to:</p>
          <ul className="list-disc space-y-2 pl-5">
            <li>Give us accurate information about your business, ICP, and offer.</li>
            <li>
              Provide timely access to accounts, assets, and approvals we need to execute.
            </li>
            <li>Review deliverables and respond to check-ins within a reasonable time.</li>
            <li>
              Ensure your product, service, or offer is legal to market and sell in your target
              territories.
            </li>
          </ul>
          <p>Delays on your end can delay results, and do not extend refund windows.</p>
        </Section>

        <Section title="8. Third-Party Platform & Legal Compliance">
          <p>
            You are responsible for ensuring your business and offer comply with applicable laws in
            your industry and target markets (e.g., data protection laws,
            unsolicited-communication laws like CAN-SPAM, GDPR, or platform-specific policies).
            Outlio uses reasonable, industry-standard outreach practices, but Outlio is not a law
            firm and does not provide legal or compliance advice. You should consult your own legal
            counsel regarding regulatory obligations tied to your industry or region.
          </p>
        </Section>

        <Section title="9. Intellectual Property">
          <ul className="list-disc space-y-2 pl-5">
            <li>
              Deliverables created specifically for you (final videos, ad creatives, written copy)
              become your property once paid in full.
            </li>
            <li>
              Outlio retains ownership of its own internal processes, research methods, templates,
              frameworks, and any tools or systems used to deliver the Services — these are not
              transferred to you.
            </li>
          </ul>
        </Section>

        <Section title="10. Confidentiality">
          <p>
            Both parties agree to keep confidential business information (pricing, strategy,
            prospect lists, non-public data) private and use it only for the purposes of the
            engagement.
          </p>
        </Section>

        <Section title="11. Limitation of Liability">
          <p>
            To the maximum extent permitted by law, Outlio's total liability for any claim arising
            from the Services is limited to the amount you paid in the month the claim arose. Outlio
            is not liable for indirect, incidental, special, or consequential damages, including
            lost profits, lost data, or reputational harm, including (without limitation) any harm
            arising from account suspensions or bans as described in Section 5.
          </p>
        </Section>

        <Section title="12. Indemnification">
          <p>
            You agree to indemnify and hold Outlio harmless from any claims, damages, or costs
            arising from your product, your offer, your failure to comply with applicable law, or
            your misuse of the Services.
          </p>
        </Section>

        <Section title="13. Termination">
          <p>
            Either party may terminate the engagement with written notice as specified in your SOW.
            Amounts already due for work performed remain payable. Sections 4, 5, 6, 9, 10, 11, and
            12 survive termination.
          </p>
        </Section>

        <Section title="14. Governing Law">
          <p>
            These Terms are governed by the laws of the State of Delaware, USA, without regard to
            conflict-of-law principles. Any disputes will first be handled through good-faith
            negotiation; if unresolved, through binding arbitration in Delaware.
          </p>
        </Section>

        <Section title="15. Changes to These Terms">
          <p>
            We may update these Terms from time to time. Continued use of our Services after changes
            means you accept the updated Terms.
          </p>
        </Section>

        <Section title="16. Contact">
          <p>
            Questions about these Terms? Reach us at:{" "}
            <a href="mailto:husnain@outlio.io" className="font-semibold text-accent">
              husnain@outlio.io
            </a>
          </p>
        </Section>
      </main>
      <Footer />
    </>
  );
}
