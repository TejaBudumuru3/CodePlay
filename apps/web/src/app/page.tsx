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
  Star,
  Play,
  ArrowRight,
  ShieldCheck,
  Globe
} from "lucide-react";
import Image from "next/image";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/20">
      {/* ═══ Navbar ═══ */}
      <header className="fixed top-0 left-0 right-0 z-50 glass-strong border-b-0 border-white/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-white text-white shadow-md shadow-primary/20">
              <span className="font-bold text-lg tracking-tighter object-cover"><Image src="/logo.png" alt="Logo" width={100} height={100} /></span>
            </div>
            <span className="font-bold text-lg tracking-tight text-slate-800">CodPlay</span>
          </div>

          <div className="flex gap-6 text-sm font-medium text-slate-500">
            {/* Removed extra footer links to keep it simpler */}
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm font-medium text-slate-600 hover:text-primary transition-colors hidden sm:inline-flex"
            >
              Log in
            </Link>
            <Link
              href="/login"
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
          <div className="absolute top-20 left-[10%] w-72 h-72 bg-pink-400/10 rounded-full blur-3xl animate-float" />
          <div className="absolute top-40 right-[10%] w-96 h-96 bg-sky-400/10 rounded-full blur-3xl animate-float-delayed" />
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
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-purple-500 to-sky-500">
              Watch it come alive.
            </span>
          </h1>

          <p className="text-lg sm:text-xl lg:text-2xl text-slate-600 max-w-3xl mx-auto mb-12 leading-relaxed font-medium animate-slide-up"
            style={{ animationDelay: '0.2s' }}>
            Just describe your idea in plain english, and watch our multi-agent architecture write, compile, and render your game right in your browser.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-slide-up"
            style={{ animationDelay: '0.3s' }}>
            <Link
              href="/login"
              className="flex items-center gap-2.5 px-8 py-4 rounded-full font-bold text-base transition-all duration-300
                bg-gradient-to-r from-pink-500 to-purple-600 text-white
                shadow-xl shadow-pink-500/25 hover:shadow-pink-500/40 hover:-translate-y-1 active:scale-[0.98]"
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
              <div className="absolute inset-0 bg-gradient-to-tr from-sky-200 to-pink-200 blur-3xl opacity-50 rounded-full"></div>
              <div className="relative bg-slate-50 border border-slate-200 rounded-3xl p-2 shadow-2xl rotate-[-2deg] hover:rotate-0 transition-transform duration-500">
                <div className="bg-white rounded-2xl overflow-hidden border border-slate-100 shadow-inner aspect-[4/3] flex flex-col">
                  <div className="h-10 border-b border-slate-100 flex items-center px-4 gap-2 bg-slate-50/50">
                    <div className="w-3 h-3 rounded-full bg-red-400"></div>
                    <div className="w-3 h-3 rounded-full bg-amber-400"></div>
                    <div className="w-3 h-3 rounded-full bg-green-400"></div>
                  </div>
                  <div className="flex-1 p-6 font-mono text-sm text-slate-600 bg-[#fafafc]">
                    <span className="text-pink-500">const</span> game = <span className="text-purple-500">new</span> Phaser.Game(config);<br /><br />
                    <span className="text-slate-400">// Automatically generated by AI</span><br />
                    <span className="text-sky-500">function</span> <span className="text-amber-500">create</span>() {'{'}<br />
                    &nbsp;&nbsp;this.add.image(400, 300, <span className="text-green-500">'sky'</span>);<br />
                    &nbsp;&nbsp;player = this.physics.add.sprite(100, 450, <span className="text-green-500">'dude'</span>);<br />
                    &nbsp;&nbsp;player.setBounce(0.2);<br />
                    &nbsp;&nbsp;player.setCollideWorldBounds(<span className="text-pink-500">true</span>);<br />
                    {'}'}
                  </div>
                </div>
              </div>
            </div>

            <div className="order-1 lg:order-2 space-y-10">
              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-xl bg-pink-100 text-pink-600 flex items-center justify-center shrink-0 shadow-inner">
                  <Code2 className="w-6 h-6" />
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

      {/* ═══ The Pipeline (How It Works) ═══ */}
      <section id="how-it-works" className="py-24 sm:py-32 px-4 bg-slate-50 border-y border-slate-200">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-primary font-bold tracking-wide uppercase text-sm mb-3">Our Technology</h2>
            <h3 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 mb-4">A Multi-Agent Symphony</h3>
            <p className="text-slate-600 text-lg max-w-2xl mx-auto">
              Behind the scenes, specialized AI agents act as your personal game studio, passing context seamlessly from concept to deployment.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative max-w-5xl mx-auto">
            {/* Connector line for desktop */}
            <div className="hidden md:block absolute top-12 left-[15%] right-[15%] h-1 bg-gradient-to-r from-pink-300 via-purple-300 to-sky-300 rounded-full z-0" />

            {[
              {
                icon: Brain,
                step: "01",
                name: "The Clarifier",
                color: "text-pink-600",
                bg: "bg-pink-100",
                description: "Analyzes your raw idea to deduce implied mechanics, saving you from answering endless questions.",
              },
              {
                icon: Sparkles,
                step: "02",
                name: "The Planner",
                color: "text-purple-600",
                bg: "bg-purple-100",
                description: "Drafts a robust Game Design Document (GDD) and chooses the best framework logic for your title.",
              },
              {
                icon: Wrench,
                step: "03",
                name: "The Coder",
                color: "text-sky-600",
                bg: "bg-sky-100",
                description: "Translates the architecture into flawless code and wires up the UI, Physics, and Game Loop.",
              },
            ].map(({ icon: Icon, step, name, color, bg, description }) => (
              <div key={step} className="relative z-10 flex flex-col items-center text-center p-8 rounded-3xl bg-white border border-slate-200 shadow-xl shadow-slate-200/50 hover:-translate-y-2 transition-transform duration-300">
                <div className={`w-20 h-20 rounded-2xl flex items-center justify-center ${bg} ${color} mb-6 shadow-inner ring-4 ring-white`}>
                  <Icon className="w-10 h-10" />
                </div>
                <div className="text-sm font-bold text-slate-400 mb-2 uppercase tracking-widest">Step {step}</div>
                <h4 className="font-extrabold text-xl text-slate-900 mb-3">{name}</h4>
                <p className="text-slate-600 font-medium leading-relaxed">{description}</p>
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
              href="/login"
              className="flex items-center justify-center gap-2.5 px-10 py-5 rounded-full font-bold text-lg transition-all duration-300
                bg-gradient-to-r from-pink-500 to-purple-600 text-white
                hover:shadow-[0_0_40px_rgba(236,72,153,0.4)] hover:-translate-y-1 active:scale-[0.98]"
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
            <span className="font-bold text-slate-800">CodPlay</span>
          </div>
          <p className="text-sm font-medium text-slate-400">
            Powered by modern AI Agents.
          </p>
        </div>
      </footer>
    </div>
  );
}
