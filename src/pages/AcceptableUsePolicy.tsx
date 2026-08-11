import { LogoIcon } from "@/components/LogoIcon";
import { ArrowLeft, Ban, CheckCircle, XCircle, AlertTriangle, Shield, Users, FileText, Mail, Scale } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const sections = [
  { id: "purpose", title: "1. Purpose" },
  { id: "who", title: "2. Who This Applies To" },
  { id: "permitted", title: "3. Permitted Uses" },
  { id: "prohibited", title: "4. Prohibited Uses" },
  { id: "content-standards", title: "5. Content Standards" },
  { id: "brand-rules", title: "6. Campaign & Brand Rules" },
  { id: "creator-rules", title: "7. Creator Rules" },
  { id: "payment-rules", title: "8. Payment & Contract Rules" },
  { id: "enforcement", title: "9. Enforcement" },
  { id: "reporting", title: "10. Reporting Violations" },
  { id: "contact", title: "11. Contact" },
];

const prohibited = [
  "Campaigns promoting illegal products, services, or activities",
  "Spam, unsolicited bulk messaging, or harvesting user data",
  "Creating fake accounts, duplicate accounts, or impersonating others",
  "Uploading malware, viruses, or malicious code",
  "Manipulating platform metrics, reviews, or analytics",
  "Posting content that infringes third-party intellectual property rights",
  "Harassment, threats, hate speech, or discriminatory content",
  "Campaigns targeting minors in an inappropriate manner",
  "Off-platform payment circumvention intended to avoid Crevio fees",
  "Fraudulent campaign claims or misleading deliverable submissions",
];

const permitted = [
  "Creating and managing legitimate brand campaigns with real budgets",
  "Submitting genuine content deliverables that comply with contract terms",
  "Communicating professionally with other platform users",
  "Using platform analytics and data to optimise genuine campaigns",
  "Requesting legitimate revisions within contract-specified limits",
  "Raising disputes through official platform dispute channels",
];

export default function AcceptableUsePolicy() {
  return (
    <div className="min-h-screen bg-background">
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

      <div className="pt-24 pb-12 px-6 bg-gradient-to-br from-red-600/10 via-rose-600/10 to-background border-b relative overflow-hidden">
        <div className="absolute inset-0 dot-pattern opacity-10" />
        <div className="max-w-4xl mx-auto relative z-10">
          <div className="inline-flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-full px-4 py-2 mb-6">
            <Ban className="w-4 h-4 text-red-400" />
            <span className="text-sm font-medium text-red-400">Acceptable Use Policy</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4">Acceptable Use Policy</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mb-6">
            Rules governing how Crevio's platform, tools, and services may and may not be used by brands, creators, agencies, and all other users.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-12 flex gap-12">
        <aside className="hidden lg:block w-64 shrink-0">
          <div className="sticky top-28">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4 px-2">Contents</p>
            <nav className="space-y-0.5">
              {sections.map((s) => (
                <a key={s.id} href={`#${s.id}`} className="block px-3 py-1.5 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all">{s.title}</a>
              ))}
            </nav>
          </div>
        </aside>

        <main className="flex-1 min-w-0">
          <div className="space-y-10 max-w-3xl">

            <div className="glass-card p-6 rounded-2xl border border-red-500/20 bg-red-500/5">
              <p className="text-muted-foreground leading-relaxed">
                This Acceptable Use Policy ("AUP") governs how Crevio's platform, services, APIs, and related tools may be accessed and used. This AUP applies to all users — brands, creators, agencies, and any other party who accesses or uses any part of the Crevio Platform. It supplements the <Link to="/terms" className="text-primary underline underline-offset-2">Terms &amp; Conditions</Link> and the <Link to="/privacy-policy" className="text-primary underline underline-offset-2">Privacy Policy</Link>.
              </p>
              <p className="text-muted-foreground mt-3 leading-relaxed">
                Violations of this AUP may result in warnings, suspension, termination, financial penalties, and/or referral to law enforcement where applicable.
              </p>
            </div>

            <Section id="purpose" icon={<Shield className="w-5 h-5" />} number="1" title="Purpose">
              <p>This policy exists to ensure that Crevio remains a safe, fair, and trustworthy platform for all users. The rules below define acceptable behaviour and help Crevio maintain a high-quality environment for legitimate brand-creator collaborations.</p>
            </Section>

            <Section id="who" icon={<Users className="w-5 h-5" />} number="2" title="Who This Applies To">
              <p>This AUP applies to all registered users of Crevio, including Brands, Creators, Agencies, Administrators, and any person or entity accessing the Platform's APIs, tools, or features — regardless of account type, country of access, or nature of use.</p>
            </Section>

            <Section id="permitted" icon={<CheckCircle className="w-5 h-5" />} number="3" title="Permitted Uses">
              <div className="space-y-2">
                {permitted.map((item, i) => (
                  <div key={i} className="flex gap-3 text-sm">
                    <CheckCircle className="w-4 h-4 text-green-400 shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </Section>

            <Section id="prohibited" icon={<XCircle className="w-5 h-5" />} number="4" title="Prohibited Uses">
              <div className="space-y-2">
                {prohibited.map((item, i) => (
                  <div key={i} className="flex gap-3 text-sm">
                    <XCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </Section>

            <Section id="content-standards" icon={<FileText className="w-5 h-5" />} number="5" title="Content Standards">
              <p>All content uploaded, submitted, or shared through Crevio — including campaign briefs, deliverables, profile information, and communications — must:</p>
              <ul className="list-none space-y-2 mt-2">
                {[
                  "Be accurate and not misleading.",
                  "Comply with applicable laws including advertising, IP, and consumer protection laws.",
                  "Not contain explicit, adult, violent, hateful, or discriminatory material.",
                  "Not include personal data of third parties without appropriate consent.",
                  "Not infringe the intellectual property or privacy rights of any person or entity.",
                ].map((item, i) => (
                  <li key={i} className="flex gap-3 text-sm">
                    <CheckCircle className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mt-4">
                <p className="text-sm font-semibold text-red-400 mb-1">Prohibited Industries</p>
                <p className="text-sm text-muted-foreground">Campaigns involving the following are prohibited: gambling platforms without valid licences; adult/pornographic content; weapons, firearms, or ammunition; illegal drugs or controlled substances; tobacco/vaping products targeting minors; pyramid schemes or multi-level marketing of a deceptive nature; counterfeit goods.</p>
              </div>
            </Section>

            <Section id="brand-rules" icon={<FileText className="w-5 h-5" />} number="6" title="Campaign & Brand Rules">
              <p>Brands must ensure all Campaign information is truthful, accurate, and capable of being fulfilled. Brands must not:</p>
              <ul className="list-none space-y-2 mt-2">
                {[
                  "Post misleading budgets, deliverable requirements, or campaign objectives.",
                  "Require Creators to produce content that violates applicable laws or platform rules.",
                  "Attempt to pay Creators outside the Platform to avoid Crevio fees.",
                  "Create multiple accounts to circumvent platform restrictions.",
                  "Use the Platform to scrape Creator data for purposes outside the Campaign.",
                ].map((item, i) => (
                  <li key={i} className="flex gap-3 text-sm">
                    <Ban className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </Section>

            <Section id="creator-rules" icon={<Users className="w-5 h-5" />} number="7" title="Creator Rules">
              <p>Creators must ensure all information provided on the Platform is honest and accurate. Creators must not:</p>
              <ul className="list-none space-y-2 mt-2">
                {[
                  "Falsify follower counts, engagement rates, or audience demographics.",
                  "Submit AI-generated or plagiarised content as original deliverables without Brand consent.",
                  "Remove, archive, or delete published content before the agreed retention period.",
                  "Accept campaigns and fail to perform without raising a dispute or communicating.",
                  "Accept payment outside the Platform in violation of contract terms.",
                ].map((item, i) => (
                  <li key={i} className="flex gap-3 text-sm">
                    <Ban className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </Section>

            <Section id="payment-rules" icon={<Scale className="w-5 h-5" />} number="8" title="Payment & Contract Rules">
              <p>All Campaign payments must be processed through Crevio's payment infrastructure. Deliberate circumvention — i.e., arranging payment outside Crevio specifically to avoid the Platform Fee after a Contract has been accepted — violates this AUP and the Terms &amp; Conditions.</p>
              <p>Attempted payment fraud, chargebacks filed in bad faith, or manipulation of the payment dispute process may result in immediate account termination.</p>
            </Section>

            <Section id="enforcement" icon={<Shield className="w-5 h-5" />} number="9" title="Enforcement">
              <div className="space-y-3">
                {[
                  { level: "Warning", desc: "First-time or minor violations may result in a formal warning.", color: "border-yellow-500/20 bg-yellow-500/5 text-yellow-400" },
                  { level: "Suspension", desc: "Repeated or moderate violations may result in temporary account suspension.", color: "border-orange-500/20 bg-orange-500/5 text-orange-400" },
                  { level: "Penalties", desc: "Financial penalties (as per T&C Section 17) may be applied for violations affecting other users.", color: "border-red-500/20 bg-red-500/5 text-red-400" },
                  { level: "Termination", desc: "Serious, repeated, or fraudulent violations result in permanent account termination.", color: "border-destructive/20 bg-destructive/5 text-destructive" },
                ].map((item) => (
                  <div key={item.level} className={`border rounded-xl p-4 ${item.color.split(" ").slice(0,2).join(" ")}`}>
                    <p className={`font-semibold text-sm mb-1 ${item.color.split(" ")[2]}`}>{item.level}</p>
                    <p className="text-sm text-muted-foreground">{item.desc}</p>
                  </div>
                ))}
              </div>
            </Section>

            <Section id="reporting" icon={<AlertTriangle className="w-5 h-5" />} number="10" title="Reporting Violations">
              <p>If you observe a violation of this AUP by another user, please report it through the Platform's reporting tools or contact our trust and safety team. Crevio will investigate all reports in good faith.</p>
              <p>False or malicious reports made to harm other users violate this AUP and may result in action against the reporting user.</p>
              <div className="bg-muted/40 border rounded-xl p-4 mt-3">
                <p className="text-sm">Trust &amp; Safety: admin@crevio.co.in<br/>Response Time: 1–3 business days</p>
              </div>
            </Section>

            <Section id="contact" icon={<Mail className="w-5 h-5" />} number="11" title="Contact">
              <div className="bg-muted/40 border rounded-xl p-4">
                <p className="text-sm">
                  <strong>Crevio — Trust &amp; Safety</strong><br/>
                  Email: admin@crevio.co.in<br/>
                  Legal: admin@crevio.co.in<br/>
                  Support: admin@crevio.co.in
                </p>
              </div>
            </Section>

          </div>
        </main>
      </div>

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
            <Link to="/refund-policy" className="hover:text-foreground transition-colors">Refunds</Link>
            <Link to="/cookie-policy" className="hover:text-foreground transition-colors">Cookies</Link>
            <Link to="/acceptable-use" className="hover:text-foreground transition-colors font-medium text-foreground">Acceptable Use</Link>
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
