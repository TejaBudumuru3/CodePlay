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
  Check,
  Globe,
  Share2,
  Bookmark,
  Star,
  Layers,
  Cpu,
  Linkedin,
  Github,
  Mail,
  Rocket,
  Ghost,
  Sword,
  Terminal
} from "lucide-react";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";

const AnimatedText = ({ text, highlightStart = -1, delayOffset = 0 }: { text: string; highlightStart?: number; delayOffset?: number }) => {
  let charIndex = 0;
  return (
    <>
      {text.split(" ").map((word, wordIdx, array) => (
        <span key={wordIdx} className="inline-block whitespace-nowrap">
          {word.split("").map((char, charIdx) => {
            const currentIdx = charIndex++;
            const isHighlighted = highlightStart !== -1 && currentIdx >= highlightStart;
            return (
              <motion.span
                key={charIdx}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: delayOffset + currentIdx * 0.04 }}
                className={`inline-block ${isHighlighted ? "text-primary" : ""}`}
              >
                {char}
              </motion.span>
            );
          })}
          {wordIdx !== array.length - 1 && <span className="inline-block w-[0.25em]" />}
        </span>
      ))}
    </>
  );
};

const fadeInUp = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.8, ease: "easeOut" }
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.2
    }
  }
};

export default function LandingPage() {
  const { status } = useSession();
  const ctaHref = status === "authenticated" ? "/builder" : "/login";

  return (
    <div className="min-h-screen overflow-x-hidden bg-background text-foreground selection:bg-primary/20">
      {/* ═══ Navbar ═══ */}
      <header className="fixed top-4 md:top-6 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-5xl rounded-full bg-white/70 backdrop-blur-xl border border-white/40 shadow-xl shadow-indigo-500/10 transition-all duration-300">
        <div className="px-5 md:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-white text-white shadow-md shadow-indigo-500/20">
              <span className="font-bold text-lg tracking-tighter object-cover"><Image src="/logo.png" alt="Logo" width={100} height={100} /></span>
            </div>
            <span className="font-bold text-lg tracking-tight text-slate-800">CodePlay</span>
          </div>

          <div className="hidden md:flex gap-8 text-[12px] font-bold text-slate-500 tracking-wider uppercase">
            <Link href="#features" className="hover:text-indigo-600 transition-colors">Features</Link>
            <Link href="#how-it-works" className="hover:text-indigo-600 transition-colors">Technology</Link>
            <Link href="#about" className="hover:text-indigo-600 transition-colors">About</Link>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href={ctaHref}
              className="text-[13px] sm:text-sm font-medium text-slate-600 hover:text-primary transition-colors hidden sm:inline-flex"
            >
              {status === "authenticated" ? "" : "Log in"}
            </Link>
            <Link
              href={ctaHref}
              className="flex items-center gap-1 sm:gap-1.5 text-xs sm:text-sm px-4 sm:px-6 py-2 sm:py-2.5 rounded-full font-semibold transition-all duration-300
                bg-slate-900 text-white shadow-lg shadow-slate-900/20 whitespace-nowrap
                hover:bg-slate-800 hover:scale-[1.02] active:scale-[0.98]"
            >
              Get Started
              <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </Link>
          </div>
        </div>
      </header>

      {/* ═══ Hero Section ═══ */}
      <section className="relative min-h-[100dvh] lg:h-[100dvh] pt-[100px] pb-10 lg:pt-[80px] lg:pb-6 px-4 lg:px-8 max-w-full mx-auto flex flex-col justify-center overflow-hidden">
        <div className="w-full h-auto lg:h-full lg:max-h-[100%] bg-slate-50 rounded-[2.5rem] p-6 py-12 sm:p-10 lg:p-16 flex flex-col lg:flex-row items-center gap-8 lg:gap-12 xl:gap-12 relative overflow-hidden">

          {/* Left Content */}
          <div className="w-full cursor-default lg:w-[55%] xl:w-1/2 flex flex-col justify-center mt-4 lg:mt-15 z-10 shrink-0">
            <motion.div
              variants={fadeInUp}
              initial="initial"
              animate="animate"
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-200/50 text-xs font-semibold text-slate-700 mb-6 w-fit"
            >
              <span className="bg-slate-800 text-white px-2.5 py-0.5 rounded-full text-[10px] uppercase tracking-wider">✦</span>
              From prompt to playable in minutes <ArrowRight className="w-3 h-3 ml-1" />
            </motion.div>

            <h1 className="text-4xl sm:text-5xl lg:text-5xl xl:text-6xl font-extrabold text-slate-800 tracking-tight leading-[1.1] mb-6 block">
              <AnimatedText text="Build Your Game" />
              <br className="hidden lg:block" />
              <span className="inline-block lg:hidden">&nbsp;</span>
              <AnimatedText text="Faster with CodePlay" highlightStart={12} delayOffset={15 * 0.04} />
            </h1>

            <motion.p
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 1 }}
              className="text-slate-500 text-base sm:text-lg max-w-xl mb-8 leading-relaxed font-medium"
            >
              Speed up your game build with our ultimate AI agents. Enjoy high-quality, single-file HTML5 games for a seamless, stunning experience.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.5, delay: 1.4, type: "spring", stiffness: 150 }}
              className="flex flex-wrap items-center gap-4 mb-8"
            >
              <Link
                href={ctaHref}
                className="flex items-center gap-2 px-6 py-3.5 bg-white text-slate-800 rounded-full font-bold shadow-sm border border-slate-200 hover:shadow-md hover:-translate-y-0.5 delay-100 duration-600 transition-all text-sm sm:text-base"
              >
                Get it now <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="#how-it-works"
                className="flex items-center gap-2 px-6 py-3.5 bg-slate-800 text-white rounded-full font-bold shadow-md hover:bg-slate-700 hover:-translate-y-0.5 delay-100 transition-all text-sm sm:text-base"
              >
                Learn more
              </Link>
            </motion.div>

            {/* Daily Credits Marketing Text */}
            <motion.div variants={fadeInUp} initial="initial" animate="animate" transition={{ delay: 0.4 }} className="text-xs font-medium text-slate-500 max-w-md hidden sm:block">
              <span className="text-primary font-bold">Daily Free Credits:</span> 5 for logged-in users, 2 as a guest! <br />
              <span className="text-indigo-600 font-bold italic">Pro Tier:</span> Higher reasoning, complex games & access to advanced models.
            </motion.div>
          </div>

          {/* Right Content / Game Cards Graphic */}
          <div className="hidden lg:flex w-full lg:w-[45%] xl:w-1/2 relative h-[450px] items-center justify-center shrink-0">
            <motion.div
              variants={fadeInUp}
              initial="initial"
              animate="animate"
              className="relative w-[380px] h-[380px] flex items-center justify-center scale-[0.8] xl:scale-100 origin-center">

              {/* Orbit ring */}
              <div className="absolute inset-0 rounded-full border border-white/5" />
              <div className="absolute inset-[15%] rounded-full border border-white/5 border-dashed" />

              {/* Center game card */}
              <motion.div
                animate={{ y: [-4, 4, -4] }}
                transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                className="relative z-10 w-[110px] sm:w-[140px] aspect-square rounded-3xl bg-gradient-to-br from-indigo-950 to-[#0D1117] border border-indigo-500/40 shadow-[0_0_60px_rgba(99,102,241,0.35)] flex flex-col items-center justify-center"
              >
                <Terminal className="w-10 h-10 sm:w-12 sm:h-12 text-indigo-400 mb-2 drop-shadow-[0_0_8px_rgba(99,102,241,0.8)]" />
                <span className="text-[8px] font-black text-indigo-300 uppercase tracking-widest text-center leading-tight">Game</span>
                <motion.div
                  className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-green-500 border-2 border-[#05071A] flex items-center justify-center"
                  animate={{ scale: [1, 1.3, 1] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                >
                  <span className="text-[6px] text-white font-black">✓</span>
                </motion.div>
              </motion.div>

              {/* Clarifier — top */}
              <motion.div
                animate={{ rotate: [0, 360] }}
                transition={{ repeat: Infinity, duration: 20, ease: "linear" }}
                className="absolute inset-0"
                style={{ transformOrigin: "center" }}
              >
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2">
                  <motion.div
                    animate={{ rotate: [360, 0] }}
                    transition={{ repeat: Infinity, duration: 20, ease: "linear" }}
                    className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-cyan-950/90 border border-cyan-500/40 shadow-[0_0_20px_rgba(6,182,212,0.3)] flex flex-col items-center justify-center"
                  >
                    <Layers className="w-5 h-5 text-cyan-400" />
                    <span className="text-[6px] font-black text-cyan-500 mt-0.5 uppercase">Clarifier</span>
                  </motion.div>
                </div>
              </motion.div>

              {/* Planner — right */}
              <motion.div
                animate={{ rotate: [90, 450] }}
                transition={{ repeat: Infinity, duration: 20, ease: "linear" }}
                className="absolute inset-0"
                style={{ transformOrigin: "center" }}
              >
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2">
                  <motion.div
                    animate={{ rotate: [-90, -450] }}
                    transition={{ repeat: Infinity, duration: 20, ease: "linear" }}
                    className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-indigo-950/90 border border-indigo-500/40 shadow-[0_0_20px_rgba(99,102,241,0.3)] flex flex-col items-center justify-center"
                  >
                    <Zap className="w-5 h-5 text-indigo-400" />
                    <span className="text-[6px] font-black text-indigo-500 mt-0.5 uppercase">Planner</span>
                  </motion.div>
                </div>
              </motion.div>

              {/* Coder — bottom */}
              <motion.div
                animate={{ rotate: [180, 540] }}
                transition={{ repeat: Infinity, duration: 20, ease: "linear" }}
                className="absolute inset-0"
                style={{ transformOrigin: "center" }}
              >
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2">
                  <motion.div
                    animate={{ rotate: [-180, -540] }}
                    transition={{ repeat: Infinity, duration: 20, ease: "linear" }}
                    className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-emerald-950/90 border border-emerald-500/40 shadow-[0_0_20px_rgba(16,185,129,0.3)] flex flex-col items-center justify-center"
                  >
                    <Cpu className="w-5 h-5 text-emerald-400" />
                    <span className="text-[6px] font-black text-emerald-500 mt-0.5 uppercase">Coder</span>
                  </motion.div>
                </div>
              </motion.div>

              {/* Reviewer — left */}
              <motion.div
                animate={{ rotate: [270, 630] }}
                transition={{ repeat: Infinity, duration: 20, ease: "linear" }}
                className="absolute inset-0"
                style={{ transformOrigin: "center" }}
              >
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2">
                  <motion.div
                    animate={{ rotate: [-270, -630] }}
                    transition={{ repeat: Infinity, duration: 20, ease: "linear" }}
                    className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-amber-950/90 border border-amber-500/40 shadow-[0_0_20px_rgba(245,158,11,0.3)] flex flex-col items-center justify-center"
                  >
                    <ShieldCheck className="w-5 h-5 text-amber-400" />
                    <span className="text-[6px] font-black text-amber-500 mt-0.5 uppercase">Reviewer</span>
                  </motion.div>
                </div>
              </motion.div>

            </motion.div>
          </div>

        </div>
      </section>

      {/* ═══ Feature Spotlight (Product Presentation) ═══ */}
      <section id="features" className="py-24 sm:py-32 bg-white relative">
        <motion.div
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ margin: "-100px" }}
          transition={{ duration: 0.8 }}
        >
          <div className="text-center pointer-events-none max-w-3xl mx-auto mb-20">
            <h2 className="text-primary font-bold tracking-wide uppercase text-sm mb-3">Limitless Possibilities</h2>
            <h3 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 mb-6">A Complete 2D Studio, <br />In Your Browser</h3>
            <p className="text-lg text-slate-600">No downloads or setup. Pure creativity powered by AI, optimized for web games.</p>
          </div>


          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="order-2 lg:order-1 relative">
              <div className="absolute inset-0 bg-gradient-to-tr from-sky-200 to-indigo-200 blur-3xl opacity-50 rounded-full"></div>
              <motion.div
                className="relative bg-slate-50 border border-slate-200 rounded-3xl p-2 shadow-2xl rotate-0 sm:rotate-[-2deg] hover:rotate-0 transition-transform duration-500 scale-[0.85] sm:scale-100 origin-center"
                whileHover={{ rotate: 0, scale: 1.02 }}
              >
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
              </motion.div>
            </div>

            <div className="order-1 lg:order-2 space-y-10">
              {[
                { icon: Wrench, title: "Production-Ready Code", desc: "Our models don't just prototype; they output clean, maintainable HTML, CSS, and JS using modern frameworks like Phaser 3.", color: "indigo" },
                { icon: Zap, title: "Instant Rendering", desc: "Preview your game side-by-side with your code instantly. No compilers or local environment setup required.", color: "purple" },
                { icon: ShieldCheck, title: "Enterprise-Grade AI", desc: "Powered by the latest LLMs (Gemini Pro, Claude 3.5 Sonnet) specifically fine-tuned for software architecture and logic.", color: "sky" }
              ].map((feature, i) => (
                <motion.div
                  key={feature.title}
                  className="flex gap-4 border-l border-slate-200 rounded-2xl shadow-xl p-4 hover:border-slate-300 hover:bg-slate-50 hover:-translate-y-1 active:scale-[0.98] delay-100 duration-500"
                  initial={{ opacity: 0, x: 30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{}}
                  transition={{ delay: i * 0.2, duration: 0.5 }}
                >
                  <div className={`w-12 h-12 rounded-xl bg-${feature.color}-100 text-${feature.color}-600 flex items-center justify-center shrink-0 shadow-inner`}>
                    <feature.icon className="w-6 h-6" />
                  </div>
                  <div className="pointer-events-none ">
                    <h4 className="text-xl font-bold text-slate-900 mb-2">{feature.title}</h4>
                    <p className="text-slate-600 leading-relaxed">{feature.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </section>

      <section id="how-it-works" className="py-24 sm:py-32 px-4 bg-white border-y border-slate-200 relative overflow-hidden">
        {/* Dynamic Background Elements for Glassmorphism Contrast */}
        <div className="absolute top-1/2 left-0 w-[500px] h-[500px] bg-indigo-200/40 rounded-full blur-[120px] -translate-y-1/2 -translate-x-1/2 pointer-events-none" />
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-cyan-200/30 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-0 right-[20%] w-[300px] h-[300px] bg-purple-200/30 rounded-full blur-[100px] pointer-events-none" />

        <div className="max-w-7xl mx-auto relative z-10">
          <motion.div
            className="text-center mb-16 relative"
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{}}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-indigo-600 font-bold tracking-widest uppercase text-xs mb-3">Our Technology</h2>
            <h3 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 mb-6 tracking-tight">A Multi-Agent Symphony</h3>
            <p className="text-slate-500 text-lg max-w-2xl mx-auto font-medium leading-relaxed">
              Behind the scenes, specialized AI agents act as your personal game studio, passing context seamlessly from concept to deployment.
            </p>
          </motion.div>

          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 relative max-w-7xl mx-auto"
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ margin: "-100px" }}
          >
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
              {
                icon: ShieldCheck,
                name: "The Reviewer",
                role: "Quality Assurance",
                traits: [
                  { label: "Bug Hunter", value: "Elite" },
                  { label: "Optimize", value: "Deep" },
                  { label: "Stability", value: "100%" },
                ],
                accent: "from-amber-400/40",
                iconColor: "text-amber-600",
                action: "Review & Refine Code",
                actionGradient: "group-hover:from-amber-400/40 group-hover:to-amber-500/50",
                ring: "group-hover:ring-amber-500/30",
              },
            ].map(({ icon: Icon, name, role, traits, accent, iconColor, action, actionGradient, ring }) => (
              <motion.div
                key={name}
                variants={fadeInUp}
                className={`group relative flex flex-col pt-10 pb-8 px-8 rounded-[40px] bg-white/10 backdrop-blur-[80px] border border-white/50 shadow-xl hover:-translate-y-3 transition-all duration-700 overflow-hidden items-center ring-0 ${ring}`}
              >
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
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ═══ Pricing Section ═══ */}
      <section id="pricing" className="py-24 sm:py-32 bg-slate-50 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-indigo-100/30 rounded-full blur-[120px] translate-x-1/2 -translate-y-1/2 pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-indigo-600 font-bold tracking-widest uppercase text-xs mb-3">Pricing</h2>
            <h3 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 mb-6">Choose Your Plan</h3>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">From hobbyists to professionals, we have a tier for your ambition.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Free Tier */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="bg-white rounded-[32px] p-8 border border-slate-200 shadow-sm flex flex-col hover:shadow-md transition-shadow"
            >
              <div className="mb-8">
                <h4 className="text-xl font-bold text-slate-900 mb-2">Free</h4>
                <p className="text-slate-500 text-sm">Perfect for trying out CodePlay.</p>
              </div>
              <div className="mb-8">
                <span className="text-4xl font-black text-slate-900">$0</span>
                <span className="text-slate-500 font-medium">/month</span>
              </div>
              <ul className="space-y-4 mb-10 flex-1 text-left">
                <li className="flex items-center gap-3 text-slate-600 text-sm">
                  <Check className="w-5 h-5 text-emerald-500 shrink-0" />
                  5 Daily Building Credits
                </li>
                <li className="flex items-center gap-3 text-slate-600 text-sm font-bold text-indigo-600">
                  <Check className="w-5 h-5 text-emerald-500 shrink-0" />
                  OpenRouter Free Models
                </li>
                <li className="flex items-center gap-3 text-slate-600 text-sm">
                  <Check className="w-5 h-5 text-emerald-500 shrink-0" />
                  Basic Game Architecture (Tier 1)
                </li>
                <li className="flex items-center gap-3 text-slate-600 text-sm">
                  <Check className="w-5 h-5 text-emerald-500 shrink-0" />
                  Export to Zip
                </li>
              </ul>
              <Link href={ctaHref} className="w-full py-4 rounded-2xl bg-slate-100 text-slate-900 font-bold text-center hover:bg-slate-200 transition-colors">
                Get Started
              </Link>
            </motion.div>

            {/* Pro Tier */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="bg-slate-900 rounded-[32px] p-8 border border-slate-800 shadow-xl flex flex-col relative overflow-hidden group"
            >
              <div className="absolute top-0 right-0 bg-indigo-500 text-white text-[10px] font-black uppercase tracking-widest px-4 py-1 rounded-bl-xl">Recommended</div>
              <div className="mb-8">
                <h4 className="text-xl font-bold text-white mb-2 text-left">Pro</h4>
                <p className="text-slate-400 text-sm text-left">For complex logic and high-end games.</p>
              </div>
              <div className="mb-8 text-left">
                <span className="text-4xl font-black text-white">Contact Us</span>
              </div>
              <ul className="space-y-4 mb-10 flex-1 text-left">
                <li className="flex items-center gap-3 text-slate-300 text-sm font-bold text-indigo-400">
                  <Check className="w-5 h-5 text-indigo-400 shrink-0" />
                  ✨ Pro Models
                </li>
                <li className="flex items-center gap-3 text-slate-300 text-sm">
                  <Check className="w-5 h-5 text-indigo-400 shrink-0" />
                  Complex Games
                </li>
                <li className="flex items-center gap-3 text-slate-300 text-sm">
                  <Check className="w-5 h-5 text-indigo-400 shrink-0" />
                  Deeper Reasoning & Refinement
                </li>
                <li className="flex items-center gap-3 text-slate-300 text-sm">
                  <Check className="w-5 h-5 text-indigo-400 shrink-0" />
                  Prioritized Build Pipeline
                </li>
                <li className="flex items-center gap-3 text-slate-300 text-sm">
                  <Check className="w-5 h-5 text-indigo-400 shrink-0" />
                  Premium Support
                </li>
              </ul>
              <button
                onClick={() => window.location.href = 'mailto:tejabudumuru3@gmail.com?subject=Inquiry%20for%20Pro%20Plan'}
                className="w-full py-4 rounded-2xl bg-indigo-600 text-white font-bold text-center hover:bg-indigo-500 transition-colors shadow-lg shadow-indigo-500/20 group-hover:scale-[1.02] active:scale-[0.98]"
              >
                Contact to Deal
              </button>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ═══ About Section ═══ */}
      <section id="about" className="py-24 sm:py-32 px-4 bg-slate-50/50 relative border-b border-slate-200">
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ margin: "-100px" }}
            transition={{ duration: 0.8 }}
          >
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-100 text-indigo-600 mb-8 border border-indigo-200/50 shadow-inner">
              <Brain className="w-8 h-8" />
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-6 tracking-tight">
              Driven by the love of games and AI.
            </h2>
            <p className="text-slate-600 text-lg leading-relaxed mb-6 font-medium">
              We built CodePlay because we believe creativity shouldn't be bottlenecked by boilerplate code. You have the imagination; our AI agents have the engineering speed.
            </p>
            <p className="text-slate-500 text-base leading-relaxed">
              By orchestrating leading Large Language Models—fine-tuned for specific software engineering roles—we're making high-quality, lightweight game development accessible to everyone, from hobbyists to professional studios prototyping their next big hit.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ margin: "-100px" }}
            transition={{ duration: 0.8 }}
            className="relative"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-300 to-cyan-300 rounded-[2.5rem] blur-2xl opacity-30 transform -rotate-6"></div>
            <div className="relative bg-white rounded-[2.5rem] p-6 sm:p-10 shadow-2xl border border-slate-100 hover:rotate-2 transition-transform duration-500 cursor-default">
              <div className="grid grid-cols-2 gap-4 sm:gap-8">
                <div>
                  <h4 className="text-3xl sm:text-4xl font-black text-indigo-600 mb-1 sm:mb-2">10x</h4>
                  <p className="text-[10px] sm:text-xs font-black text-slate-400 uppercase tracking-widest">Faster Dev</p>
                </div>
                <div>
                  <h4 className="text-3xl sm:text-4xl font-black text-cyan-500 mb-1 sm:mb-2">Zero</h4>
                  <p className="text-[10px] sm:text-xs font-black text-slate-400 uppercase tracking-widest">Setup</p>
                </div>
                <div>
                  <h4 className="text-3xl sm:text-4xl font-black text-emerald-500 mb-1 sm:mb-2">100%</h4>
                  <p className="text-[10px] sm:text-xs font-black text-slate-400 uppercase tracking-widest">Exportable</p>
                </div>
                <div>
                  <h4 className="text-2xl min-[360px]:text-3xl sm:text-4xl font-black text-amber-500 mb-1 sm:mb-2 tracking-tighter sm:tracking-normal">Infinite</h4>
                  <p className="text-[10px] sm:text-xs font-black text-slate-400 uppercase tracking-widest">Ideas</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="py-28 sm:py-36 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900"></div>
        {/* Decorative lights */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[100px]"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent/20 rounded-full blur-[100px]"></div>

        <motion.div
          className="relative z-10 max-w-4xl mx-auto text-center"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{}}
          transition={{ duration: 0.8 }}
        >
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
          <p className="mt-3 text-sm text-slate-400 font-medium">Guests receive 2 free credits daily, logged in users receive 5.</p>
        </motion.div>
      </section>

      {/* ═══ Footer ═══ */}
      <motion.footer
        className="border-t border-border bg-white py-12 px-4"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{}}
        transition={{ duration: 1 }}
      >
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-white text-white">
              <span className="font-bold text-[10px] tracking-tighter"><Image src="/logo.png" alt="Logo" width={100} height={100} /></span>
            </div>
            <span className="font-bold text-slate-800">CodePlay</span>
          </div>

          <div className="flex gap-6 items-center">
            <a href="https://www.linkedin.com/in/srinivas-sai-saran-teja-budumuru-15123a292/" className="text-slate-400 hover:text-indigo-600 transition-colors"><Linkedin className="w-5 h-5" /></a>
            <a href="https://github.com/TejaBudumuru3" className="text-slate-400 hover:text-slate-900 transition-colors"><Github className="w-5 h-5" /></a>
            <a href="https://teja-budumuru.vercel.app" className="text-slate-400 hover:text-indigo-600 transition-colors"><Globe className="w-5 h-5" /></a>
            <a href="mailto:tejabudumuru3@gmail.com" className="text-slate-400 hover:text-red-500 transition-colors"><Mail className="w-5 h-5" /></a>
          </div>

          <p className="text-sm font-medium text-slate-400">
            Describe it. Build it. Play it.
          </p>
        </div>
      </motion.footer>
    </div>
  );
}
