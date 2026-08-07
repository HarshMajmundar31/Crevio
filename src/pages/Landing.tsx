import { Navigate, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LogoIcon } from '@/components/LogoIcon';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import {
  Shield, Zap, Lock, Eye, ArrowRight, CheckCircle2,
  BarChart3, Globe, Users, FileText, Activity, Star,
  TrendingUp, Award, Sparkles, Briefcase, ClipboardCheck,
  Scale, Layers, CheckCircle
} from 'lucide-react';

const corePillars = [
  {
    icon: FileText,
    title: 'Contract Fulfillment',
    subtitle: 'Automated & Guaranteed',
    description: 'Lock campaign milestones with immutable digital terms. Payments and approvals release automatically when verified criteria are met.',
    badge: 'Trust Engine',
    color: 'from-purple-500 to-pink-500'
  },
  {
    icon: Briefcase,
    title: 'Campaign Marketplace',
    subtitle: 'Structured Briefs',
    description: 'Brands post detailed campaign briefs with explicit budgets, required deliverables, platform channels, and submission deadlines.',
    badge: 'Brand Hub',
    color: 'from-orange-500 to-amber-500'
  },
  {
    icon: Users,
    title: 'Creator Marketplace',
    subtitle: 'Direct Portfolio Match',
    description: 'Browse verified content creators by niche, engagement metrics, and channel statistics. Apply directly with custom proposals.',
    badge: 'Creator Hub',
    color: 'from-pink-500 to-rose-500'
  },
  {
    icon: Scale,
    title: 'Trust & Compliance',
    subtitle: 'AI Decision Engine',
    description: 'Machine learning rule engine checks deliverable submissions, maintains immutable audit trails, and handles dispute verification.',
    badge: 'Compliance',
    color: 'from-indigo-500 to-purple-500'
  },
];

const features = [
  { 
    icon: Lock, 
    title: 'Immutable Contracts', 
    description: 'Contract locking ensures neither party can alter terms, deliverables, or budget after agreement acceptance.',
    color: 'from-blue-500 to-cyan-500'
  },
  { 
    icon: Zap, 
    title: 'Automated Milestone Release', 
    description: 'Smart engine evaluates submitted content against contract criteria and unlocks milestone releases automatically.',
    color: 'from-purple-500 to-pink-500'
  },
  { 
    icon: Eye, 
    title: 'Live Campaign Monitoring', 
    description: 'Track application status, contract states, and deliverable submissions in real-time on a centralized dashboard.',
    color: 'from-orange-500 to-red-500'
  },
  { 
    icon: BarChart3, 
    title: 'AI Compliance Checker', 
    description: 'Automated verification scans deliverables for contract requirements, campaign tags, and guideline compliance.',
    color: 'from-green-500 to-emerald-500'
  },
  { 
    icon: Globe, 
    title: 'Multi-Platform Operations', 
    description: 'Unified management across Instagram, YouTube, TikTok, and cross-platform creator campaigns.',
    color: 'from-indigo-500 to-blue-500'
  },
  { 
    icon: Shield, 
    title: 'Complete Audit Log', 
    description: 'Every contract update, approval, and decision is recorded with cryptographic timestamps for total accountability.',
    color: 'from-pink-500 to-rose-500'
  },
];

const platformBenefits = [
  {
    target: 'For Brands',
    title: 'Full Transparency & Value',
    items: [
      'Publish detailed campaign briefs with clear milestone terms',
      'Select qualified creators with verified audience profiles',
      'Pay only when deliverable milestones are verified and approved',
      'Complete legal contract history stored securely'
    ],
    gradient: 'from-purple-600/20 to-pink-600/20 border-purple-500/30'
  },
  {
    target: 'For Creators',
    title: 'Guaranteed Terms & Security',
    items: [
      'Browse active campaign briefs matching your creative niche',
      'Submit structured proposals and negotiate terms upfront',
      'Enjoy locked contracts—no surprise scope creep or term changes',
      'Transparent status updates on milestone approvals'
    ],
    gradient: 'from-orange-600/20 to-pink-600/20 border-orange-500/30'
  }
];

export default function Landing() {
  const navigate = useNavigate();
  const { isLoading, getRedirectPath } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="text-lg font-semibold">Loading Crevio...</h1>
          <p className="text-sm text-muted-foreground mt-2">Checking session state</p>
        </div>
      </div>
    );
  }

  const redirectPath = getRedirectPath();
  const isAuthenticated = redirectPath && redirectPath !== '/login' && redirectPath !== '/signup' && redirectPath !== '/choose-role';

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-xl border-b">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <LogoIcon className="w-10 h-10 shrink-0" />
            <div>
              <span className="text-xl font-bold">Crevio</span>
              <p className="text-[8px] text-muted-foreground uppercase tracking-wider -mt-0.5">Contract Engine</p>
            </div>
          </div>
          
          <div className="hidden md:flex items-center gap-8">
            <a href="#ecosystem" className="text-sm font-medium hover:text-primary transition-colors">Marketplace</a>
            <a href="#features" className="text-sm font-medium hover:text-primary transition-colors">Features</a>
            <a href="#how-it-works" className="text-sm font-medium hover:text-primary transition-colors">How it Works</a>
            <a href="#benefits" className="text-sm font-medium hover:text-primary transition-colors">Benefits</a>
          </div>

          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <Button className="gradient-primary text-primary-foreground font-semibold" onClick={() => navigate(redirectPath)}>
                Go to Dashboard
              </Button>
            ) : (
              <>
                <Button variant="ghost" onClick={() => navigate('/login')}>
                  Sign In
                </Button>
                <Button className="gradient-primary text-primary-foreground font-semibold" onClick={() => navigate('/signup')}>
                  Get Early Access
                </Button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6 relative overflow-hidden">
        <div className="absolute inset-0 gradient-mesh opacity-30" />
        <div className="absolute inset-0 dot-pattern opacity-20" />
        
        <div className="max-w-7xl mx-auto relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-4xl mx-auto"
          >
            <div className="inline-flex items-center gap-2 bg-accent/10 border border-accent/20 rounded-full px-4 py-2 mb-6">
              <Sparkles className="w-4 h-4 text-accent" />
              <span className="text-sm font-medium text-accent">Autonomous Contract & Collaboration Platform</span>
            </div>

            <h1 className="text-5xl md:text-7xl font-extrabold mb-6 leading-tight">
              Contract Fulfillment &
              <span className="block text-gradient bg-gradient-to-r from-accent via-secondary to-primary bg-clip-text text-transparent">
                Creator Marketplace
              </span>
            </h1>

            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed">
              Eliminate scope creep and delayed payments. Crevio connects brands and creators through structured campaign briefs, locked contracts, and automated deliverable verification.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
              <Button 
                size="lg" 
                className="gradient-accent text-accent-foreground font-semibold px-8 text-lg h-14"
                onClick={() => navigate('/signup')}
              >
                Get Started Free
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                className="px-8 text-lg h-14"
                onClick={() => navigate('/login')}
              >
                Explore Marketplace
                <Briefcase className="w-5 h-5 ml-2" />
              </Button>
            </div>

            <p className="text-sm text-muted-foreground">
              Bootstrap Platform Release • Built for Brands, Creators & Agencies
            </p>
          </motion.div>

          {/* Core Pillars Grid */}
          <motion.div
            id="ecosystem"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-20"
          >
            {corePillars.map((pillar, i) => (
              <div key={i} className="glass-card-elevated p-6 relative overflow-hidden group hover:border-accent/40 transition-all">
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${pillar.color} flex items-center justify-center`}>
                    <pillar.icon className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-[10px] font-semibold uppercase tracking-wider bg-accent/10 text-accent px-2.5 py-1 rounded-full border border-accent/20">
                    {pillar.badge}
                  </span>
                </div>
                <h3 className="text-lg font-bold mb-1">{pillar.title}</h3>
                <p className="text-xs text-accent font-medium mb-2">{pillar.subtitle}</p>
                <p className="text-xs text-muted-foreground leading-relaxed">{pillar.description}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Core Ecosystem Highlight */}
      <section className="py-16 px-6 bg-card/40 border-y">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="flex gap-4 items-start">
              <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center shrink-0">
                <ClipboardCheck className="w-5 h-5 text-white" />
              </div>
              <div>
                <h4 className="font-bold mb-1">Contract Fulfillment</h4>
                <p className="text-sm text-muted-foreground">Clear milestone tracking and verifiable deliverable sign-offs for every campaign.</p>
              </div>
            </div>

            <div className="flex gap-4 items-start">
              <div className="w-10 h-10 rounded-xl gradient-accent flex items-center justify-center shrink-0">
                <Users className="w-5 h-5 text-accent-foreground" />
              </div>
              <div>
                <h4 className="font-bold mb-1">Creator Marketplace</h4>
                <p className="text-sm text-muted-foreground">Browse verified creator profiles, audience stats, and application proposals.</p>
              </div>
            </div>

            <div className="flex gap-4 items-start">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-pink-500 to-purple-500 flex items-center justify-center shrink-0">
                <Briefcase className="w-5 h-5 text-white" />
              </div>
              <div>
                <h4 className="font-bold mb-1">Campaign Marketplace</h4>
                <p className="text-sm text-muted-foreground">Brands publish structured briefs with budget bounds and deliverable specifications.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-6 bg-muted/20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Platform Features</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Built to manage brand-creator partnerships with clarity, speed, and trust
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="glass-card-elevated p-8 group hover:shadow-2xl transition-all duration-300"
              >
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform`}>
                  <feature.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">How Crevio Works</h2>
            <p className="text-xl text-muted-foreground">Simple 3-step contract and campaign workflow</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { 
                step: '01', 
                title: 'Publish Campaign Brief', 
                desc: 'Brands specify requirements, platform deliverables, deadlines, and allocated budget in the Campaign Marketplace.' 
              },
              { 
                step: '02', 
                title: 'Match & Lock Agreement', 
                desc: 'Creators apply with custom proposals. Upon selection, terms are locked into an immutable digital contract.' 
              },
              { 
                step: '03', 
                title: 'Deliver & Fulfill', 
                desc: 'Creators upload content deliverables. AI Decision Engine verifies compliance and unlocks milestone approvals.' 
              },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.2 }}
                className="relative glass-card p-8"
              >
                <div className="text-5xl font-extrabold text-accent/20 mb-4">{item.step}</div>
                <h3 className="text-2xl font-bold mb-3">{item.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{item.desc}</p>
                {i < 2 && (
                  <ArrowRight className="hidden md:block absolute top-1/2 -right-4 w-8 h-8 text-accent/40 z-20" />
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Platform Benefits */}
      <section id="benefits" className="py-20 px-6 bg-muted/20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Designed for Both Sides of the Market</h2>
            <p className="text-xl text-muted-foreground">Empowering Brands and Creators with equal trust and transparency</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {platformBenefits.map((benefit, i) => (
              <div key={i} className={`glass-card p-8 border rounded-2xl bg-gradient-to-br ${benefit.gradient}`}>
                <span className="text-xs font-bold uppercase tracking-wider text-accent bg-accent/10 border border-accent/20 px-3 py-1 rounded-full mb-4 inline-block">
                  {benefit.target}
                </span>
                <h3 className="text-2xl font-bold mb-6">{benefit.title}</h3>
                <ul className="space-y-4">
                  {benefit.items.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-accent shrink-0 mt-0.5" />
                      <span className="text-sm text-foreground/90">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="gradient-hero rounded-3xl p-12 md:p-16 text-center text-primary-foreground relative overflow-hidden"
          >
            <div className="absolute inset-0 grid-pattern opacity-10" />
            <div className="relative z-10">
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                Start Managing Contracts with Total Clarity
              </h2>
              <p className="text-xl text-primary-foreground/80 mb-8 max-w-2xl mx-auto leading-relaxed">
                Join forward-thinking brands and creators building transparent partnerships on Crevio.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Button 
                  size="lg" 
                  className="bg-white text-primary hover:bg-white/90 font-semibold px-8 text-lg h-14"
                  onClick={() => navigate('/signup')}
                >
                  Get Early Access
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
                <Button 
                  size="lg" 
                  variant="outline"
                  className="border-white/20 text-white hover:bg-white/10 px-8 text-lg h-14"
                  onClick={() => navigate('/login')}
                >
                  Sign In
                </Button>
              </div>
              <p className="text-sm text-primary-foreground/60 mt-6">
                Bootstrap Release • Transparent Contract Management Platform
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <LogoIcon className="w-8 h-8 shrink-0" />
                <span className="font-bold text-lg">Crevio</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Autonomous Contract Execution & Creator Collaboration Engine
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Platform</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#ecosystem" className="hover:text-foreground">Campaign Marketplace</a></li>
                <li><a href="#ecosystem" className="hover:text-foreground">Creator Marketplace</a></li>
                <li><a href="#features" className="hover:text-foreground">Contract Fulfillment</a></li>
                <li><a href="#features" className="hover:text-foreground">Compliance Engine</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Ecosystem</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#benefits" className="hover:text-foreground">For Brands</a></li>
                <li><a href="#benefits" className="hover:text-foreground">For Creators</a></li>
                <li><a href="#how-it-works" className="hover:text-foreground">Workflow</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Legal & Trust</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground">Contract Security</a></li>
                <li><a href="#" className="hover:text-foreground">Terms of Service</a></li>
                <li><a href="#" className="hover:text-foreground">Privacy Policy</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} Crevio. All rights reserved.
            </p>
            <div className="flex items-center gap-4">
              <Activity className="w-5 h-5 text-muted-foreground" />
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
