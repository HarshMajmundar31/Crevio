import { LogoIcon } from "@/components/LogoIcon";
import { ArrowLeft, Copyright, FileText, AlertTriangle, Shield, Clock, Mail, CheckCircle, XCircle, Scale } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const sections = [
  { id: "overview", title: "1. Overview" },
  { id: "ownership", title: "2. Content Ownership" },
  { id: "brand-rights", title: "3. Brand Usage Rights" },
  { id: "creator-rights", title: "4. Creator Rights & Protections" },
  { id: "crevio-license", title: "5. Crevio's Limited License" },
  { id: "infringement", title: "6. Reporting Infringement (DMCA)" },
  { id: "counter-notice", title: "7. Counter-Notice Process" },
  { id: "repeat", title: "8. Repeat Infringers" },
  { id: "music", title: "9. Music & Third-Party Assets" },
  { id: "trademarks", title: "10. Trademarks" },
  { id: "contact", title: "11. Copyright Contact" },
];

const dmcaSteps = [
  { step: "01", title: "Identify the Content", desc: "Provide a specific description of the copyrighted work and the infringing URL on the Crevio Platform." },
  { step: "02", title: "Submit Your Notice", desc: "Email your DMCA takedown notice to admin@crevio.co.in with required information (see below)." },
  { step: "03", title: "Crevio Reviews", desc: "Crevio's legal team reviews the notice within 3–5 business days and determines validity." },
  { step: "04", title: "Action Taken", desc: "If valid, the infringing content is removed or access disabled, and the uploader is notified." },
];

export default function CopyrightPolicy() {
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

      <div className="pt-24 pb-12 px-6 bg-gradient-to-br from-indigo-600/10 via-blue-600/10 to-background border-b relative overflow-hidden">
        <div className="absolute inset-0 dot-pattern opacity-10" />
        <div className="max-w-4xl mx-auto relative z-10">
          <div className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 rounded-full px-4 py-2 mb-6">
            <Copyright className="w-4 h-4 text-indigo-400" />
            <span className="text-sm font-medium text-indigo-400">Copyright & DMCA Policy</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4">Copyright &amp; DMCA Policy</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mb-6">
            How intellectual property rights are handled on Crevio — including content ownership, usage rights, and the process for reporting copyright infringement.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-12 flex gap-12">
        <aside className="hidden lg:block w-64 shrink-0">
          <div className="sticky top-28">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4 px-2">Contents</p>
            <nav className="space-y-0.5 max-h-[70vh] overflow-y-auto pr-2">
              {sections.map((s) => (
                <a key={s.id} href={`#${s.id}`} className="block px-3 py-1.5 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all">{s.title}</a>
              ))}
            </nav>
          </div>
        </aside>

        <main className="flex-1 min-w-0">
          <div className="space-y-10 max-w-3xl">

            <div className="glass-card p-6 rounded-2xl border border-indigo-500/20 bg-indigo-500/5">
              <p className="text-muted-foreground leading-relaxed">
                Crevio respects intellectual property rights and expects all users to do the same. This Copyright &amp; DMCA Policy explains how intellectual property rights apply to content on Crevio, and how to report copyright infringement. This policy should be read alongside the <Link to="/terms" className="text-primary underline underline-offset-2">Terms &amp; Conditions</Link> and <Link to="/creator-guidelines" className="text-primary underline underline-offset-2">Creator Guidelines</Link>.
              </p>
            </div>

            <Section id="overview" icon={<Copyright className="w-5 h-5" />} number="1" title="Overview">
              <p>Content created, uploaded, or submitted through Crevio by users is protected by applicable copyright law. Crevio's role is to facilitate the management and execution of Brand-Creator contracts — not to take ownership of or claim rights over user-generated content.</p>
              <p>Users are responsible for ensuring that content they upload to Crevio does not infringe the intellectual property rights of third parties.</p>
            </Section>

            <Section id="ownership" icon={<Shield className="w-5 h-5" />} number="2" title="Content Ownership">
              <p>Unless expressly agreed otherwise in a Contract, Creators retain ownership of the content they create through Campaigns on Crevio. Brands do not automatically obtain ownership of Creator content — only the usage rights expressly agreed to in the Contract.</p>
              <p>Campaign briefs, contract templates, platform content, and any content generated by or for Crevio itself are owned by or licensed to Crevio.</p>
            </Section>

            <Section id="brand-rights" icon={<FileText className="w-5 h-5" />} number="3" title="Brand Usage Rights">
              <p>Brands receive the right to use Creator content only to the extent expressly granted in the Contract. Usage rights specified in a Campaign Contract may include:</p>
              <div className="grid sm:grid-cols-2 gap-3 mt-3">
                {[
                  { right: "Commercial Use", desc: "Use content in advertising and promotional materials" },
                  { right: "Duration", desc: "How long the Brand may use the content" },
                  { right: "Territory", desc: "Geographic regions where the content may be used" },
                  { right: "Exclusivity", desc: "Whether the Creator is restricted from similar content for competitors" },
                  { right: "Platforms", desc: "Which platforms the Brand may publish the content on" },
                  { right: "White-labelling", desc: "Whether the Brand may publish content without Creator attribution" },
                ].map((item) => (
                  <div key={item.right} className="bg-muted/40 border rounded-xl p-3">
                    <p className="text-xs font-semibold text-accent mb-1">{item.right}</p>
                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                  </div>
                ))}
              </div>
              <p className="mt-4">Usage rights not expressly granted in the Contract are reserved by the Creator. Brands must not use Creator content beyond the agreed scope.</p>
            </Section>

            <Section id="creator-rights" icon={<Shield className="w-5 h-5" />} number="4" title="Creator Rights & Protections">
              <p>Crevio maintains records of Contracts and deliverables to help Creators demonstrate their ownership and the scope of rights granted to any Brand. Where a Brand uses Creator content outside the agreed scope, the Creator may:</p>
              <ul className="list-none space-y-2 mt-2">
                {[
                  "Raise a dispute through the Crevio Platform.",
                  "Request that Crevio provide relevant Contract and delivery records to support a copyright claim.",
                  "File a copyright infringement report if Brand-uploaded content on the Platform violates Creator rights.",
                ].map((item, i) => (
                  <li key={i} className="flex gap-3 text-sm">
                    <CheckCircle className="w-4 h-4 text-green-400 shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </Section>

            <Section id="crevio-license" icon={<Scale className="w-5 h-5" />} number="5" title="Crevio's Limited License">
              <p>By uploading content to Crevio, you grant Crevio a limited, non-exclusive, royalty-free licence to access, store, process, display, and transmit your content solely to the extent necessary to provide the Platform's services — including contract monitoring, deliverable verification, dispute resolution, and technical operations.</p>
              <p>Crevio does not acquire ownership of your content and will not use your content for advertising, marketing, or public promotion without your express consent.</p>
            </Section>

            <Section id="infringement" icon={<AlertTriangle className="w-5 h-5" />} number="6" title="Reporting Infringement (DMCA)">
              <p>If you believe content uploaded to Crevio infringes your copyright, you may submit a DMCA takedown notice by following the process below:</p>
              <div className="space-y-4 mt-4">
                {dmcaSteps.map((step) => (
                  <div key={step.step} className="flex gap-4">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-sm shrink-0">{step.step}</div>
                    <div>
                      <p className="font-semibold text-sm">{step.title}</p>
                      <p className="text-sm text-muted-foreground mt-0.5">{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="bg-muted/40 border rounded-xl p-4 mt-6">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Your DMCA Notice Must Include</p>
                <ul className="space-y-1.5 text-sm text-muted-foreground">
                  {[
                    "Your full legal name, address, telephone number, and email address.",
                    "A description of the copyrighted work you claim has been infringed.",
                    "The URL or specific location on Crevio of the infringing content.",
                    "A statement that you have a good-faith belief the use is not authorised.",
                    "A statement that the information is accurate and that you are the copyright owner or authorised to act.",
                    "Your physical or electronic signature.",
                  ].map((item, i) => (
                    <li key={i} className="flex gap-2">
                      <CheckCircle className="w-3.5 h-3.5 text-accent shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <p className="mt-4 text-sm">Incomplete notices may not be actionable. Deliberately false DMCA notices may expose you to legal liability.</p>
            </Section>

            <Section id="counter-notice" icon={<Scale className="w-5 h-5" />} number="7" title="Counter-Notice Process">
              <p>If content you uploaded was removed due to a DMCA notice and you believe it was removed in error, you may submit a counter-notice. A valid counter-notice must include:</p>
              <ul className="list-none space-y-2 mt-2">
                {[
                  "Identification of the content removed and its previous location on Crevio.",
                  "A statement, under penalty of perjury, that you have a good-faith belief the content was removed by mistake.",
                  "Your name, address, telephone number, and consent to jurisdiction.",
                  "Your physical or electronic signature.",
                ].map((item, i) => (
                  <li key={i} className="flex gap-3 text-sm">
                    <FileText className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-3">If a valid counter-notice is received, Crevio will notify the original claimant. If no legal action is filed within 10–14 business days, the content may be restored.</p>
            </Section>

            <Section id="repeat" icon={<XCircle className="w-5 h-5" />} number="8" title="Repeat Infringers">
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
                <div className="flex gap-2 items-start">
                  <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <p className="text-sm">Crevio operates a repeat-infringer policy. Users who repeatedly infringe third-party intellectual property rights will have their accounts permanently terminated. This policy applies regardless of whether disputes are resolved individually.</p>
                </div>
              </div>
            </Section>

            <Section id="music" icon={<FileText className="w-5 h-5" />} number="9" title="Music & Third-Party Assets">
              <p>Creators are responsible for ensuring that any music, sound effects, images, footage, or other third-party assets included in their deliverables are properly licensed. Acceptable licences include:</p>
              <ul className="list-none space-y-2 mt-2">
                {[
                  "Royalty-free music from licensed libraries (e.g., Epidemic Sound, Artlist, YouTube Audio Library).",
                  "Music licensed directly for commercial use.",
                  "Brand-provided assets that the Brand has confirmed are cleared for use.",
                  "Original music or audio created by the Creator.",
                ].map((item, i) => (
                  <li key={i} className="flex gap-3 text-sm">
                    <CheckCircle className="w-4 h-4 text-green-400 shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-3">Content removed due to copyright-restricted audio is the Creator's responsibility. Deliverables that are unavailable for verification due to a Creator-caused copyright takedown may not qualify for payment.</p>
            </Section>

            <Section id="trademarks" icon={<Shield className="w-5 h-5" />} number="10" title="Trademarks">
              <p>Users may not use Crevio's name, logo, or trademarks without express written permission. Creators may use Brand trademarks only within the scope of the applicable Campaign Contract. Unauthorised use of third-party trademarks in deliverables or platform content is prohibited.</p>
            </Section>

            <Section id="contact" icon={<Mail className="w-5 h-5" />} number="11" title="Copyright Contact">
              <div className="bg-muted/40 border rounded-xl p-4">
                <p className="text-sm">
                  <strong>Crevio — Copyright & Legal</strong><br/>
                  DMCA / Copyright Notices: admin@crevio.co.in<br/>
                  Legal: admin@crevio.co.in<br/>
                  Response Time: 3–5 business days for DMCA notices<br/>
                  Address: [Registered Legal Address]
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
            <Link to="/acceptable-use" className="hover:text-foreground transition-colors">Acceptable Use</Link>
            <Link to="/creator-guidelines" className="hover:text-foreground transition-colors">Creator Guidelines</Link>
            <Link to="/copyright-policy" className="hover:text-foreground transition-colors font-medium text-foreground">Copyright</Link>
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
