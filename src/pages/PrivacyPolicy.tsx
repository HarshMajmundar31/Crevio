import { LogoIcon } from "@/components/LogoIcon";
import { ArrowLeft, Shield, Eye, Database, Share2, Lock, Mail, Globe, UserCheck, FileText, Bell, Settings, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useState } from "react";
import { motion } from "framer-motion";

const sections = [
  { id: "scope", title: "1. Scope" },
  { id: "collect", title: "2. Information We Collect" },
  { id: "account", title: "3. Account Information" },
  { id: "brand", title: "4. Brand & Business Info" },
  { id: "creator", title: "5. Creator Information" },
  { id: "social", title: "6. Social Media Accounts" },
  { id: "campaign", title: "7. Campaign Information" },
  { id: "contracts", title: "8. Contracts & Agreements" },
  { id: "content", title: "9. Content & Communications" },
  { id: "payment", title: "10. Payment Information" },
  { id: "auto", title: "11. Auto-Collected Data" },
  { id: "cookies", title: "12. Cookies" },
  { id: "use", title: "13. How We Use Information" },
  { id: "ai", title: "14. Automated Systems & AI" },
  { id: "share", title: "15. How We Share Information" },
  { id: "legal", title: "16. Legal Disclosures" },
  { id: "business", title: "17. Business Transfers" },
  { id: "thirdparty", title: "18. Third-Party Services" },
  { id: "security", title: "19. Data Security" },
  { id: "retention", title: "20. Data Retention" },
  { id: "closure", title: "21. Account Closure" },
  { id: "rights", title: "22. Your Privacy Rights" },
  { id: "international", title: "23. International Transfers" },
  { id: "children", title: "24. Children's Privacy" },
  { id: "marketing", title: "25. Marketing Communications" },
  { id: "changes", title: "26. Changes to This Policy" },
  { id: "contact", title: "27. Contact Us" },
];

export default function PrivacyPolicy() {
  const [activeSection, setActiveSection] = useState<string | null>(null);

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
      <div className="pt-24 pb-12 px-6 bg-gradient-to-br from-blue-600/10 via-purple-600/10 to-background border-b relative overflow-hidden">
        <div className="absolute inset-0 dot-pattern opacity-10" />
        <div className="max-w-4xl mx-auto relative z-10">
          <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 rounded-full px-4 py-2 mb-6">
            <Shield className="w-4 h-4 text-blue-400" />
            <span className="text-sm font-medium text-blue-400">Privacy Policy</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4">We Respect Your Privacy</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mb-6">
            This Privacy Policy explains how Crevio collects, uses, stores, and protects your information when you use our platform.
          </p>
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5"><FileText className="w-3.5 h-3.5" /> Last Updated: [Date]</span>
            <span className="flex items-center gap-1.5"><Bell className="w-3.5 h-3.5" /> Effective Date: [Date]</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-12 flex gap-12">
        {/* Table of Contents - Desktop Sidebar */}
        <aside className="hidden lg:block w-64 shrink-0">
          <div className="sticky top-28">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4 px-2">Contents</p>
            <nav className="space-y-0.5 max-h-[70vh] overflow-y-auto pr-2">
              {sections.map((s) => (
                <a
                  key={s.id}
                  href={`#${s.id}`}
                  onClick={() => setActiveSection(s.id)}
                  className={`block px-3 py-1.5 rounded-lg text-xs transition-all ${
                    activeSection === s.id
                      ? "bg-primary/10 text-primary font-medium"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  }`}
                >
                  {s.title}
                </a>
              ))}
            </nav>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 min-w-0">
          <div className="space-y-10 max-w-3xl">

            {/* Intro */}
            <div className="glass-card p-6 rounded-2xl border border-blue-500/20 bg-blue-500/5">
              <p className="text-muted-foreground leading-relaxed">
                At Crevio, we respect your privacy and are committed to protecting the information entrusted to us. This Privacy Policy explains how <strong>[Legal Company Name]</strong> ("Crevio," "we," "us," or "our") collects, uses, stores, shares, and protects information when you access or use the Crevio website, applications, platform, APIs, and related services (collectively, the "Services").
              </p>
              <p className="text-muted-foreground leading-relaxed mt-3">
                Crevio is a platform that helps brands, agencies, creators, and other users discover, manage, execute, and monitor creator collaborations, campaigns, contracts, deliverables, payments, and related workflows.
              </p>
              <p className="text-muted-foreground leading-relaxed mt-3">
                By accessing or using the Services, you acknowledge that you have read and understood this Privacy Policy.
              </p>
            </div>

            {/* Section 1 */}
            <Section id="scope" icon={<Globe className="w-5 h-5" />} number="1" title="Scope of This Privacy Policy">
              <p>This Privacy Policy applies to information collected through Crevio's website, applications, platform, and related Services. It applies to visitors, registered users, creators, brands, agencies, campaign participants, and others who interact with Crevio. Certain Crevio features may be subject to additional privacy notices or terms.</p>
            </Section>

            {/* Section 2 */}
            <Section id="collect" icon={<Database className="w-5 h-5" />} number="2" title="Information We Collect">
              <p>We collect information you provide directly to us, information collected automatically when you use the Services, and information we receive from third-party services or other users where applicable. Depending on how you use Crevio, this may include account, creator, business, campaign, contract, content, communication, payment, technical, and usage information.</p>
            </Section>

            {/* Section 3 */}
            <Section id="account" icon={<UserCheck className="w-5 h-5" />} number="3" title="Account Information">
              <p>When you create a Crevio account, we may collect your name, email address, phone number, username, profile information, authentication credentials, account preferences, and other information required to establish and secure your account. You are responsible for keeping your credentials confidential.</p>
            </Section>

            {/* Section 4 */}
            <Section id="brand" icon={<FileText className="w-5 h-5" />} number="4" title="Brand, Agency, and Business Information">
              <p>If you use Crevio on behalf of a brand, agency, or other organization, we may collect the organization's name, website, industry, business contact details, team-member information, campaign requirements, budgets, billing information, and other information necessary to manage your account and campaigns.</p>
            </Section>

            {/* Section 5 */}
            <Section id="creator" icon={<UserCheck className="w-5 h-5" />} number="5" title="Creator Information">
              <p>Creators may provide their name, profile image, biography, portfolio, social-media handles, content categories, audience information, follower and engagement metrics, rates, campaign history, and other information relevant to creator collaborations. Appropriate profile information may be made available to authorized brands or agencies to facilitate discovery and collaboration.</p>
            </Section>

            {/* Section 6 */}
            <Section id="social" icon={<Share2 className="w-5 h-5" />} number="6" title="Social Media and Connected Accounts">
              <p>Crevio may allow you to connect social-media accounts and other third-party services. When you connect an account, we may receive information made available through that integration based on your authorization and permissions. This may include account identifiers, public profile information, content, follower information, engagement metrics, audience insights, and other information made available through the relevant API.</p>
            </Section>

            {/* Section 7 */}
            <Section id="campaign" icon={<FileText className="w-5 h-5" />} number="7" title="Campaign and Collaboration Information">
              <p>When you create or participate in a campaign, we may collect campaign briefs, objectives, budgets, timelines, requirements, creator assignments, deliverables, approvals, revisions, performance requirements, campaign status, and related materials. We use this information to facilitate and manage relationships between campaign participants.</p>
            </Section>

            {/* Section 8 */}
            <Section id="contracts" icon={<FileText className="w-5 h-5" />} number="8" title="Contracts and Agreements">
              <p>Crevio may process information contained in contracts, agreements, statements of work, campaign briefs, or other arrangements between users, including parties, deliverables, deadlines, fees, payment terms, usage rights, exclusivity requirements, milestones, approvals, and other contractual requirements.</p>
            </Section>

            {/* Section 9 */}
            <Section id="content" icon={<Eye className="w-5 h-5" />} number="9" title="Content and Communications">
              <p>Users may upload or create images, videos, documents, links, messages, comments, feedback, campaign submissions, and other content through Crevio. We process this information to provide Services, facilitate collaboration, manage campaigns, maintain records, provide support, resolve disputes, and protect the platform.</p>
            </Section>

            {/* Section 10 */}
            <Section id="payment" icon={<Database className="w-5 h-5" />} number="10" title="Payment and Transaction Information">
              <p>Where Crevio provides payment, billing, invoicing, or payout functionality, we may process transaction details, billing information, payout information, invoices, refunds, payment status, and tax-related information. Third-party payment providers may process payment credentials directly.</p>
            </Section>

            {/* Section 11 */}
            <Section id="auto" icon={<Settings className="w-5 h-5" />} number="11" title="Information Collected Automatically">
              <p>When you use Crevio, we may automatically collect your IP address, browser type, operating system, device information, device identifiers, approximate location, referring pages, pages and features accessed, login activity, timestamps, session information, error reports, and security-related information.</p>
            </Section>

            {/* Section 12 */}
            <Section id="cookies" icon={<Settings className="w-5 h-5" />} number="12" title="Cookies and Similar Technologies">
              <p>Crevio may use cookies and similar technologies to authenticate users, maintain sessions, remember preferences, maintain security, understand usage, measure performance, and improve functionality. You may manage certain cookies through your browser or device settings, although disabling essential cookies may affect some features.</p>
            </Section>

            {/* Section 13 */}
            <Section id="use" icon={<Database className="w-5 h-5" />} number="13" title="How We Use Information">
              <p>We use information to provide, operate, maintain, secure, and improve Crevio; manage accounts; facilitate creator-brand relationships; manage campaigns; organize contracts and deliverables; process transactions; provide analytics and support; prevent fraud and abuse; troubleshoot issues; develop features; and comply with applicable law.</p>
            </Section>

            {/* Section 14 */}
            <Section id="ai" icon={<Settings className="w-5 h-5" />} number="14" title="Automated Systems and AI">
              <p>Crevio may use automated systems, artificial intelligence, and machine-learning technologies to assist with campaign organization, information analysis or classification, deadline and deliverable monitoring, summaries, recommendations, workflow events, and campaign-management activities. Automated or AI-generated outputs may not always be accurate or complete, so users should review important outputs before relying on them.</p>
            </Section>

            {/* Section 15 */}
            <Section id="share" icon={<Share2 className="w-5 h-5" />} number="15" title="How We Share Information">
              <p>We may share information with authorized campaign participants when necessary to facilitate a collaboration. We may also share information with trusted service providers supporting hosting, storage, payments, analytics, communications, authentication, security, customer support, and AI functionality. We do not sell or rent your personal information for third-party marketing merely because you use Crevio.</p>
            </Section>

            {/* Section 16 */}
            <Section id="legal" icon={<Shield className="w-5 h-5" />} number="16" title="Legal Disclosures and Protection of Crevio">
              <p>We may disclose information when reasonably necessary to comply with applicable laws, regulations, legal processes, court orders, or lawful governmental requests, or to enforce agreements, investigate violations, prevent fraud or abuse, address security issues, or protect Crevio, our users, or others.</p>
            </Section>

            {/* Section 17 */}
            <Section id="business" icon={<Globe className="w-5 h-5" />} number="17" title="Business Transfers">
              <p>If Crevio is involved in a merger, acquisition, financing, restructuring, bankruptcy, sale of assets, or similar corporate transaction, information may be transferred as part of that transaction. Where required by law, we will provide appropriate notice.</p>
            </Section>

            {/* Section 18 */}
            <Section id="thirdparty" icon={<Globe className="w-5 h-5" />} number="18" title="Third-Party Services and Websites">
              <p>Crevio may integrate with or link to third-party websites, applications, social-media platforms, payment services, analytics providers, AI providers, and other services. Third parties operate under their own terms and privacy policies, and this Privacy Policy does not govern their independent practices.</p>
            </Section>

            {/* Section 19 */}
            <Section id="security" icon={<Lock className="w-5 h-5" />} number="19" title="Data Security">
              <p>We implement reasonable technical and organizational safeguards designed to protect information against unauthorized access, loss, misuse, alteration, or disclosure. Measures may include access controls, authentication, encryption, monitoring, logging, backups, infrastructure safeguards, and security procedures. No internet-based service can guarantee absolute security.</p>
            </Section>

            {/* Section 20 */}
            <Section id="retention" icon={<Database className="w-5 h-5" />} number="20" title="Data Retention">
              <p>We retain information for as long as reasonably necessary to provide the Services, fulfill the purposes described in this Privacy Policy, maintain records, comply with legal or contractual obligations, resolve disputes, prevent fraud and abuse, and protect Crevio. When information is no longer required, we may delete, anonymize, or de-identify it, subject to applicable requirements.</p>
            </Section>

            {/* Section 21 */}
            <Section id="closure" icon={<UserCheck className="w-5 h-5" />} number="21" title="Account Closure and Data Deletion">
              <p>You may request closure of your Crevio account through available functionality or by contacting us. Certain information may be retained for legal compliance, contractual records, accounting, security, fraud prevention, dispute resolution, or legitimate business purposes. Information contained in another user's campaign, contract, transaction, or other records may not be immediately deleted solely because your account has been closed.</p>
            </Section>

            {/* Section 22 */}
            <Section id="rights" icon={<Shield className="w-5 h-5" />} number="22" title="Your Privacy Rights and Choices">
              <p>Depending on your location and applicable law, you may have rights to access, correct, delete, or obtain a copy of your personal information, as well as rights to object to or restrict certain processing, withdraw consent where applicable, or exercise other rights provided by law. To exercise an applicable right, contact us using the information below. We may need to verify your identity.</p>
            </Section>

            {/* Section 23 */}
            <Section id="international" icon={<Globe className="w-5 h-5" />} number="23" title="International Data Transfers">
              <p>Crevio and its service providers may process, store, or access information in countries other than the country where you reside. Where required by law, we will use appropriate safeguards for international transfers of personal information.</p>
            </Section>

            {/* Section 24 */}
            <Section id="children" icon={<Shield className="w-5 h-5" />} number="24" title="Children's Privacy">
              <p>Crevio is intended for users legally permitted to use the Services under applicable law. We do not knowingly collect personal information from children where such collection is prohibited by law. If we learn that we have done so, we will take reasonable steps to address the situation, which may include deleting the information or terminating the relevant account.</p>
            </Section>

            {/* Section 25 */}
            <Section id="marketing" icon={<Bell className="w-5 h-5" />} number="25" title="Marketing Communications">
              <p>We may send account notifications, security alerts, campaign updates, contract notifications, payment notifications, and important service announcements. Where permitted by law, we may also send promotional communications. You may unsubscribe from promotional communications, but essential service communications may continue.</p>
            </Section>

            {/* Section 26 */}
            <Section id="changes" icon={<FileText className="w-5 h-5" />} number="26" title="Changes to This Privacy Policy">
              <p>We may update this Privacy Policy to reflect changes to Crevio, our Services, technology, business practices, or applicable laws. We will update the "Last Updated" date and, where required by law, provide additional notice of material changes.</p>
            </Section>

            {/* Section 27 - Contact */}
            <Section id="contact" icon={<Mail className="w-5 h-5" />} number="27" title="Contact Us">
              <div className="grid sm:grid-cols-2 gap-4 mt-2">
                <div className="bg-muted/50 rounded-xl p-4 border">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">General Contact</p>
                  <p className="text-sm"><strong>Crevio</strong><br/>
                  Legal Entity: [Full Legal Company Name]<br/>
                  Website: [Your Website]<br/>
                  Privacy Email: [privacy@yourdomain.com]<br/>
                  Privacy Email: admin@crevio.co.in<br/>
                  Support Email: admin@crevio.co.in<br/>
                  Registered Address: [Full Registered Address]</p>
                </div>
                <div className="bg-muted/50 rounded-xl p-4 border">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Data & Grievance</p>
                  <p className="text-sm">
                    <strong>Privacy / Data Protection Contact</strong><br/>
                    [Name / Designation]<br/>
                    Email: admin@crevio.co.in<br/><br/>
                    <strong>Grievance Contact</strong><br/>
                    [Name / Designation]<br/>
                    Email: admin@crevio.co.in
                  </p>
                </div>
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
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Crevio. All rights reserved.
          </p>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <Link to="/terms" className="hover:text-foreground transition-colors">Terms of Service</Link>
            <Link to="/privacy-policy" className="hover:text-foreground transition-colors font-medium text-foreground">Privacy Policy</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

function Section({ id, icon, number, title, children }: {
  id: string;
  icon: React.ReactNode;
  number: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <motion.section
      id={id}
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4 }}
      className="scroll-mt-28"
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
          {icon}
        </div>
        <h2 className="text-lg font-bold">
          <span className="text-muted-foreground text-sm font-normal mr-2">{number}.</span>
          {title}
        </h2>
      </div>
      <div className="pl-12 text-muted-foreground leading-relaxed space-y-3 text-[15px]">
        {children}
      </div>
    </motion.section>
  );
}
