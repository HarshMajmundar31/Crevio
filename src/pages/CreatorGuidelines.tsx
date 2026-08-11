import { LogoIcon } from "@/components/LogoIcon";
import { ArrowLeft, Star, CheckCircle, XCircle, AlertTriangle, Users, FileText, Shield, Megaphone, Eye, Mail } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const sections = [
  { id: "overview", title: "1. Overview" },
  { id: "who", title: "2. Who This Applies To" },
  { id: "content-quality", title: "3. Content Quality Standards" },
  { id: "disclosure", title: "4. Advertising Disclosure (FTC/ASCI)" },
  { id: "platform-rules", title: "5. Platform-Specific Rules" },
  { id: "authenticity", title: "6. Authenticity & Anti-Fraud" },
  { id: "brand-safety", title: "7. Brand Safety" },
  { id: "ip", title: "8. Intellectual Property & Music" },
  { id: "deliverable-standards", title: "9. Deliverable Submission Standards" },
  { id: "prohibited-content", title: "10. Prohibited Content" },
  { id: "violations", title: "11. Violations & Consequences" },
  { id: "contact", title: "12. Contact" },
];

const platforms = [
  { name: "Instagram", rules: ["Follow Meta's Community Standards", "Use #Ad or #Sponsored for paid promotions", "Do not use banned hashtags or engage pods", "Stories must maintain 15-second visibility"] },
  { name: "YouTube", rules: ["Enable the 'paid promotion' disclosure toggle", "Follow YouTube's advertiser-friendly guidelines", "Do not artificially inflate view counts or watch time", "Maintain video for minimum agreed period"] },
  { name: "TikTok", rules: ["Use #Ad disclosure in caption", "Follow TikTok's Community Guidelines", "Do not use copyright-restricted audio", "Maintain published videos for agreed retention period"] },
  { name: "X (Twitter)", rules: ["Use #Ad or #Sponsored in any promotional tweet", "Do not create artificial engagement (retweet rings)", "Follow X's Promotion Guidelines", "Do not delete posts before agreed retention period"] },
];

export default function CreatorGuidelines() {
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

      <div className="pt-24 pb-12 px-6 bg-gradient-to-br from-pink-600/10 via-rose-600/10 to-background border-b relative overflow-hidden">
        <div className="absolute inset-0 dot-pattern opacity-10" />
        <div className="max-w-4xl mx-auto relative z-10">
          <div className="inline-flex items-center gap-2 bg-pink-500/10 border border-pink-500/20 rounded-full px-4 py-2 mb-6">
            <Star className="w-4 h-4 text-pink-400" />
            <span className="text-sm font-medium text-pink-400">Creator Guidelines</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4">Creator Guidelines</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mb-6">
            Standards, best practices, and rules for creators working on campaigns through Crevio — covering content quality, disclosure, authenticity, and platform-specific rules.
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

            <div className="glass-card p-6 rounded-2xl border border-pink-500/20 bg-pink-500/5">
              <p className="text-muted-foreground leading-relaxed">
                These Creator Guidelines establish the standards that all Creators on Crevio are expected to follow when participating in Campaigns. The guidelines cover content quality, advertising disclosures, platform-specific requirements, authenticity rules, and prohibited content. Compliance with these guidelines is a condition of using Crevio and is referenced in the <Link to="/terms" className="text-primary underline underline-offset-2">Terms &amp; Conditions</Link>.
              </p>
            </div>

            <Section id="overview" icon={<Star className="w-5 h-5" />} number="1" title="Overview">
              <p>Crevio connects Brands and Creators through structured contracts and deliverable verification. Creators are expected to produce genuine, high-quality content that meets the Brand's brief while complying with platform rules, applicable law, and professional standards.</p>
              <p>These guidelines apply to all content created, submitted, or published in connection with a Campaign on Crevio, regardless of the social-media platform on which the content appears.</p>
            </Section>

            <Section id="who" icon={<Users className="w-5 h-5" />} number="2" title="Who This Applies To">
              <p>These guidelines apply to all registered Creators on Crevio — including individual content creators, influencers, UGC creators, video producers, photographers, copywriters, and any other person who accepts a Campaign Contract through the Platform.</p>
            </Section>

            <Section id="content-quality" icon={<Star className="w-5 h-5" />} number="3" title="Content Quality Standards">
              <div className="space-y-2">
                {[
                  "Content must be original and created specifically for the contracted Campaign unless the Brand has explicitly agreed to repurposed content.",
                  "Deliverables must meet the specifications outlined in the Campaign brief and Contract (resolution, duration, format, language, tone).",
                  "Content must be proofread and free from obvious factual errors related to the Brand's product or service.",
                  "Audio and video deliverables must meet minimum technical quality standards as specified in the Contract.",
                  "Content must reflect the Brand's guidelines as provided in the campaign brief.",
                ].map((item, i) => (
                  <div key={i} className="flex gap-3 text-sm">
                    <CheckCircle className="w-4 h-4 text-green-400 shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </Section>

            <Section id="disclosure" icon={<Megaphone className="w-5 h-5" />} number="4" title="Advertising Disclosure (FTC / ASCI)">
              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 mb-4">
                <div className="flex gap-2 items-start">
                  <AlertTriangle className="w-4 h-4 text-yellow-400 shrink-0 mt-0.5" />
                  <p className="text-sm"><strong>All paid brand partnerships must be clearly and prominently disclosed</strong> as required by applicable advertising law (India's ASCI guidelines, FTC guidelines, or applicable local law).</p>
                </div>
              </div>
              <p>Disclosure must be:</p>
              <ul className="list-none space-y-2 mt-2">
                {[
                  "Clear and prominent — not buried in hashtags or small print.",
                  "Placed at the beginning of video content or above the fold in caption content.",
                  "Use approved terms such as #Ad, #Sponsored, #Collab, 'Paid partnership with [Brand]', or platform-specific paid partnership tags.",
                  "Present on all versions of the content (Stories, Reels, Shorts, Thumbnails where relevant).",
                ].map((item, i) => (
                  <li key={i} className="flex gap-3 text-sm">
                    <CheckCircle className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-sm">Failure to include required disclosures is a Contract violation and may attract a Penalty under Crevio's Terms &amp; Conditions.</p>
            </Section>

            <Section id="platform-rules" icon={<Eye className="w-5 h-5" />} number="5" title="Platform-Specific Rules">
              <div className="space-y-4">
                {platforms.map((platform) => (
                  <div key={platform.name} className="bg-muted/40 border rounded-2xl p-4">
                    <p className="font-semibold mb-3">{platform.name}</p>
                    <ul className="space-y-1.5">
                      {platform.rules.map((rule, i) => (
                        <li key={i} className="flex gap-2 text-xs text-muted-foreground">
                          <CheckCircle className="w-3.5 h-3.5 text-accent shrink-0 mt-0.5" />
                          <span>{rule}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </Section>

            <Section id="authenticity" icon={<Shield className="w-5 h-5" />} number="6" title="Authenticity & Anti-Fraud">
              <p>Crevio verifies Creator performance data through supported platform analytics integrations. Creators must not:</p>
              <div className="space-y-2 mt-2">
                {[
                  "Purchase followers, views, likes, comments, or any form of fake engagement.",
                  "Use engagement pods, bots, or automated tools to inflate metrics.",
                  "Submit screenshots, edited analytics, or fabricated performance data.",
                  "Misrepresent audience demographics or geographic distribution.",
                  "Claim deliverable completion before the content has been published.",
                ].map((item, i) => (
                  <div key={i} className="flex gap-3 text-sm">
                    <XCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
              <p className="mt-3">Detection of fake analytics constitutes a Contract violation and will attract a Penalty of 2.5% of the Campaign Amount in addition to other applicable consequences.</p>
            </Section>

            <Section id="brand-safety" icon={<Shield className="w-5 h-5" />} number="7" title="Brand Safety">
              <p>Creators must ensure that campaign content does not appear alongside, or in close proximity to, content that could damage a Brand's reputation. This includes:</p>
              <div className="space-y-2 mt-2">
                {[
                  "Content featuring hate speech, graphic violence, or explicit material.",
                  "Content expressing political opinions that the Brand has not approved.",
                  "Content promoting competing brands during any exclusivity period defined in the Contract.",
                  "Content that could reasonably be perceived as damaging, offensive, or misleading to the Brand.",
                ].map((item, i) => (
                  <div key={i} className="flex gap-3 text-sm">
                    <AlertTriangle className="w-4 h-4 text-yellow-400 shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </Section>

            <Section id="ip" icon={<FileText className="w-5 h-5" />} number="8" title="Intellectual Property & Music">
              <p>Creators are responsible for ensuring they have the right to use all elements included in their deliverables, including:</p>
              <ul className="list-none space-y-2 mt-2">
                {[
                  "Background music must be licensed (royalty-free or brand-approved) to avoid takedowns.",
                  "Third-party images, logos, or footage must be properly licensed.",
                  "Creators must not use the Brand's trademarks beyond the scope permitted by the Campaign.",
                  "Creators must ensure their original content does not infringe third-party copyrights.",
                ].map((item, i) => (
                  <li key={i} className="flex gap-3 text-sm">
                    <CheckCircle className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-3">A content takedown due to unlicensed music or IP infringement caused by the Creator is the Creator's responsibility and does not entitle the Creator to payment for the affected deliverable.</p>
            </Section>

            <Section id="deliverable-standards" icon={<FileText className="w-5 h-5" />} number="9" title="Deliverable Submission Standards">
              <p>When submitting deliverables through Crevio:</p>
              <ul className="list-none space-y-2 mt-2">
                {[
                  "Submit deliverables before the Contract deadline. Late submissions trigger a 1% penalty.",
                  "Include the live URL/link to published content when submitting social media deliverables.",
                  "Ensure content is publicly accessible at the time of submission for Crevio's verification.",
                  "Maintain published content for the minimum retention period stated in the Contract.",
                  "Respond to revision requests within the timeframe specified in the Contract.",
                ].map((item, i) => (
                  <li key={i} className="flex gap-3 text-sm">
                    <CheckCircle className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </Section>

            <Section id="prohibited-content" icon={<XCircle className="w-5 h-5" />} number="10" title="Prohibited Content">
              <p>The following content is prohibited across all Campaigns on Crevio, regardless of Brand instructions:</p>
              <div className="space-y-2 mt-2">
                {[
                  "Content targeting or exploiting minors.",
                  "Content promoting illegal activities, products, or services.",
                  "Hate speech, discrimination, or content targeting protected characteristics.",
                  "Graphic violence, gore, or disturbing imagery.",
                  "Sexually explicit or adult content.",
                  "Content that is factually false and may mislead consumers about a product or service.",
                  "Content that violates the terms of service of the platform on which it is published.",
                ].map((item, i) => (
                  <div key={i} className="flex gap-3 text-sm">
                    <XCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </Section>

            <Section id="violations" icon={<AlertTriangle className="w-5 h-5" />} number="11" title="Violations & Consequences">
              <p>Violations of these Creator Guidelines are treated as violations of the applicable Contract and/or Crevio's Terms &amp; Conditions. Consequences may include Penalties, partial or full withholding of payment, account suspension, or permanent termination depending on the severity and frequency of the violation.</p>
              <p>Refer to the <Link to="/terms" className="text-primary underline underline-offset-2">Terms &amp; Conditions — Section 17</Link> for the full Penalty schedule.</p>
            </Section>

            <Section id="contact" icon={<Mail className="w-5 h-5" />} number="12" title="Contact">
              <p>For questions about these guidelines, contact Crevio's creator support team:</p>
              <div className="bg-muted/40 border rounded-xl p-4 mt-3">
                <p className="text-sm">
                  Creator Support: admin@crevio.co.in<br/>
                  Trust &amp; Safety: admin@crevio.co.in<br/>
                  General Support: admin@crevio.co.in
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
            <Link to="/creator-guidelines" className="hover:text-foreground transition-colors font-medium text-foreground">Creator Guidelines</Link>
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
