import { LogoIcon } from "@/components/LogoIcon";
import { ArrowLeft, DollarSign, Clock, AlertTriangle, CheckCircle, XCircle, RefreshCw, HelpCircle, Mail } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const sections = [
  { id: "overview", title: "1. Overview" },
  { id: "pre-campaign", title: "2. Pre-Campaign Cancellations" },
  { id: "post-campaign", title: "3. Post-Acceptance Refunds" },
  { id: "partial", title: "4. Partial Refunds" },
  { id: "platform-fee", title: "5. Platform Fee (Non-Refundable)" },
  { id: "dispute-refunds", title: "6. Dispute-Based Refunds" },
  { id: "failed-payment", title: "7. Failed Payment Refunds" },
  { id: "timeline", title: "8. Refund Timeline" },
  { id: "how", title: "9. How Refunds Are Processed" },
  { id: "exclusions", title: "10. Exclusions" },
  { id: "contact", title: "11. Contact for Refund Requests" },
];

export default function RefundPolicy() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-xl border-b">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <LogoIcon className="w-10 h-10 shrink-0" />
            <div>
              <span className="text-xl font-bold">Crevio</span>
              <p className="text-[8px] text-muted-foreground uppercase tracking-wider -mt-0.5">Contract Engine</p>
            </div>
          </Link>
          <Link to="/" className="text-sm font-medium hover:text-primary transition-colors flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" /> Back to Home
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <div className="pt-24 pb-12 px-6 bg-gradient-to-br from-green-600/10 via-emerald-600/10 to-background border-b relative overflow-hidden">
        <div className="absolute inset-0 dot-pattern opacity-10" />
        <div className="max-w-4xl mx-auto relative z-10">
          <div className="inline-flex items-center gap-2 bg-green-500/10 border border-green-500/20 rounded-full px-4 py-2 mb-6">
            <RefreshCw className="w-4 h-4 text-green-400" />
            <span className="text-sm font-medium text-green-400">Refund Policy</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4">Refund Policy</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mb-6">
            Clear, fair, and transparent refund rules for all campaigns, contracts, and payments processed through Crevio.
          </p>
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> Effective Date: [Date]</span>
            <span className="flex items-center gap-1.5"><RefreshCw className="w-3.5 h-3.5" /> Last Updated: [Date]</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-12 flex gap-12">
        {/* Sidebar TOC */}
        <aside className="hidden lg:block w-64 shrink-0">
          <div className="sticky top-28">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4 px-2">Contents</p>
            <nav className="space-y-0.5 max-h-[70vh] overflow-y-auto pr-2">
              {sections.map((s) => (
                <a key={s.id} href={`#${s.id}`} className="block px-3 py-1.5 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all">
                  {s.title}
                </a>
              ))}
            </nav>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 min-w-0">
          <div className="space-y-10 max-w-3xl">

            {/* Intro card */}
            <div className="glass-card p-6 rounded-2xl border border-green-500/20 bg-green-500/5">
              <p className="text-muted-foreground leading-relaxed">
                Crevio acts as an independent intermediary facilitating and executing contractual arrangements between Brands and Creators. Funds deposited by Brands are held by Crevio solely for the purpose of executing the relevant Contract. This Refund Policy explains the conditions under which funds may be returned to a Brand or released to a Creator.
              </p>
              <p className="text-muted-foreground mt-3 leading-relaxed">
                All refund eligibility is determined in accordance with the applicable Contract, these guidelines, and Crevio's Terms &amp; Conditions. By using the Platform, you agree to this Refund Policy.
              </p>
            </div>

            {/* Quick Reference */}
            <div className="grid sm:grid-cols-3 gap-4">
              {[
                { icon: <CheckCircle className="w-5 h-5 text-green-400" />, label: "Refundable", desc: "Pre-contract cancellations, failed Creator deliverables, Crevio technical errors", color: "border-green-500/20 bg-green-500/5" },
                { icon: <RefreshCw className="w-5 h-5 text-yellow-400" />, label: "Partial Refunds", desc: "Milestone-based contracts where some deliverables are completed", color: "border-yellow-500/20 bg-yellow-500/5" },
                { icon: <XCircle className="w-5 h-5 text-red-400" />, label: "Non-Refundable", desc: "Crevio Platform Fee, completed deliverables, off-platform arrangements", color: "border-red-500/20 bg-red-500/5" },
              ].map((item) => (
                <div key={item.label} className={`rounded-xl border p-4 ${item.color}`}>
                  <div className="flex items-center gap-2 mb-2">{item.icon}<p className="font-semibold text-sm">{item.label}</p></div>
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                </div>
              ))}
            </div>

            <Section id="overview" icon={<DollarSign className="w-5 h-5" />} number="1" title="Overview">
              <p>When a Brand initiates a Campaign and the Contract is accepted by a Creator, the Campaign Amount is deposited by the Brand and temporarily held by Crevio. Funds are held only for the purpose of facilitating and executing the specific Contract and are not considered "in escrow" unless expressly stated.</p>
              <p>Refunds are triggered by: (a) pre-acceptance cancellations; (b) Creator failure to perform; (c) mutual cancellation agreements; (d) Crevio-side technical errors; or (e) dispute resolution decisions made by Crevio's review team.</p>
            </Section>

            <Section id="pre-campaign" icon={<Clock className="w-5 h-5" />} number="2" title="Pre-Campaign Cancellations">
              <p><strong>Before Contract Acceptance:</strong> If a Brand cancels a Campaign before the Creator has accepted the Contract, the full Campaign Amount deposited (less any applicable payment-processing charges) may be refunded to the Brand.</p>
              <p><strong>Before Payment Deposit:</strong> If the Campaign Amount has not yet been deposited, no refund is applicable. The Campaign is simply closed.</p>
              <p>Pre-acceptance cancellations must be initiated through the Platform. Cancellations communicated only via email or chat will not be processed until confirmed in the Platform.</p>
            </Section>

            <Section id="post-campaign" icon={<AlertTriangle className="w-5 h-5" />} number="3" title="Post-Acceptance Refunds">
              <p>Once both parties have accepted the Contract, neither party may unilaterally cancel it without consequences. Post-acceptance refunds are only available in the following circumstances:</p>
              <ul className="list-none space-y-2 mt-2">
                {[
                  "The Creator fails to submit required Deliverables by the agreed deadline and does not remedy the failure within any applicable grace period.",
                  "The Creator's submitted Deliverables are materially non-compliant with the Contract requirements and the Creator fails to revise within the permitted revision limit.",
                  "A mutually agreed cancellation is reached and confirmed by both parties through the Platform.",
                  "Crevio determines through its review process that the Brand is entitled to a refund due to a verified Creator violation.",
                ].map((item, i) => (
                  <li key={i} className="flex gap-3 text-sm">
                    <CheckCircle className="w-4 h-4 text-green-400 shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </Section>

            <Section id="partial" icon={<RefreshCw className="w-5 h-5" />} number="4" title="Partial Refunds">
              <p>Where a Contract is structured with multiple milestones or phased payments, and a Creator completes some but not all milestones, refunds will be calculated proportionally based on the milestones that were <em>not</em> completed or approved.</p>
              <p>Applicable Penalties (see Terms &amp; Conditions Section 17) may be deducted from the refund amount where a Creator violation contributed to the cancellation.</p>
              <div className="bg-muted/40 border rounded-xl p-4 mt-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Example</p>
                <p className="text-sm">Contract of ₹1,00,000 with 4 equal milestones (₹25,000 each). Creator completes 2 milestones and fails the remaining 2. Refundable amount = ₹50,000 (minus applicable penalties and processing charges).</p>
              </div>
            </Section>

            <Section id="platform-fee" icon={<XCircle className="w-5 h-5" />} number="5" title="Platform Fee (Non-Refundable)">
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-4">
                <div className="flex items-start gap-2">
                  <XCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <p className="text-sm"><strong>The Crevio Platform Fee (2% of Campaign Amount) is non-refundable once the Contract has been accepted by both parties.</strong></p>
                </div>
              </div>
              <p>The Platform Fee covers Crevio's services including contract management, compliance monitoring, payment infrastructure, and platform operations. These services are performed regardless of whether the campaign reaches completion.</p>
              <p>In exceptional circumstances (e.g., a documented Crevio-side technical error that prevented Campaign execution), Crevio may, at its sole discretion, refund the Platform Fee. This is not a general entitlement.</p>
            </Section>

            <Section id="dispute-refunds" icon={<HelpCircle className="w-5 h-5" />} number="6" title="Dispute-Based Refunds">
              <p>When a dispute is raised through the Platform, Crevio will temporarily hold the relevant funds during the review process. Following resolution, funds may be:</p>
              <ul className="list-none space-y-2 mt-2">
                {[
                  "Released in full to the Creator if the dispute is resolved in the Creator's favour.",
                  "Refunded in full or in part to the Brand if Crevio determines the Creator failed to meet contractual obligations.",
                  "Split between both parties proportionally based on the review outcome.",
                  "Reduced by applicable Penalties before distribution to either party.",
                ].map((item, i) => (
                  <li key={i} className="flex gap-3 text-sm">
                    <RefreshCw className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-3">Crevio's review decision is final at the Platform level. Crevio relies on Contract records, analytics, delivery timestamps, platform logs, and other recorded data — not verbal claims — to determine dispute outcomes.</p>
            </Section>

            <Section id="failed-payment" icon={<AlertTriangle className="w-5 h-5" />} number="7" title="Failed Payment Refunds">
              <p>If a payment fails after funds have been partially processed due to a technical error on Crevio's side, the affected amount will be refunded to the originating payment method as soon as reasonably practicable.</p>
              <p>Crevio is not responsible for failures caused by third-party banks, payment processors, card networks, or other financial intermediaries. In such cases, the Brand must contact their payment provider directly.</p>
            </Section>

            <Section id="timeline" icon={<Clock className="w-5 h-5" />} number="8" title="Refund Timeline">
              <div className="space-y-3">
                {[
                  { stage: "Pre-acceptance Cancellation", time: "3–5 business days" },
                  { stage: "Mutual Cancellation (post-acceptance)", time: "5–7 business days" },
                  { stage: "Creator Failure (Crevio-verified)", time: "7–10 business days" },
                  { stage: "Dispute-Based Refund", time: "7–14 business days after resolution" },
                  { stage: "Failed Payment (Crevio error)", time: "3–5 business days" },
                ].map((item) => (
                  <div key={item.stage} className="flex items-center justify-between bg-muted/40 border rounded-xl px-4 py-3">
                    <span className="text-sm">{item.stage}</span>
                    <span className="text-xs font-mono text-accent">{item.time}</span>
                  </div>
                ))}
              </div>
              <p className="mt-4 text-sm">Timelines are estimates and may vary depending on your bank or payment provider's processing times. Razorpay processing times may add 1–3 additional business days.</p>
            </Section>

            <Section id="how" icon={<RefreshCw className="w-5 h-5" />} number="9" title="How Refunds Are Processed">
              <p>All approved refunds are processed back to the original payment method used by the Brand (UPI, net banking, debit/credit card, or wallet). Crevio does not process refunds via bank transfer to a different account unless required by applicable law.</p>
              <p>Refunds are initiated by Crevio through its payment infrastructure (Razorpay). Processing timelines from Razorpay's side are outside Crevio's direct control once initiated.</p>
              <p>You will receive a refund confirmation notification through your registered email and the Platform once the refund is initiated.</p>
            </Section>

            <Section id="exclusions" icon={<XCircle className="w-5 h-5" />} number="10" title="Exclusions — When Refunds Are Not Available">
              <ul className="list-none space-y-2">
                {[
                  "The Crevio Platform Fee once the Contract has been accepted.",
                  "Campaigns where all Deliverables have been submitted, approved, and the Creator has been paid.",
                  "Campaigns cancelled due to a Brand violation of Crevio's Terms or guidelines.",
                  "Funds processed for off-platform arrangements not executed through Crevio.",
                  "Refund requests submitted more than 30 days after the relevant campaign milestone was closed.",
                  "Dissatisfaction with campaign performance metrics (views, reach, engagement) where Deliverables were otherwise completed.",
                ].map((item, i) => (
                  <li key={i} className="flex gap-3 text-sm">
                    <XCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </Section>

            <Section id="contact" icon={<Mail className="w-5 h-5" />} number="11" title="Contact for Refund Requests">
              <p>Refund requests must be initiated through the Platform's dispute or support interface. Requests submitted only by email without a Platform record may not be processed.</p>
              <div className="bg-muted/40 border rounded-xl p-4 mt-3">
                <p className="text-sm">
                  <strong>Crevio Refund & Billing Support</strong><br/>
                  Email: admin@crevio.co.in<br/>
                  Support Portal: [Platform Support Link]<br/>
                  Response Time: 1–2 business days
                </p>
              </div>
            </Section>

          </div>
        </main>
      </div>

      {/* Footer */}
      <footer className="border-t py-12 px-6 mt-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <LogoIcon className="w-6 h-6 shrink-0" />
            <span className="font-bold">Crevio</span>
          </div>
          <p className="text-sm text-muted-foreground">© {new Date().getFullYear()} Crevio. All rights reserved.</p>
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            <Link to="/terms" className="hover:text-foreground transition-colors">Terms</Link>
            <Link to="/privacy-policy" className="hover:text-foreground transition-colors">Privacy</Link>
            <Link to="/refund-policy" className="hover:text-foreground transition-colors font-medium text-foreground">Refunds</Link>
            <Link to="/cookie-policy" className="hover:text-foreground transition-colors">Cookies</Link>
            <Link to="/acceptable-use" className="hover:text-foreground transition-colors">Acceptable Use</Link>
            <Link to="/creator-guidelines" className="hover:text-foreground transition-colors">Creator Guidelines</Link>
            <Link to="/copyright-policy" className="hover:text-foreground transition-colors">Copyright</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

function Section({ id, icon, number, title, children }: {
  id: string; icon: React.ReactNode; number: string; title: string; children: React.ReactNode;
}) {
  return (
    <motion.section id={id} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.4 }} className="scroll-mt-28">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">{icon}</div>
        <h2 className="text-lg font-bold"><span className="text-muted-foreground text-sm font-normal mr-2">{number}.</span>{title}</h2>
      </div>
      <div className="pl-12 text-muted-foreground leading-relaxed space-y-3 text-[15px]">{children}</div>
    </motion.section>
  );
}
