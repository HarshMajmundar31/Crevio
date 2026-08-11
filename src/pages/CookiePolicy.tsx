import { LogoIcon } from "@/components/LogoIcon";
import { ArrowLeft, Cookie, Settings, Eye, Shield, ToggleLeft, Mail } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const sections = [
  { id: "what", title: "1. What Are Cookies?" },
  { id: "types", title: "2. Types of Cookies We Use" },
  { id: "essential", title: "3. Essential Cookies" },
  { id: "analytics-cookies", title: "4. Analytics Cookies" },
  { id: "functional", title: "5. Functional Cookies" },
  { id: "third-party-cookies", title: "6. Third-Party Cookies" },
  { id: "manage", title: "7. Managing Cookies" },
  { id: "changes", title: "8. Changes to This Policy" },
  { id: "contact", title: "9. Contact" },
];

const cookieTypes = [
  {
    category: "Essential",
    icon: <Shield className="w-5 h-5 text-blue-400" />,
    color: "border-blue-500/20 bg-blue-500/5",
    badge: "Always Active",
    badgeColor: "bg-blue-500/20 text-blue-400",
    description: "Required for the Platform to function. Cannot be disabled.",
    examples: ["Authentication tokens", "Session identifiers", "CSRF protection tokens", "Load balancer cookies"],
  },
  {
    category: "Analytics",
    icon: <Eye className="w-5 h-5 text-purple-400" />,
    color: "border-purple-500/20 bg-purple-500/5",
    badge: "Optional",
    badgeColor: "bg-purple-500/20 text-purple-400",
    description: "Help us understand how users interact with Crevio.",
    examples: ["Page view tracking", "Feature usage metrics", "Error reporting", "Performance monitoring"],
  },
  {
    category: "Functional",
    icon: <Settings className="w-5 h-5 text-orange-400" />,
    color: "border-orange-500/20 bg-orange-500/5",
    badge: "Optional",
    badgeColor: "bg-orange-500/20 text-orange-400",
    description: "Enable enhanced features and personalisation.",
    examples: ["Theme preferences (dark/light)", "Notification settings", "Dashboard layout preferences", "Language settings"],
  },
];

export default function CookiePolicy() {
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

      <div className="pt-24 pb-12 px-6 bg-gradient-to-br from-orange-600/10 via-amber-600/10 to-background border-b relative overflow-hidden">
        <div className="absolute inset-0 dot-pattern opacity-10" />
        <div className="max-w-4xl mx-auto relative z-10">
          <div className="inline-flex items-center gap-2 bg-orange-500/10 border border-orange-500/20 rounded-full px-4 py-2 mb-6">
            <Cookie className="w-4 h-4 text-orange-400" />
            <span className="text-sm font-medium text-orange-400">Cookie Policy</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4">Cookie Policy</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mb-6">
            How Crevio uses cookies and similar tracking technologies to provide, secure, and improve the Platform.
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

            <div className="glass-card p-6 rounded-2xl border border-orange-500/20 bg-orange-500/5">
              <p className="text-muted-foreground leading-relaxed">
                Crevio uses cookies and similar technologies (such as local storage and session storage) to provide, secure, and improve the Platform. This Cookie Policy explains what cookies are, which cookies we use, and how you can manage them. This policy should be read together with our <Link to="/privacy-policy" className="text-primary underline underline-offset-2">Privacy Policy</Link>.
              </p>
            </div>

            <Section id="what" icon={<Cookie className="w-5 h-5" />} number="1" title="What Are Cookies?">
              <p>Cookies are small text files placed on your device when you visit a website or web application. They allow the site to remember your actions and preferences over time so you do not have to re-enter them each time you visit or navigate between pages.</p>
              <p>Similar technologies include local storage, session storage, pixel tags, and device fingerprinting. This policy covers all such technologies used by Crevio.</p>
            </Section>

            <Section id="types" icon={<Settings className="w-5 h-5" />} number="2" title="Types of Cookies We Use">
              <div className="space-y-4">
                {cookieTypes.map((type) => (
                  <div key={type.category} className={`rounded-2xl border p-5 ${type.color}`}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        {type.icon}
                        <span className="font-semibold">{type.category} Cookies</span>
                      </div>
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${type.badgeColor}`}>{type.badge}</span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">{type.description}</p>
                    <div className="flex flex-wrap gap-2">
                      {type.examples.map((ex) => (
                        <span key={ex} className="text-xs bg-background/50 border rounded-full px-2.5 py-1">{ex}</span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </Section>

            <Section id="essential" icon={<Shield className="w-5 h-5" />} number="3" title="Essential Cookies">
              <p>Essential cookies are strictly necessary for the Platform to work. They enable core functionality such as user authentication, session management, and security protections. Without these cookies, the Platform cannot function properly.</p>
              <p>Essential cookies do not require your consent because they are necessary to provide the services you have requested. You cannot opt out of essential cookies while continuing to use the Platform.</p>
            </Section>

            <Section id="analytics-cookies" icon={<Eye className="w-5 h-5" />} number="4" title="Analytics Cookies">
              <p>Analytics cookies help us understand how users interact with Crevio — which pages are visited most, where users encounter issues, and how features perform. This information is used in aggregate and is not used to identify individual users.</p>
              <p>Where analytics cookies are optional, we will request your consent before placing them. You may withdraw your consent at any time through your browser or device settings.</p>
            </Section>

            <Section id="functional" icon={<ToggleLeft className="w-5 h-5" />} number="5" title="Functional Cookies">
              <p>Functional cookies enable enhanced functionality and personalisation on Crevio, such as remembering your theme preference (dark or light mode), notification settings, or dashboard layout choices.</p>
              <p>If you disable functional cookies, some features may not work as expected or your preferences may not be saved between sessions.</p>
            </Section>

            <Section id="third-party-cookies" icon={<Cookie className="w-5 h-5" />} number="6" title="Third-Party Cookies">
              <p>Crevio integrates with third-party services that may place their own cookies on your device. These third parties operate under their own privacy and cookie policies. Crevio does not control third-party cookies.</p>
              <div className="grid sm:grid-cols-2 gap-3 mt-3">
                {[
                  { name: "Clerk (Authentication)", purpose: "User sign-in and session management" },
                  { name: "Razorpay (Payments)", purpose: "Payment processing and fraud prevention" },
                  { name: "Cloudinary (Media)", purpose: "Image and video delivery" },
                  { name: "Analytics Provider", purpose: "Usage statistics and error tracking" },
                ].map((item) => (
                  <div key={item.name} className="bg-muted/40 border rounded-xl p-3">
                    <p className="text-xs font-semibold mb-1">{item.name}</p>
                    <p className="text-xs text-muted-foreground">{item.purpose}</p>
                  </div>
                ))}
              </div>
            </Section>

            <Section id="manage" icon={<Settings className="w-5 h-5" />} number="7" title="Managing Cookies">
              <p>You can manage, restrict, or delete cookies through your browser settings. Most browsers allow you to:</p>
              <ul className="list-none space-y-2 mt-2">
                {[
                  "View which cookies are stored and delete them individually.",
                  "Block all or specific types of cookies.",
                  "Set your browser to notify you when cookies are placed.",
                  "Clear all cookies when you close your browser.",
                ].map((item, i) => (
                  <li key={i} className="flex gap-3 text-sm">
                    <Settings className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-3">Disabling essential cookies will prevent you from logging in and using the Platform. Disabling optional cookies will not affect your ability to access core features.</p>
              <div className="bg-muted/40 border rounded-xl p-4 mt-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Browser Cookie Settings</p>
                <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                  {["Chrome", "Firefox", "Safari", "Edge"].map((b) => (
                    <span key={b} className="flex items-center gap-1.5"><Cookie className="w-3 h-3" /> {b}</span>
                  ))}
                </div>
              </div>
            </Section>

            <Section id="changes" icon={<Cookie className="w-5 h-5" />} number="8" title="Changes to This Cookie Policy">
              <p>We may update this Cookie Policy from time to time to reflect changes to the cookies we use or for other operational, legal, or regulatory reasons. The "Last Updated" date at the top of this page will reflect any changes. We encourage you to review this policy periodically.</p>
            </Section>

            <Section id="contact" icon={<Mail className="w-5 h-5" />} number="9" title="Contact">
              <p>For questions about our use of cookies, contact us at:</p>
              <div className="bg-muted/40 border rounded-xl p-4 mt-3">
                <p className="text-sm">Privacy Email: admin@crevio.co.in<br/>Support: admin@crevio.co.in</p>
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
            <Link to="/cookie-policy" className="hover:text-foreground transition-colors font-medium text-foreground">Cookies</Link>
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
