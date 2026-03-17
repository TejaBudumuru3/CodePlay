"use client";

import Link from "next/link";
import {
  Gamepad2,
  Sparkles,
  Brain,
  Wrench,
  Download,
  Zap,
  Code2,
  MessageSquare,
  ChevronRight,
  Play,
  ArrowRight,
  ShieldCheck,
  Globe,
  Share2,
  Bookmark,
  Star,
  Layers,
  Cpu
} from "lucide-react";
import Image from "next/image";
import { useSession } from "next-auth/react";

export default function LandingPage() {
  const { status } = useSession();
  const ctaHref = status === "authenticated" ? "/builder" : "/login";

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/20">
      {/* ═══ Navbar ═══ */}
      <header className="fixed top-0 left-0 right-0 z-50 glass-strong border-b-0 border-white/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-white text-white shadow-md shadow-indigo-500/20">
              <span className="font-bold text-lg tracking-tighter object-cover"><Image src="/logo.png" alt="Logo" width={100} height={100} /></span>
            </div>
            <span className="font-bold text-lg tracking-tight text-slate-800">CodePlay</span>
          </div>

          <div className="flex gap-6 text-sm font-medium text-slate-500">
            {/* Removed extra footer links to keep it simpler */}
          </div>

          <div className="flex items-center gap-3">
            <Link
              href={ctaHref}
              className="text-sm font-medium text-slate-600 hover:text-primary transition-colors hidden sm:inline-flex"
            >
              {status === "authenticated" ? "" : "Log in"}
            </Link>
            <Link
              href={ctaHref}
              className="flex items-center gap-1.5 text-sm px-6 py-2.5 rounded-full font-semibold transition-all duration-300
                bg-slate-900 text-white shadow-lg shadow-slate-900/20
                hover:bg-slate-800 hover:scale-[1.02] active:scale-[0.98]"
            >
              Get Started
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </header>

      {/* ═══ Hero Section ═══ */}
      <section className="relative pt-40 pb-20 sm:pt-48 sm:pb-32 lg:pt-56 lg:pb-40 px-4 overflow-hidden mesh-gradient">
        {/* Floating decorative elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-[10%] w-72 h-72 bg-indigo-400/10 rounded-full blur-3xl animate-float" />
          <div className="absolute bottom-40 right-[15%] w-96 h-96 bg-blue-400/10 rounded-full blur-3xl animate-float-slow" />
          <div className="absolute bottom-20 left-[40%] w-80 h-80 bg-violet-400/10 rounded-full blur-3xl animate-float-slow" />
        </div>

        <div className="relative max-w-5xl mx-auto text-center z-10">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/20 bg-primary/5 text-xs text-primary font-bold tracking-wide uppercase mb-8 shadow-sm animate-slide-up">
            <Sparkles className="w-3.5 h-3.5" />
            AI-Powered Game Generation
          </div>

          <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-[5.5rem] font-extrabold tracking-tight text-slate-900 leading-[1.05] mb-8 animate-slide-up"
            style={{ animationDelay: '0.1s' }}>
            Imagine a game. <br className="hidden sm:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 via-blue-500 to-sky-500">
              World's #1 Game Builder
            </span>
          </h1>

          <p className="text-lg sm:text-xl lg:text-2xl text-slate-600 max-w-3xl mx-auto mb-12 leading-relaxed font-medium animate-slide-up"
            style={{ animationDelay: '0.2s' }}>
            Just describe your idea in plain english, and watch our multi-agent architecture write, compile, and render your game right in your browser.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-slide-up"
            style={{ animationDelay: '0.3s' }}>
            <Link
              href={ctaHref}
              className="inline-flex items-center gap-2.5 px-8 py-4 rounded-full font-bold text-base transition-all duration-300
                bg-gradient-to-r from-indigo-600 to-blue-700 text-white
                shadow-xl shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:-translate-y-1 active:scale-[0.98]"
            >
              <Play className="w-5 h-5 fill-current" />
              Start Creating for Free
            </Link>
            <Link
              href="#how-it-works"
              className="flex items-center gap-2.5 px-8 py-4 rounded-full font-bold text-base transition-all duration-300
                bg-white border-2 border-slate-200 text-slate-700
                hover:border-slate-300 hover:bg-slate-50 hover:-translate-y-1 active:scale-[0.98] shadow-sm"
            >
              See How It Works
            </Link>
          </div>

          {/* Social Proof Placeholder */}
          <div className="mt-16 pt-10 border-t border-slate-200/60 animate-slide-up" style={{ animationDelay: '0.4s' }}>
            <p className="text-sm font-semibold text-slate-400 uppercase tracking-widest mb-6">Trusted by creators worldwide</p>
            <div className="flex justify-center gap-8 opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
              {/* Mock logos */}
              <Globe className="w-8 h-8 text-slate-800" />
              <Code2 className="w-8 h-8 text-slate-800" />
              <Gamepad2 className="w-8 h-8 text-slate-800" />
              <Zap className="w-8 h-8 text-slate-800" />
            </div>
          </div>
        </div>
      </section>

      {/* ═══ Feature Spotlight (Product Presentation) ═══ */}
      <section id="features" className="py-24 sm:py-32 bg-white relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <h2 className="text-primary font-bold tracking-wide uppercase text-sm mb-3">Limitless Possibilities</h2>
            <h3 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 mb-6">A Complete Studio, <br />In Your Browser</h3>
            <p className="text-lg text-slate-600">No downloads. No complicated UI. Just pure creativity backed by cutting-edge artificial intelligence.</p>
          </div>

          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="order-2 lg:order-1 relative">
              <div className="absolute inset-0 bg-gradient-to-tr from-sky-200 to-indigo-200 blur-3xl opacity-50 rounded-full"></div>
              <div className="relative bg-slate-50 border border-slate-200 rounded-3xl p-2 shadow-2xl rotate-0 sm:rotate-[-2deg] hover:rotate-0 transition-transform duration-500 scale-[0.85] sm:scale-100 origin-center">
                <div className="bg-white rounded-2xl overflow-hidden border border-slate-100 shadow-inner aspect-[4/3] flex flex-col">
                  <div className="h-10 border-b border-slate-100 flex items-center px-4 gap-2 bg-slate-50/50">
                    <div className="w-3 h-3 rounded-full bg-red-400"></div>
                    <div className="w-3 h-3 rounded-full bg-amber-400"></div>
                    <div className="w-3 h-3 rounded-full bg-green-400"></div>
                  </div>
                  <div className="flex-1 p-4 sm:p-6 font-mono text-[11px] sm:text-sm text-slate-600 bg-[#fafafc] overflow-hidden">
                    <span className="text-indigo-500">const</span> game = <span className="text-purple-500">new</span> Phaser.Game(config);<br /><br />
                    <span className="text-slate-400">// Automatically generated by AI</span><br />
                    <span className="text-sky-500">function</span> <span className="text-amber-500">create</span>() {'{'}<br />
                    &nbsp;&nbsp;this.add.image(400, 300, <span className="text-green-500">'sky'</span>);<br />
                    &nbsp;&nbsp;player = this.physics.add.sprite(100, 450, <span className="text-green-500">'dude'</span>);<br />
                    &nbsp;&nbsp;player.setBounce(0.2);<br />
                    &nbsp;&nbsp;player.setCollideWorldBounds(<span className="text-indigo-500">true</span>);<br />
                    {'}'}
                  </div>
                </div>
              </div>
            </div>

            <div className="order-1 lg:order-2 space-y-10">
              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0 shadow-inner">
                  <Wrench className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-xl font-bold text-slate-900 mb-2">Production-Ready Code</h4>
                  <p className="text-slate-600 leading-relaxed">Our models don't just prototype; they output clean, maintainable HTML, CSS, and JS using modern frameworks like Phaser 3.</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center shrink-0 shadow-inner">
                  <Zap className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-xl font-bold text-slate-900 mb-2">Instant Rendering</h4>
                  <p className="text-slate-600 leading-relaxed">Preview your game side-by-side with your code instantly. No compilers or local environment setup required.</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-xl bg-sky-100 text-sky-600 flex items-center justify-center shrink-0 shadow-inner">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-xl font-bold text-slate-900 mb-2">Enterprise-Grade AI</h4>
                  <p className="text-slate-600 leading-relaxed">Powered by the latest LLMs (Gemini Pro, Claude 3.5 Sonnet) specifically fine-tuned for software architecture and logic.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="py-24 sm:py-32 px-4 bg-white border-y border-slate-200 relative overflow-hidden">
        {/* Dynamic Background Elements for Glassmorphism Contrast */}
        <div className="absolute top-1/2 left-0 w-[500px] h-[500px] bg-indigo-200/40 rounded-full blur-[120px] -translate-y-1/2 -translate-x-1/2 pointer-events-none" />
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-cyan-200/30 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-0 right-[20%] w-[300px] h-[300px] bg-purple-200/30 rounded-full blur-[100px] pointer-events-none" />

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-16 relative">
            <h2 className="text-indigo-600 font-bold tracking-widest uppercase text-xs mb-3">Our Technology</h2>
            <h3 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 mb-6 tracking-tight">A Multi-Agent Symphony</h3>
            <p className="text-slate-500 text-lg max-w-2xl mx-auto font-medium leading-relaxed">
              Behind the scenes, specialized AI agents act as your personal game studio, passing context seamlessly from concept to deployment.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative max-w-6xl mx-auto">
            {[
              {
                icon: Layers,
                name: "The Clarifier",
                role: "Logic Architect",
                traits: [
                  { label: "Deduction", value: "High" },
                  { label: "Coherence", value: "Pure" },
                  { label: "Precision", value: "99%" },
                ],
                accent: "from-cyan-400/40",
                iconColor: "text-cyan-600",
                action: "Define Logic Architecture",
                actionGradient: "group-hover:from-cyan-400/40 group-hover:to-cyan-500/50",
                ring: "group-hover:ring-cyan-500/30",
              },
              {
                icon: Zap,
                name: "The Planner",
                role: "Systems Designer",
                traits: [
                  { label: "Scalability", value: "Lead" },
                  { label: "User Flow", value: "Expert" },
                  { label: "System Map", value: "Elite" },
                ],
                accent: "from-indigo-400/40",
                iconColor: "text-indigo-600",
                action: "Generate System Blueprint",
                actionGradient: "group-hover:from-indigo-400/40 group-hover:to-indigo-500/50",
                ring: "group-hover:ring-indigo-500/30",
              },
              {
                icon: Cpu,
                name: "The Coder",
                role: "Lead Engineer",
                traits: [
                  { label: "Multi-Stack", value: "Core" },
                  { label: "Efficiency", value: "Peak" },
                  { label: "Runtime Opt", value: "Fast" },
                ],
                accent: "from-emerald-400/40",
                iconColor: "text-emerald-600",
                action: "Build Game Engine",
                actionGradient: "group-hover:from-emerald-400/40 group-hover:to-emerald-500/50",
                ring: "group-hover:ring-emerald-500/30",
              },
            ].map(({ icon: Icon, name, role, traits, accent, iconColor, action, actionGradient, ring }) => (
              <div key={name} className={`group relative flex flex-col pt-10 pb-8 px-8 rounded-[40px] bg-white/10 backdrop-blur-[80px] border border-white/50 shadow-xl hover:-translate-y-3 transition-all duration-700 overflow-hidden items-center ring-0 ${ring}`}>
                {/* Internal Glow Bleed - Vibrant & Designer Grade */}
                <div className={`absolute bottom-0 left-0 right-0 h-2/3 bg-gradient-to-t ${accent} to-transparent blur-[80px] opacity-30 group-hover:opacity-70 transition-opacity duration-700`} />

                {/* Avatar / Icon Bubble */}
                <div className="w-20 h-20 rounded-full flex items-center justify-center bg-white/80 shadow-[0_8px_25px_rgba(0,0,0,0.05)] mb-6 relative z-10 border-[4px] border-white ring-1 ring-slate-100 group-hover:scale-110 transition-transform duration-500">
                  <Icon className={`w-9 h-9 ${iconColor} group-hover:rotate-12 transition-transform duration-500`} />
                </div>

                {/* Identity */}
                <div className="mb-6 relative z-10 text-center">
                  <h4 className="text-xl font-black text-slate-900 tracking-tight mb-1">{name}</h4>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">{role}</p>
                </div>

                {/* Traits Grid */}
                <div className="w-full grid grid-cols-3 gap-0 py-5 border-y border-slate-900/5 mb-7 relative z-10">
                  {traits.map((trait, idx) => (
                    <div key={trait.label} className={`text-center ${idx === 1 ? 'border-x border-slate-900/5' : ''}`}>
                      <div className="text-xs font-black text-slate-900 mb-0.5">{trait.value}</div>
                      <div className="text-[8px] text-slate-400 uppercase font-black tracking-widest leading-none">{trait.label}</div>
                    </div>
                  ))}
                </div>

                {/* Integrated Action Area - Glassy Gradient */}
                <div className={`w-full py-4 px-6 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/20 flex items-center justify-center text-center relative z-10 transition-all duration-500 bg-gradient-to-br from-transparent to-transparent ${actionGradient} group-hover:shadow-lg active:scale-95`}>
                  <span className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-800 transition-transform duration-500 group-hover:scale-105">
                    {action}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ CTA Section ═══ */}
      <section className="py-28 sm:py-36 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900"></div>
        {/* Decorative lights */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[100px]"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent/20 rounded-full blur-[100px]"></div>

        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white mb-6">
            Stop dreaming. Start building.
          </h2>
          <p className="text-xl text-slate-300 mb-12 max-w-2xl mx-auto">
            Turn your imagination into reality. Get full access for free today and start playing with your ideas.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href={ctaHref}
              className="flex items-center justify-center gap-2.5 px-10 py-5 rounded-full font-bold text-lg transition-all duration-300
                bg-gradient-to-r from-indigo-600 to-blue-700 text-white
                hover:shadow-[0_0_40px_rgba(99,102,241,0.4)] hover:-translate-y-1 active:scale-[0.98]"
            >
              Start Building Now
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
          <p className="mt-8 text-sm text-slate-400 font-medium">No credit card required. Free tier includes Gemini 3.1 Pro access.</p>
        </div>
      </section>

      {/* ═══ Footer ═══ */}
      <footer className="border-t border-border bg-white py-12 px-4">
        <div className="max-w-7xl mx-auto flex flex-col items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-white text-white">
              <span className="font-bold text-[10px] tracking-tighter"><Image src="/logo.png" alt="Logo" width={100} height={100} /></span>
            </div>
            <span className="font-bold text-slate-800">CodePlay</span>
          </div>
          <p className="text-sm font-medium text-slate-400">
            Powered by modern AI Agents.
          </p>
        </div>
      </footer>
    </div>
  );
}
