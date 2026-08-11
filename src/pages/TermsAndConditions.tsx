import { LogoIcon } from "@/components/LogoIcon";
import { ArrowLeft, Scale, Users, FileText, Shield, Zap, AlertTriangle, DollarSign, Ban, Globe, Lock, ChevronRight, Bell, Settings, Mail, Gavel } from "lucide-react";
import { Link } from "react-router-dom";
import { useState } from "react";
import { motion } from "framer-motion";

const sections = [
  { id: "definitions", title: "1. Definitions" },
  { id: "about", title: "2. About Crevio" },
  { id: "eligibility", title: "3. User Eligibility" },
  { id: "verification", title: "4. Verification" },
  { id: "brand-obligations", title: "5. Brand Obligations" },
  { id: "creator-obligations", title: "6. Creator Obligations" },
  { id: "campaigns", title: "7. Campaigns & Contracts" },
  { id: "execution", title: "8. Contract Execution" },
  { id: "deliverables", title: "9. Deliverables & Revisions" },
  { id: "analytics", title: "10. Analytics & Performance" },
  { id: "automated", title: "11. Automated Decisions" },
  { id: "payments", title: "12. Payments & Funds" },
  { id: "fee", title: "13. Crevio Fee" },
  { id: "taxes", title: "14. Taxes & Charges" },
  { id: "cancellation", title: "15. Cancellation" },
  { id: "failed-payments", title: "16. Failed Payments" },
  { id: "penalties", title: "17. Penalties" },
  { id: "prohibited", title: "18. Prohibited Conduct" },
  { id: "off-platform", title: "19. Off-Platform Transactions" },
  { id: "disputes", title: "20. Disputes & Review" },
  { id: "funds-disputes", title: "21. Funds During Disputes" },
  { id: "ip", title: "22. Intellectual Property" },
  { id: "third-party", title: "23. Third-Party Platforms" },
  { id: "suspension", title: "24. Suspension & Termination" },
  { id: "technical", title: "25. Technical Issues" },
  { id: "guarantee", title: "26. No Guarantee of Results" },
  { id: "privacy", title: "27. Privacy & Data" },
  { id: "liability", title: "28. Limitation of Liability" },
  { id: "indemnification", title: "29. Indemnification" },
  { id: "modifications", title: "30. Modifications" },
  { id: "electronic", title: "31. Electronic Acceptance" },
  { id: "governing", title: "32. Governing Law" },
  { id: "general", title: "33. General Provisions" },
  { id: "contact", title: "34. Contact" },
];

const penalties = [
  { label: "Late Delivery", rate: "1%", color: "text-yellow-400" },
  { label: "Fake Analytics", rate: "2.5%", color: "text-orange-400" },
  { label: "Failure to Publish", rate: "1%", color: "text-yellow-400" },
  { label: "Removing Content Early", rate: "2.5%", color: "text-orange-400" },
  { label: "Fraud", rate: "10%", color: "text-red-400" },
  { label: "Contract Violation", rate: "5%", color: "text-red-400" },
];

export default function TermsAndConditions() {
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
      <div className="pt-24 pb-12 px-6 bg-gradient-to-br from-purple-600/10 via-pink-600/10 to-background border-b relative overflow-hidden">
        <div className="absolute inset-0 dot-pattern opacity-10" />
        <div className="max-w-4xl mx-auto relative z-10">
          <div className="inline-flex items-center gap-2 bg-purple-500/10 border border-purple-500/20 rounded-full px-4 py-2 mb-6">
            <Scale className="w-4 h-4 text-purple-400" />
            <span className="text-sm font-medium text-purple-400">Terms & Conditions</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4">Terms &amp; Conditions</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mb-6">
            These Terms govern your access to and use of Crevio's platform, including contract management, campaigns, payments, and all related services.
          </p>
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5"><FileText className="w-3.5 h-3.5" /> Effective Date: [DD Month YYYY]</span>
            <span className="flex items-center gap-1.5"><Bell className="w-3.5 h-3.5" /> Last Updated: [DD Month YYYY]</span>
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
            <div className="glass-card p-6 rounded-2xl border border-purple-500/20 bg-purple-500/5">
              <p className="text-muted-foreground leading-relaxed">
                These Terms &amp; Conditions ("Terms") govern access to and use of Crevio ("Crevio", "we", "us", or "our"), including its website, applications, software, contract-management tools, campaign-management systems, analytics, monitoring functionality, payment infrastructure, and related services (collectively, the "Platform").
              </p>
              <p className="text-muted-foreground leading-relaxed mt-3">
                Crevio is an independent platform designed to facilitate, monitor, and execute contractual engagements between brands, agencies, and creators.
              </p>
              <p className="text-muted-foreground leading-relaxed mt-3">
                By creating an account, accessing the Platform, participating in a Campaign, accepting a Contract, or otherwise using any Crevio service, you ("User", "you", or "your") acknowledge that you have read, understood, and agreed to these Terms. <strong>If you do not agree to these Terms, you must not access or use the Platform.</strong>
              </p>
            </div>

            {/* Section 1 - Definitions */}
            <Section id="definitions" icon={<FileText className="w-5 h-5" />} number="1" title="Definitions">
              <div className="grid sm:grid-cols-2 gap-3">
                {[
                  { term: "Brand", def: "A business, company, agency, advertiser, or other entity using Crevio to engage a Creator." },
                  { term: "Creator", def: "An individual or entity providing content creation, promotional, influencer, UGC, or related services through Crevio." },
                  { term: "Campaign", def: "A collaboration or commercial engagement established between a Brand and Creator through the Platform." },
                  { term: "Contract", def: "The legally binding agreement governing a Campaign, whether provided by the Brand or generated through Crevio." },
                  { term: "Deliverables", def: "The content, services, publications, milestones, or other obligations specified in a Contract." },
                  { term: "Campaign Amount", def: "The amount agreed between a Brand and Creator for the relevant Campaign, excluding the Crevio Fee." },
                  { term: "Crevio Fee", def: "The platform fee charged by Crevio for applicable Services." },
                  { term: "Penalty", def: "An amount imposed for a violation of these Terms, Crevio guidelines, or applicable Contract obligations." },
                ].map((item) => (
                  <div key={item.term} className="bg-muted/40 border rounded-xl p-3">
                    <p className="text-xs font-semibold uppercase tracking-wider text-accent mb-1">"{item.term}"</p>
                    <p className="text-xs text-muted-foreground">{item.def}</p>
                  </div>
                ))}
              </div>
            </Section>

            {/* Section 2 */}
            <Section id="about" icon={<Globe className="w-5 h-5" />} number="2" title="About Crevio">
              <p>Crevio is an independent contract-management and contract-execution platform.</p>
              <p>The Platform is designed to facilitate the lifecycle of a Brand-Creator engagement, including verification; Campaign creation; Contract creation and management; electronic acceptance; Deliverable management; automated monitoring; analytics; compliance tracking; payment collection and temporary holding; payment release; and resolution of platform-level Contract issues.</p>
              <p>Crevio acts as an independent intermediary between Brands and Creators. Crevio does not represent, employ, partner with, or act as an agent for either party.</p>
              <p>Crevio's role is to facilitate and monitor the contractual relationship established between the Brand and Creator.</p>
            </Section>

            {/* Section 3 */}
            <Section id="eligibility" icon={<Users className="w-5 h-5" />} number="3" title="User Eligibility and Account Information">
              <p>You must provide accurate, complete, and current information when registering for an account or using the Platform.</p>
              <p>Depending on the nature of your account, Crevio may require information relating to your identity, business, social-media accounts, audience, analytics, payment details, or other information reasonably necessary to provide or secure the Services.</p>
              <p>You are responsible for maintaining the confidentiality of your account credentials and for activity conducted through your account.</p>
              <p>You must not impersonate another person or entity, provide false or misleading information, create fraudulent accounts, manipulate verification information, or use another person's account without authorization.</p>
            </Section>

            {/* Section 4 */}
            <Section id="verification" icon={<Shield className="w-5 h-5" />} number="4" title="Verification and Authentication">
              <p>Crevio may verify Brands and Creators before permitting them to access or use certain Platform functionality.</p>
              <p>Verification may include, as applicable, reviewing identity; business legitimacy; social-media accounts; account ownership; audience information; engagement and performance analytics; submitted documentation; and other relevant information.</p>
              <p>Verification is intended to improve Platform integrity and does not constitute an endorsement, guarantee, certification, or representation that a User will perform its contractual obligations.</p>
              <p>Crevio may conduct additional verification at any time where reasonably necessary.</p>
              <p>False, fraudulent, or materially misleading information may result in account suspension or permanent termination.</p>
            </Section>

            {/* Section 5 */}
            <Section id="brand-obligations" icon={<FileText className="w-5 h-5" />} number="5" title="Brand Obligations">
              <p>Brands are responsible for ensuring that all Campaign information supplied through the Platform is accurate, lawful, reasonable, and capable of being performed.</p>
              <p>Campaign information may include objectives; budget; Deliverables; deadlines; content requirements; publication requirements; platforms; usage rights; exclusivity; performance requirements; payment terms; and other relevant conditions.</p>
              <p>A Brand must not create Campaigns involving unlawful, fraudulent, deceptive, abusive, or prohibited activities.</p>
              <p>Brands are responsible for complying with applicable advertising, intellectual-property, consumer-protection, and other laws relevant to their Campaigns.</p>
            </Section>

            {/* Section 6 */}
            <Section id="creator-obligations" icon={<Users className="w-5 h-5" />} number="6" title="Creator Obligations">
              <p>Creators must provide truthful and accurate information concerning their identity, social-media accounts, audience, analytics, experience, and capabilities.</p>
              <p>Creators must perform their obligations in accordance with the applicable Contract.</p>
              <p>Creators must not manipulate, falsify, or artificially inflate followers, views, engagement, analytics, audience information, performance metrics, or other Campaign-related information.</p>
              <p>Creators must also comply with applicable intellectual-property, advertising, disclosure, and other legal requirements.</p>
            </Section>

            {/* Section 7 */}
            <Section id="campaigns" icon={<FileText className="w-5 h-5" />} number="7" title="Campaigns and Contracts">
              <p>A Brand may use its own Contract or a Contract generated through Crevio where the Brand does not have a pre-existing Contract or elects to use Crevio's contract-generation functionality.</p>
              <p>Crevio may provide templates, workflows, and automated tools for Contract creation.</p>
              <p>A Contract becomes binding between the Brand and Creator when both parties have accepted it through the applicable Platform process.</p>
              <p>Once accepted, neither party may unilaterally alter the Contract. Any modification requires mutual agreement and re-acceptance by both parties.</p>
              <p>Crevio may maintain the official electronic record and applicable versions of Contracts executed through the Platform.</p>
            </Section>

            {/* Section 8 */}
            <Section id="execution" icon={<Zap className="w-5 h-5" />} number="8" title="Contract Execution and Monitoring">
              <p>Crevio may monitor the execution of a Contract using automated systems, Platform records, analytics, integrations, timestamps, and other available information.</p>
              <p>Depending on the Contract, Crevio may monitor Deliverables; deadlines; publication; content availability; milestones; performance; analytics; payment conditions; and other contractual requirements.</p>
              <p>Where a specified condition is satisfied, Crevio may automatically proceed with the corresponding contractual workflow.</p>
              <p>Where a condition is not satisfied, Crevio may issue a warning and proceed according to the applicable Contract and Crevio guidelines.</p>
            </Section>

            {/* Section 9 */}
            <Section id="deliverables" icon={<FileText className="w-5 h-5" />} number="9" title="Deliverables, Approvals and Revisions">
              <p>Creators must submit Deliverables in the manner and within the timeframe specified by the applicable Contract.</p>
              <p>Crevio may verify whether Deliverables have been submitted, published, maintained, or otherwise performed as required.</p>
              <p>Where revisions are permitted, a Brand may request a maximum of three (3) revision rounds, unless the Contract provides otherwise.</p>
              <p>A revision request must have a legitimate basis under the applicable Contract.</p>
              <p>A Creator may not refuse a legitimate revision falling within the agreed requirements and permitted revision limit.</p>
              <p>After the permitted revision limit has been exhausted, further revisions require mutual agreement.</p>
            </Section>

            {/* Section 10 */}
            <Section id="analytics" icon={<Settings className="w-5 h-5" />} number="10" title="Analytics and Performance Data">
              <p>Crevio may use Creator insights, supported social-media integrations, Platform records, and other available analytics to monitor Campaign compliance and performance.</p>
              <p>Crevio may use such information to determine whether contractual conditions have been fulfilled.</p>
              <p>Crevio does not guarantee any particular views, reach, engagement, conversions, sales, revenue, audience response, return on investment, or other commercial result.</p>
              <p>Campaign performance ultimately depends on factors outside Crevio's control.</p>
            </Section>

            {/* Section 11 */}
            <Section id="automated" icon={<Zap className="w-5 h-5" />} number="11" title="Automated Execution and Platform Decisions">
              <p>Crevio may use automated systems to determine whether specified contractual conditions have been met and to initiate corresponding workflows.</p>
              <p>Crevio does not use automated functionality to create contractual obligations that were not agreed to by the Brand and Creator.</p>
              <p>Where a material technical error affects an automated process, Crevio may investigate, reverse the affected process where appropriate, and restart the relevant workflow from the point at which the error occurred.</p>
              <p>Significant or complex matters may be referred to Crevio's human review team.</p>
            </Section>

            {/* Section 12 */}
            <Section id="payments" icon={<DollarSign className="w-5 h-5" />} number="12" title="Payments and Funds">
              <div className="bg-muted/40 border rounded-xl p-4 mb-4 flex items-center gap-4">
                <div className="text-center px-4 py-2 bg-primary/10 rounded-lg border border-primary/20">
                  <p className="text-xs text-muted-foreground">Brand</p>
                </div>
                <div className="text-accent text-xl">→</div>
                <div className="text-center px-4 py-2 bg-accent/10 rounded-lg border border-accent/20">
                  <p className="text-xs text-muted-foreground">Crevio</p>
                </div>
                <div className="text-accent text-xl">→</div>
                <div className="text-center px-4 py-2 bg-green-500/10 rounded-lg border border-green-500/20">
                  <p className="text-xs text-muted-foreground">Creator</p>
                </div>
              </div>
              <p>The Brand must deposit the required Campaign Amount within the period specified by the applicable Contract.</p>
              <p>Crevio may temporarily hold such funds solely for the purpose of facilitating and executing the relevant Contract. This holding mechanism is not intended to constitute an escrow service unless expressly stated otherwise.</p>
              <p>The timing and conditions for payment to a Creator depend on the specific Contract and may be linked to Deliverables, milestones, approvals, publication, performance requirements, or other agreed conditions.</p>
              <p>A Creator may not withdraw held funds before the applicable release conditions are satisfied.</p>
            </Section>

            {/* Section 13 */}
            <Section id="fee" icon={<DollarSign className="w-5 h-5" />} number="13" title="Crevio Fee">
              <div className="bg-muted/40 border rounded-xl p-4 mb-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Fee Example</p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span>Campaign Amount</span><span className="font-mono">₹1,00,000</span></div>
                  <div className="flex justify-between text-accent"><span>Crevio Fee (2%)</span><span className="font-mono">₹2,000</span></div>
                  <div className="flex justify-between font-bold border-t pt-2 mt-2"><span>Total Brand Payment</span><span className="font-mono">₹1,02,000</span></div>
                </div>
              </div>
              <p>Crevio may charge a platform fee of 2% of the Campaign Amount, unless a different fee is expressly disclosed or agreed.</p>
              <p>The Crevio Fee is charged in addition to the Campaign Amount.</p>
              <p>Once the Brand and Creator have accepted the applicable Contract, the Crevio Fee is non-refundable, except where otherwise required by applicable law or expressly determined by Crevio.</p>
              <p>The Crevio Fee is separate from any Penalty or applicable tax.</p>
            </Section>

            {/* Section 14 */}
            <Section id="taxes" icon={<DollarSign className="w-5 h-5" />} number="14" title="Taxes and Payment-Related Charges">
              <p>Applicable taxes, statutory charges, withholding amounts, transaction charges, and other legally required amounts may be calculated, collected, deducted, or accounted for during payment processing.</p>
              <p>Crevio may issue applicable invoices, receipts, or other payment documentation where required.</p>
              <p>Users must provide accurate information necessary for payment and tax processing.</p>
            </Section>

            {/* Section 15 */}
            <Section id="cancellation" icon={<Ban className="w-5 h-5" />} number="15" title="Cancellation and Termination of Campaigns">
              <p>After a Contract has been accepted by both parties, neither party may unilaterally cancel the Campaign unless the Contract expressly permits such cancellation.</p>
              <p>Where the Contract permits cancellation, cancellation requires the agreement of both parties unless termination is otherwise permitted under these Terms due to a violation or other specified circumstance.</p>
              <p>Where a mutually agreed cancellation occurs, amounts properly refundable under the applicable Contract may be returned; applicable deductions may be made; and the Crevio Fee remains non-refundable once the Contract has been accepted.</p>
            </Section>

            {/* Section 16 */}
            <Section id="failed-payments" icon={<AlertTriangle className="w-5 h-5" />} number="16" title="Failed or Delayed Payments">
              <p>If a Brand fails to deposit the required amount within the specified timeframe, the relevant Contract may be terminated.</p>
              <p>A Campaign may not proceed until required payment conditions have been satisfied.</p>
              <p>Crevio is not responsible for payment failures caused by banks, payment processors, card networks, financial institutions, or other third parties.</p>
            </Section>

            {/* Section 17 - Penalties */}
            <Section id="penalties" icon={<Gavel className="w-5 h-5" />} number="17" title="Penalties and Enforcement">
              <p>A User who violates these Terms, Crevio guidelines, applicable Contract obligations, or applicable law may be subject to a Penalty.</p>
              <p>Unless otherwise specified, Penalties are calculated against the total Campaign Amount.</p>
              <p>Where multiple violations occur, applicable Penalties may stack.</p>
              <div className="mt-4 grid sm:grid-cols-2 gap-3">
                {penalties.map((p) => (
                  <div key={p.label} className="bg-muted/40 border rounded-xl p-3 flex items-center justify-between">
                    <span className="text-sm">{p.label}</span>
                    <span className={`font-mono font-bold text-sm ${p.color}`}>{p.rate}</span>
                  </div>
                ))}
              </div>
              <p className="mt-4">For example, a 1% late-delivery Penalty combined with a 5% Contract-violation Penalty may result in a total Penalty of 6% of the Campaign Amount.</p>
              <p>Crevio may update its Platform rules and Penalty schedule where reasonably necessary, subject to applicable law and appropriate notice.</p>
            </Section>

            {/* Section 18 */}
            <Section id="prohibited" icon={<Ban className="w-5 h-5" />} number="18" title="Prohibited Conduct">
              <p>Users must not use Crevio for or in connection with illegal activities; fraud; identity theft or impersonation; fraudulent payment activity; fake Campaigns; fake engagement or analytics; manipulation of performance data; copyright or intellectual-property infringement; misleading or deceptive conduct; harassment or abuse; unauthorized access; security attacks; malicious software; circumvention of Crevio's payment mechanisms; deliberate off-platform payment circumvention; or any activity prohibited by applicable law or Crevio guidelines.</p>
              <p>Serious or repeated violations may result in permanent termination.</p>
            </Section>

            {/* Section 19 */}
            <Section id="off-platform" icon={<Globe className="w-5 h-5" />} number="19" title="Off-Platform Transactions">
              <p>Users may communicate independently outside Crevio.</p>
              <p>Users must not intentionally move a Campaign payment outside Crevio where doing so violates applicable Platform rules.</p>
              <p>A violation may result in suspension, Penalties, termination, or other appropriate action.</p>
              <p>Crevio is not responsible for any loss, fraud, dispute, payment failure, contractual disagreement, or other consequence arising from transactions or arrangements voluntarily conducted outside the Platform.</p>
            </Section>

            {/* Section 20 */}
            <Section id="disputes" icon={<Scale className="w-5 h-5" />} number="20" title="Disputes and Crevio Review">
              <p>Crevio is designed to resolve Campaign-related issues primarily through recorded Platform information and analytics rather than verbal disputes.</p>
              <p>Crevio may rely on Contract terms; Campaign information; Deliverable records; analytics; timestamps; publication information; monitoring records; payment records; supported social-media data; Platform activity; and other information recorded through the Services.</p>
              <p>Crevio may make the final Platform-level determination regarding whether applicable Contract or Platform conditions have been satisfied.</p>
              <p>Most disputes may be resolved through automated systems. Where a matter is significant, complex, or unsuitable for automated resolution, Crevio may refer it to its human review team.</p>
              <p>An appeal may be considered where there is a credible indication that a material Crevio rule was violated, relevant information was not properly observed, or a material system error affected the decision.</p>
            </Section>

            {/* Section 21 */}
            <Section id="funds-disputes" icon={<DollarSign className="w-5 h-5" />} number="21" title="Funds During Disputes">
              <p>Where a dispute or review may affect payment, Crevio may temporarily hold the relevant funds until an appropriate determination has been made.</p>
              <p>Following resolution, funds may be released to the Creator; returned to the Brand; reduced by applicable Penalties; distributed according to the Contract; or otherwise handled in accordance with these Terms and applicable law.</p>
            </Section>

            {/* Section 22 */}
            <Section id="ip" icon={<Shield className="w-5 h-5" />} number="22" title="Intellectual Property and Content Rights">
              <p>Unless expressly agreed otherwise, Creators retain ownership of content they create.</p>
              <p>A Brand receives rights to use Creator content only to the extent agreed between the Brand and Creator. Such rights may include commercial use, advertising use, exclusivity, duration, territory, platforms, or other permissions.</p>
              <p>Crevio may facilitate, record, monitor, or provide access to such rights where authorized, but Crevio does not acquire ownership of Creator content merely because that content is uploaded, stored, processed, or monitored through the Platform.</p>
              <p>Crevio may access and process content to the extent reasonably necessary to provide the Services and perform Platform functions.</p>
            </Section>

            {/* Section 23 */}
            <Section id="third-party" icon={<Globe className="w-5 h-5" />} number="23" title="Third-Party Platforms">
              <p>Crevio may integrate with third-party platforms, including YouTube, Instagram, TikTok, Facebook, X, and other supported services.</p>
              <p>Crevio does not control third-party platforms and is not responsible for their policies, API limitations, outages, account restrictions, data changes, algorithm changes, or other actions.</p>
              <p>Where a third-party outage or API issue materially affects Campaign monitoring, affected Campaign functionality may be temporarily paused until the relevant issue is resolved.</p>
            </Section>

            {/* Section 24 */}
            <Section id="suspension" icon={<Ban className="w-5 h-5" />} number="24" title="Suspension and Account Termination">
              <p>Crevio may suspend or terminate an account where it reasonably determines that the User has engaged in illegal activity; serious violations; repeated violations; fraud; material Contract violations; prohibited activity; or conduct presenting significant risk to Crevio or its Users.</p>
              <p>During an investigation, affected Campaign and Contract activities may be frozen.</p>
              <p>Where an account is terminated, active Campaigns may be frozen or terminated and outstanding funds may be handled according to the applicable Contract, Crevio guidelines, Penalties, and applicable law.</p>
              <p>A permanently terminated User may not create another account to circumvent the termination.</p>
            </Section>

            {/* Section 25 */}
            <Section id="technical" icon={<Zap className="w-5 h-5" />} number="25" title="Technical Issues and Platform Availability">
              <p>Crevio may periodically experience maintenance, updates, outages, bugs, technical failures, or interruptions.</p>
              <p>Where a major technical fault materially affects the execution of a Campaign, affected Campaign activity may be paused.</p>
              <p>If a major Crevio technical failure prevents proper execution of a transaction involving held funds, the relevant funds may be refunded as soon as reasonably practicable.</p>
              <p>Crevio does not guarantee uninterrupted, error-free, or continuously available Services.</p>
            </Section>

            {/* Section 26 */}
            <Section id="guarantee" icon={<AlertTriangle className="w-5 h-5" />} number="26" title="No Guarantee of Results">
              <p>Crevio provides infrastructure for managing and executing Brand-Creator Contracts.</p>
              <p>Crevio does not guarantee Creator performance; Brand performance; Campaign success; engagement; reach; conversions; sales; revenue; audience growth; profitability; return on investment; or any other commercial outcome.</p>
              <p>A Brand and Creator independently decide whether to enter into a Campaign and are responsible for their respective business and contractual decisions.</p>
            </Section>

            {/* Section 27 */}
            <Section id="privacy" icon={<Shield className="w-5 h-5" />} number="27" title="Privacy and Data">
              <p>Crevio's collection, use, storage, and processing of personal information are governed by the <Link to="/privacy-policy" className="text-primary underline underline-offset-2 hover:no-underline">Crevio Privacy Policy</Link>, which forms part of the legal framework governing use of the Platform.</p>
              <p>By using Crevio, you acknowledge that certain information may be processed for identity verification, Contract execution, analytics, monitoring, payment processing, fraud prevention, security, and other legitimate Platform functions, subject to the Privacy Policy and applicable law.</p>
            </Section>

            {/* Section 28 */}
            <Section id="liability" icon={<AlertTriangle className="w-5 h-5" />} number="28" title="Limitation of Liability">
              <p>To the maximum extent permitted by applicable law, Crevio shall not be liable for indirect, incidental, special, consequential, punitive, or similar losses arising from or relating to Brand or Creator conduct; Campaign performance; lost profits or business opportunities; social-media performance; third-party platform failures; third-party payment failures; content disputes; intellectual-property disputes between Users; off-platform transactions; social-media account restrictions; third-party API changes; or circumstances outside Crevio's reasonable control.</p>
              <p>Nothing in these Terms excludes or limits liability that cannot lawfully be excluded or limited under applicable law.</p>
            </Section>

            {/* Section 29 */}
            <Section id="indemnification" icon={<Scale className="w-5 h-5" />} number="29" title="Indemnification">
              <p>To the maximum extent permitted by applicable law, you agree to indemnify and hold harmless Crevio, its affiliates, officers, employees, contractors, and service providers against claims, liabilities, losses, damages, costs, and expenses arising from your breach of these Terms; your violation of applicable law; your breach of a Brand-Creator Contract; your content or materials; infringement of third-party rights; fraudulent or misleading conduct; misuse of the Platform; or unauthorized use of another person's information or intellectual property.</p>
            </Section>

            {/* Section 30 */}
            <Section id="modifications" icon={<Settings className="w-5 h-5" />} number="30" title="Modifications to the Platform and These Terms">
              <p>Crevio may modify, update, suspend, or discontinue Platform features, integrations, functionality, or Services where reasonably necessary for operational, technical, security, legal, or business reasons.</p>
              <p>Crevio may also amend these Terms from time to time. The updated Terms will identify the applicable Effective Date or Last Updated date.</p>
              <p>Where required by law, Crevio will provide appropriate notice of material changes.</p>
              <p>Continued use of the Platform after the effective date of updated Terms constitutes acceptance of the revised Terms to the extent permitted by applicable law.</p>
            </Section>

            {/* Section 31 */}
            <Section id="electronic" icon={<FileText className="w-5 h-5" />} number="31" title="Electronic Acceptance">
              <p>Electronic acceptance through the Platform—including clicking "Accept," "Agree," "Accept Contract," or a similar confirmation—may constitute legally binding acceptance where permitted by applicable law.</p>
              <p>Crevio may retain electronic records of Contract acceptance; Contract modifications; approvals; timestamps; Campaign activity; payment events; and other relevant Platform actions.</p>
              <p>Such records may be used to establish the history of a User's activity and acceptance.</p>
            </Section>

            {/* Section 32 */}
            <Section id="governing" icon={<Scale className="w-5 h-5" />} number="32" title="Governing Law and Dispute Resolution">
              <p>These Terms shall be governed by the applicable laws of India.</p>
              <p>Any dispute arising out of or relating to these Terms, the Platform, or the Services shall be subject to the dispute-resolution mechanism and jurisdiction specified by Crevio in its final legal configuration.</p>
              <p className="text-xs text-muted-foreground italic">[Insert final state/city jurisdiction and arbitration/mediation provisions before publication.]</p>
            </Section>

            {/* Section 33 */}
            <Section id="general" icon={<FileText className="w-5 h-5" />} number="33" title="General Provisions">
              <p>If any provision of these Terms is determined to be invalid or unenforceable, the remaining provisions will continue to apply to the fullest extent permitted by law.</p>
              <p>Failure by Crevio to enforce any provision does not constitute a waiver of its right to enforce that provision later.</p>
              <p>These Terms, together with the Privacy Policy, applicable Contracts, and other terms expressly incorporated into the Platform, constitute the agreement governing your use of Crevio.</p>
            </Section>

            {/* Section 34 - Contact */}
            <Section id="contact" icon={<Mail className="w-5 h-5" />} number="34" title="Contact">
              <div className="bg-muted/40 border rounded-xl p-4">
                <p className="text-sm">
                  <strong>Crevio</strong><br/>
                  Legal Entity: [Legal Entity Name]<br/>
                  Registered Address: [Registered Address]<br/>
                  Website: [Crevio Website]<br/>
                  Legal Email: admin@crevio.co.in<br/>
                  Support Email: admin@crevio.co.in<br/>
                  Country: India
                </p>
              </div>
            </Section>

            {/* Important Notice */}
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-2xl p-6">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-yellow-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-yellow-400 mb-2">Important Legal Notice</p>
                  <p className="text-sm text-muted-foreground">This document is a business/legal drafting framework based on the operating rules provided for Crevio. Before publishing it as a legally binding agreement, it should be reviewed by a qualified lawyer in India. In particular, the final legal review should verify Crevio's payment-holding structure, tax treatment, penalty enforceability, electronic contracting mechanism, data/privacy obligations, limitation of liability, and dispute-resolution provisions. Unresolved legal-entity information is intentionally retained as placeholders.</p>
                </div>
              </div>
            </div>

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
            <Link to="/terms" className="hover:text-foreground transition-colors font-medium text-foreground">Terms of Service</Link>
            <Link to="/privacy-policy" className="hover:text-foreground transition-colors">Privacy Policy</Link>
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
