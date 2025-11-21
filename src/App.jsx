import React, { useEffect, useMemo, useRef, useState } from 'react'
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion'
import { Sun, Moon, Menu, ArrowRight, Sparkles, Leaf, ChevronRight, Mail, Phone, Check, Star, Play } from 'lucide-react'
import Spline from '@splinetool/react-spline'

// 3D: react-three-fiber/drei scene for particle garden and interactive blob
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Instances, Instance } from '@react-three/drei'
import * as THREE from 'three'

const BRAND = {
  name: 'Virleaf',
  primary: '#71A845',
}

function useTheme() {
  const [theme, setTheme] = useState(() =>
    typeof window !== 'undefined' ? localStorage.getItem('theme') || 'dark' : 'dark'
  )
  useEffect(() => {
    const root = document.documentElement
    if (theme === 'dark') root.classList.add('dark')
    else root.classList.remove('dark')
    localStorage.setItem('theme', theme)
  }, [theme])
  return { theme, setTheme }
}

function Navbar({ theme, setTheme }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="fixed top-0 inset-x-0 z-40">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/60 dark:bg-slate-900/50 backdrop-blur-md px-4 sm:px-6 py-3 shadow-lg shadow-black/5">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-[#71A845] to-emerald-500 grid place-items-center text-white shadow-md shadow-emerald-700/30">
              <Leaf className="h-5 w-5" />
            </div>
            <span className="font-semibold tracking-tight text-slate-900 dark:text-white">{BRAND.name}</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-slate-700 dark:text-slate-200">
            {['About', 'Services', 'Projects', 'Tech', 'Pricing', 'Contact'].map((l) => (
              <a key={l} href={`#${l.toLowerCase()}`} className="hover:text-[#71A845] transition-colors">{l}</a>
            ))}
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/60 dark:bg-slate-800/60 px-3 py-1.5 text-sm shadow-sm hover:shadow transition"
            >
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              <span>{theme === 'dark' ? 'Light' : 'Dark'}</span>
            </button>
          </div>
          <button className="md:hidden p-2 rounded-lg border border-white/10" onClick={() => setOpen((o) => !o)}>
            <Menu className="h-5 w-5" />
          </button>
        </div>
        <AnimatePresence>
          {open && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="md:hidden mt-2 rounded-2xl border border-white/10 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md p-4">
              <div className="flex flex-col gap-4 text-slate-800 dark:text-slate-200">
                {['About', 'Services', 'Projects', 'Tech', 'Pricing', 'Contact'].map((l) => (
                  <a key={l} href={`#${l.toLowerCase()}`} onClick={() => setOpen(false)} className="hover:text-[#71A845] transition-colors">{l}</a>
                ))}
                <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/60 dark:bg-slate-800/60 px-3 py-1.5 text-sm shadow-sm">
                  {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                  <span>{theme === 'dark' ? 'Light' : 'Dark'}</span>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

function MagneticButton({ children }) {
  const ref = useRef(null)
  const [pos, setPos] = useState({ x: 0, y: 0 })
  useEffect(() => {
    const el = ref.current
    const onMove = (e) => {
      const rect = el.getBoundingClientRect()
      const x = e.clientX - (rect.left + rect.width / 2)
      const y = e.clientY - (rect.top + rect.height / 2)
      setPos({ x: x * 0.2, y: y * 0.2 })
    }
    const reset = () => setPos({ x: 0, y: 0 })
    el.addEventListener('mousemove', onMove)
    el.addEventListener('mouseleave', reset)
    return () => {
      el.removeEventListener('mousemove', onMove)
      el.removeEventListener('mouseleave', reset)
    }
  }, [])
  return (
    <motion.button
      ref={ref}
      style={{ x: pos.x, y: pos.y }}
      className="relative inline-flex items-center gap-2 rounded-full bg-[#71A845] text-white px-6 py-3 shadow-[0_0_40px_rgba(113,168,69,0.5)] hover:shadow-[0_0_60px_rgba(113,168,69,0.7)] transition"
    >
      {children}
    </motion.button>
  )
}

function Hero3D() {
  // Spline hero object as per system instruction
  return (
    <div className="absolute inset-0 -z-10">
      <Spline scene="https://prod.spline.design/VyGeZv58yuk8j7Yy/scene.splinecode" style={{ width: '100%', height: '100%' }} />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/60 via-white/40 to-white/0 dark:from-slate-900/50 dark:via-slate-900/30" />
    </div>
  )
}

// Digital Garden - instanced spores reacting to cursor
function DigitalGarden({ scrollY }) {
  const count = 1200
  const positions = useMemo(() => new Float32Array(count * 3), [count])
  const scales = useMemo(() => new Float32Array(count), [count])
  const colors = useMemo(() => new Float32Array(count * 3), [count])
  const mouse = useRef(new THREE.Vector3(0, 0, 0))
  const group = useRef()

  useEffect(() => {
    // seed
    for (let i = 0; i < count; i++) {
      positions[i * 3 + 0] = (Math.random() - 0.5) * 20
      positions[i * 3 + 1] = (Math.random() - 0.5) * 10
      positions[i * 3 + 2] = (Math.random() - 0.5) * 15
      scales[i] = Math.random() * 0.08 + 0.02
      colors[i * 3 + 0] = 0.44
      colors[i * 3 + 1] = 0.66
      colors[i * 3 + 2] = 0.35
    }
  }, [count])

  useFrame((state) => {
    const t = state.clock.getElapsedTime()
    if (!group.current) return
    group.current.rotation.y = THREE.MathUtils.lerp(group.current.rotation.y, (scrollY.current / 2000) * Math.PI, 0.05)
    group.current.rotation.x = Math.sin(t * 0.05) * 0.05
  })

  return (
    <Canvas className="absolute inset-0 -z-20" camera={{ position: [0, 0, 8], fov: 60 }}>
      <ambientLight intensity={0.6} />
      <pointLight intensity={2} position={[5, 5, 5]} color={BRAND.primary} />
      <group ref={group}>
        <Instances limit={count}>
          <sphereGeometry args={[1, 8, 8]} />
          <meshBasicMaterial toneMapped={false} />
          {positions && Array.from({ length: count }).map((_, i) => (
            <Instance
              key={i}
              position={[positions[i * 3 + 0], positions[i * 3 + 1], positions[i * 3 + 2]]}
              scale={scales[i]}
              color={`rgb(${colors[i * 3 + 0] * 255}, ${colors[i * 3 + 1] * 255}, ${colors[i * 3 + 2] * 255})`}
            />
          ))}
        </Instances>
      </group>
      <OrbitControls enablePan={false} enableZoom={false} enableRotate={false} />
    </Canvas>
  )
}

function Hero({ theme, setTheme }) {
  const { scrollY } = useScroll()
  const scrollRef = useRef(0)
  useEffect(() => {
    return scrollY.on('change', (v) => (scrollRef.current = v))
  }, [scrollY])

  const y = useTransform(scrollY, [0, 600], [0, 50])
  const scale = useTransform(scrollY, [0, 600], [1, 0.96])

  return (
    <section className="relative overflow-hidden pt-28 pb-16 sm:pt-32 sm:pb-24">
      <Hero3D />
      <DigitalGarden scrollY={scrollRef} />
      <motion.div style={{ y, scale }} className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl">
          <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="text-5xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.05]">
            Software That Breaths.
          </motion.h1>
          <p className="mt-6 text-lg sm:text-xl text-slate-700 dark:text-slate-300 max-w-2xl">
            A software agency crafting living systems for ambitious brands. Fluid interfaces, resilient backends, and motion that feels organic.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <MagneticButton>
              Get a proposal <ArrowRight className="h-4 w-4" />
            </MagneticButton>
            <button className="group inline-flex items-center gap-2 rounded-full border border-slate-300/60 dark:border-white/10 px-6 py-3 text-slate-800 dark:text-slate-200 hover:border-[#71A845] transition">
              Watch reel <Play className="h-4 w-4 group-hover:scale-110 transition" />
            </button>
          </div>
          <div className="mt-8 flex items-center gap-6 text-slate-700/80 dark:text-slate-300/80">
            <div className="flex items-center gap-2"><Star className="h-4 w-4 text-yellow-400" /> Top-tier motion</div>
            <div className="flex items-center gap-2"><Sparkles className="h-4 w-4 text-[#71A845]" /> Design systems</div>
            <div className="flex items-center gap-2"><Leaf className="h-4 w-4 text-[#71A845]" /> Sustainable builds</div>
          </div>
        </div>
      </motion.div>
    </section>
  )
}

function BentoCard({ title, children }) {
  return (
    <div className="group relative rounded-2xl border border-white/10 bg-white/50 dark:bg-slate-900/60 backdrop-blur-md p-6 shadow-sm hover:shadow-[0_0_40px_rgba(113,168,69,0.25)] transition">
      <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition bg-[conic-gradient(from_0deg,rgba(113,168,69,0.0),rgba(113,168,69,0.4),rgba(113,168,69,0.0))]" />
      <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">{title}</h3>
      <div className="text-slate-700/90 dark:text-slate-300/90 text-sm leading-relaxed">{children}</div>
    </div>
  )
}

function Services() {
  const items = [
    { title: 'Product Strategy', text: 'Workshops, discovery, and crisp roadmaps that de-risk bold ideas.' },
    { title: 'Interface Engineering', text: 'World-class frontends with performance budgets and a11y baked in.' },
    { title: '3D & Motion', text: 'Three.js scenes, Spline assets, and cinematic micro-interactions.' },
    { title: 'Backend Systems', text: 'Fast APIs, queues, and observability. Built for scale.' },
    { title: 'Brand & Visuals', text: 'Design languages, variable typography, and illustration systems.' },
    { title: 'Growth & Analytics', text: 'Experimentation cadence, dashboards, and insights that compound.' },
  ]
  return (
    <section id="services" className="relative py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {items.map((it) => (
            <BentoCard key={it.title} title={it.title}>{it.text}</BentoCard>
          ))}
        </div>
      </div>
    </section>
  )
}

function About() {
  return (
    <section id="about" className="relative py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 grid md:grid-cols-2 gap-10 items-center">
        <div>
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white mb-4">Organic by design</h2>
          <p className="text-slate-700/90 dark:text-slate-300/90 leading-relaxed">
            We craft interfaces that feel alive — subtle physics, responsive detail, and considered performance. Every pixel pushes toward legibility and calm.
          </p>
        </div>
        <div className="relative aspect-[4/3] rounded-3xl overflow-hidden border border-white/10 bg-gradient-to-br from-emerald-300/20 to-emerald-600/10">
          {/* Interactive blob via CSS filter distortion */}
          <div className="absolute inset-0 flex items-center justify-center">
            <motion.div
              whileHover={{ scale: 1.05, filter: 'url(#gooey)' }}
              className="size-40 rounded-full bg-[radial-gradient(circle_at_30%_30%,#71A845,transparent_60%)] blur-2xl"
            />
          </div>
          <svg className="absolute inset-0 w-0 h-0">
            <filter id="gooey">
              <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="blur" />
              <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -7" result="goo" />
              <feBlend in="SourceGraphic" in2="goo" />
            </filter>
          </svg>
        </div>
      </div>
    </section>
  )
}

function Projects() {
  return (
    <section id="projects" className="relative py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          <div className="flex gap-6 min-w-max">
            {[1,2,3,4,5].map((i) => (
              <div key={i} className="relative w-[320px] h-[420px] rounded-3xl overflow-hidden border border-white/10 bg-gradient-to-br from-white/40 to-white/10 dark:from-slate-900/50 dark:to-slate-900/20 backdrop-blur-md shadow-lg">
                <div className="absolute inset-0 bg-[radial-gradient(600px_200px_at_50%_0%,rgba(113,168,69,0.25),transparent)]" />
                <div className="absolute inset-0 grid place-items-center text-slate-800 dark:text-slate-200">
                  <div className="text-center p-6">
                    <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/15 text-[#71A845]">
                      <Sparkles className="h-5 w-5" />
                    </div>
                    <h4 className="font-semibold mb-2">Case Study #{i}</h4>
                    <p className="text-sm opacity-80">Interactive platform with 30% conversion uplift through motion and clarity.</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

function TechMarquee() {
  const tech = ['Next.js', 'FastAPI', 'Three.js', 'Spline', 'Framer Motion', 'React Spring', 'Tailwind', 'MongoDB', 'Vercel', 'Docker']
  return (
    <section id="tech" className="relative py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="overflow-hidden">
          <div className="flex gap-10 animate-marquee whitespace-nowrap text-slate-700/80 dark:text-slate-300/80">
            {tech.concat(tech).map((t, i) => (
              <span key={i} className="text-sm sm:text-base">{t}</span>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

function Pricing() {
  const tiers = [
    { name: 'Seed', price: '8k', features: ['2-week sprint', 'MVP scope', 'Design + build'] },
    { name: 'Growth', price: '18k', features: ['6-week cycle', 'Full-stack', '3D + motion'] },
    { name: 'Enterprise', price: 'Custom', features: ['Partner model', 'Embedded team', 'SLAs + support'] },
  ]
  return (
    <section id="pricing" className="relative py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 grid md:grid-cols-3 gap-6">
        {tiers.map((t, i) => (
          <div key={t.name} className="relative rounded-3xl border border-white/10 bg-white/50 dark:bg-slate-900/50 p-6 backdrop-blur-md hover:scale-[1.02] transition shadow-lg">
            <div className="text-sm uppercase tracking-wide text-[#71A845] mb-2">{t.name}</div>
            <div className="text-4xl font-bold text-slate-900 dark:text-white mb-4">{t.price}</div>
            <ul className="space-y-2 text-slate-700/90 dark:text-slate-300/90">
              {t.features.map((f) => (
                <li key={f} className="flex items-center gap-2"><Check className="h-4 w-4 text-[#71A845]" /> {f}</li>
              ))}
            </ul>
            <button className="mt-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-[linear-gradient(135deg,rgba(113,168,69,0.2),transparent)] px-4 py-2 text-sm text-slate-900 dark:text-white">Start <ChevronRight className="h-4 w-4" /></button>
          </div>
        ))}
      </div>
    </section>
  )
}

function Contact() {
  return (
    <section id="contact" className="relative py-20">
      <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-white/10 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md p-8">
          <h3 className="text-2xl font-semibold text-slate-900 dark:text-white mb-6">Let’s build something alive</h3>
          <form className="space-y-6">
            <div className="relative">
              <input className="peer w-full rounded-xl border border-white/20 bg-transparent px-4 py-3 outline-none text-slate-900 dark:text-white placeholder-transparent focus:border-[#71A845]" placeholder="Your name" />
              <label className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 bg-transparent px-2 text-slate-500 transition-all peer-focus:-top-3 peer-focus:text-xs peer-placeholder-shown:top-1/2 peer-placeholder-shown:text-sm">Name</label>
            </div>
            <div className="relative">
              <input className="peer w-full rounded-xl border border-white/20 bg-transparent px-4 py-3 outline-none text-slate-900 dark:text-white placeholder-transparent focus:border-[#71A845]" placeholder="Your email" />
              <label className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 bg-transparent px-2 text-slate-500 transition-all peer-focus:-top-3 peer-focus:text-xs peer-placeholder-shown:top-1/2 peer-placeholder-shown:text-sm">Email</label>
            </div>
            <div className="relative">
              <textarea rows="4" className="peer w-full rounded-xl border border-white/20 bg-transparent px-4 py-3 outline-none text-slate-900 dark:text-white placeholder-transparent focus:border-[#71A845]" placeholder="Tell us about your project" />
              <label className="pointer-events-none absolute left-3 top-3 bg-transparent px-2 text-slate-500 transition-all peer-focus:-top-2 peer-focus:text-xs peer-placeholder-shown:top-3 peer-placeholder-shown:text-sm">Project details</label>
            </div>
            <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
              <Mail className="h-4 w-4" /> hello@virleaf.studio
              <Phone className="h-4 w-4" /> +1 (555) 123-4567
            </div>
            <MagneticButton>Send inquiry</MagneticButton>
          </form>
        </div>
      </div>
    </section>
  )
}

export default function App() {
  const { theme, setTheme } = useTheme()
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-white dark:from-slate-950 dark:to-slate-900 selection:bg-[rgba(113,168,69,0.25)] selection:text-[#0a0a0a] dark:selection:text-white">
      <Navbar theme={theme} setTheme={setTheme} />

      <main className="relative">
        <Hero theme={theme} setTheme={setTheme} />
        <About />
        <Services />
        <Projects />
        <TechMarquee />
        <Pricing />
        <Contact />
      </main>

      <footer className="border-t border-white/10 py-10 text-center text-sm text-slate-600 dark:text-slate-400">
        © {new Date().getFullYear()} Virleaf. All rights reserved.
      </footer>

      {/* Global styles */}
      <style>{`
        .animate-marquee { animation: marquee 22s linear infinite; }
        @keyframes marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
      `}</style>
    </div>
  )
}
