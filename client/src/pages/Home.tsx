import { Layout } from "@/components/Layout";
import { UploadZone } from "@/components/UploadZone";
import { motion } from "framer-motion";
import { Link } from "wouter";
import { ArrowRight, UploadCloud, ScanSearch, ShoppingBag, Scan } from "lucide-react";

export function Home() {
  return (
    <Layout>
      <div className="flex-1 flex flex-col relative">
        {/* Hero Section */}
        <section className="relative z-10 min-h-[calc(100vh-80px)] flex items-center justify-center px-4 sm:px-6 lg:px-8 py-16 overflow-hidden">
          <div className="max-w-7xl w-full mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 xl:gap-24 items-center">

            {/* Left — Headline & description */}
            <motion.div
              initial={{ opacity: 0, x: -24 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, ease: "easeOut" }}
              className="flex flex-col justify-center"
            >
              <h1 className="text-5xl sm:text-6xl lg:text-[4rem] xl:text-[4.5rem] font-display font-bold tracking-tight leading-[1.08] mb-6 text-foreground">
                Transform your{" "}
                <span className="text-accent">room</span>{" "}
                into your dream space
              </h1>

              <p className="text-lg text-muted-foreground max-w-md mb-10 leading-relaxed">
                Upload your floor plan and get intelligent furniture detection with curated product recommendations from top stores — tailored to your exact space.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href="/analyzer"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground font-medium rounded-lg hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200 w-fit"
                >
                  Start Analyzing
                  <ArrowRight size={18} />
                </Link>
                <button
                  onClick={() => document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" })}
                  className="inline-flex items-center gap-2 px-6 py-3 border border-border text-foreground font-medium rounded-lg hover:bg-muted transition-all duration-200 w-fit"
                >
                  How it works
                </button>
              </div>
            </motion.div>

            {/* Right — Upload Zone */}
            <motion.div
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, delay: 0.1, ease: "easeOut" }}
              className="flex flex-col"
            >
              <div className="bg-card border border-border rounded-2xl p-8 shadow-sm">
                <p className="text-sm font-semibold text-muted-foreground uppercase tracking-widest mb-5">
                  Quick Analyze
                </p>
                <UploadZone />
              </div>
            </motion.div>

          </div>
        </section>

        {/* How It Works */}
        <section id="how-it-works" className="relative z-10 pt-24 pb-10 border-t border-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="mb-16"
            >
              <p className="text-sm font-semibold uppercase tracking-widest text-accent mb-3">Process</p>
              <h2 className="text-4xl lg:text-5xl font-display font-bold mb-4 max-w-xl">
                Three steps to your ideal space
              </h2>
              <p className="text-muted-foreground text-lg max-w-xl leading-relaxed">
                From raw floor plan to curated furniture selection in moments.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                {
                  step: "01",
                  icon: UploadCloud,
                  title: "Upload Your Floor Plan",
                  desc: "Share a JPG or PNG of your room layout — hand-drawn sketches, architectural drawings, or photos all work.",
                  bg: "bg-muted"
                },
                {
                  step: "02",
                  icon: ScanSearch,
                  title: "Space Detection",
                  desc: "We scan your layout to detect furniture zones, room dimensions, and spatial boundaries with precision.",
                  bg: "bg-accent/5"
                },
                {
                  step: "03",
                  icon: ShoppingBag,
                  title: "Curated Recommendations",
                  desc: "Receive hand-picked furniture suggestions from IKEA, Amazon, and Wayfair — matched to your room's scale and style.",
                  bg: "bg-muted"
                }
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.55, delay: i * 0.1 }}
                  viewport={{ once: true }}
                  className={`relative ${item.bg} rounded-2xl p-8 border border-border group hover:border-accent/30 transition-colors duration-300 overflow-hidden`}
                >
                  {/* Large background step number */}
                  <span className="absolute -bottom-4 -right-2 text-[7rem] font-display font-bold text-foreground/5 leading-none select-none pointer-events-none">
                    {item.step}
                  </span>

                  <div className="relative z-10">
                    <div className="w-12 h-12 rounded-xl bg-background border border-border flex items-center justify-center mb-6 group-hover:border-accent/40 transition-colors shadow-sm">
                      <item.icon size={22} className="text-accent" strokeWidth={1.5} />
                    </div>

                    <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">
                      Step {item.step}
                    </div>

                    <h3 className="font-display text-xl font-bold mb-3 leading-snug">
                      {item.title}
                    </h3>
                    <p className="text-muted-foreground leading-relaxed text-sm">
                      {item.desc}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
            
            {/* 2D to 3D Generator Feature Section */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              viewport={{ once: true }}
              className="mt-24 p-8 lg:p-12 rounded-[2.5rem] bg-gradient-to-br from-accent/10 via-background to-accent/5 border border-accent/20 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-64 h-64 bg-accent/10 rounded-full blur-3xl -mr-32 -mt-32" />
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -ml-32 -mb-32" />

              <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 text-accent text-xs font-bold uppercase tracking-wider mb-6">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-accent"></span>
                    </span>
                    New Feature
                  </div>
                  <h2 className="text-3xl lg:text-4xl font-display font-bold mb-6 leading-tight">
                    Experience your space in <span className="text-accent">Immersive 3D</span>
                  </h2>
                  <p className="text-muted-foreground text-lg mb-8 leading-relaxed">
                    Our advanced AI doesn't just analyze — it reconstructs. Convert your flat 2D floor plans into fully navigable 3D digital twins with realistic textures and furniture placement.
                  </p>
                  <ul className="space-y-4 mb-10">
                    {[
                      "Instant 2D to 3D reconstruction",
                      "Photorealistic lighting and textures",
                      "Interactive walkthrough experience",
                      "Exportable structural data"
                    ].map((feature, idx) => (
                      <li key={idx} className="flex items-center gap-3 text-foreground/80">
                        <div className="flex-shrink-0 w-5 h-5 rounded-full bg-accent/20 flex items-center justify-center">
                          <div className="w-1.5 h-1.5 rounded-full bg-accent" />
                        </div>
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Link
                    href="/generate-3d-floorplan"
                    className="inline-flex items-center gap-2 px-8 py-4 bg-foreground text-background font-semibold rounded-xl hover:scale-105 transition-all duration-300 shadow-xl hover:shadow-accent/20"
                  >
                    Try 3D Generator
                    <ArrowRight size={20} />
                  </Link>
                </div>

                <div className="relative group">
                  <div className="absolute -inset-1 bg-gradient-to-r from-accent to-primary rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>
                  <div className="relative aspect-video rounded-2xl bg-muted border border-border overflow-hidden shadow-2xl flex items-center justify-center">
                    {/* Placeholder for 3D Demo / Image */}
                    <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80')] bg-cover bg-center opacity-60 mix-blend-overlay" />
                    <div className="relative z-10 flex flex-col items-center gap-4">
                      <div className="w-16 h-16 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 animate-bounce">
                        <Scan size={32} className="text-white" />
                      </div>
                      <span className="text-white font-medium tracking-wide uppercase text-sm bg-black/20 px-4 py-1 rounded-full backdrop-blur-sm">
                        Live AI Rendering
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* CTA below How It Works */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              viewport={{ once: true }}
              className="mt-12 flex justify-center"
            >
              <Link
                href="/analyzer"
                className="inline-flex items-center gap-2 px-7 py-3.5 bg-primary text-primary-foreground font-medium rounded-lg hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200"
              >
                Try the Analyzer
                <ArrowRight size={18} />
              </Link>
            </motion.div>

          </div>
        </section>
      </div>
    </Layout>
  );
}
