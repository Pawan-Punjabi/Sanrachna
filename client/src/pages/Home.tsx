import { Layout } from "@/components/Layout";
import { UploadZone } from "@/components/UploadZone";
import { motion } from "framer-motion";
import illustrationArt from "@assets/image_1773167663264.png";
import heroMockup from "@assets/image_1773167474214.png";

export function Home() {
  return (
    <Layout>
      <div className="flex-1 flex flex-col relative">
        {/* Hero Section with Split Layout */}
        <section className="relative z-10 min-h-screen flex items-center justify-center px-4 sm:px-6 py-20 lg:py-0 overflow-hidden">
          {/* Background gradient effect */}
          <div className="absolute inset-0 z-0">
            <div className="absolute -top-40 -right-40 w-96 h-96 bg-secondary rounded-full opacity-30 blur-3xl" />
            <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-accent rounded-full opacity-20 blur-3xl" />
          </div>

          <div className="max-w-7xl w-full mx-auto relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            {/* Left Column - Text & CTA */}
            <motion.div 
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="flex flex-col justify-center"
            >
              <span className="inline-block py-1.5 px-4 rounded-full bg-secondary/20 text-foreground text-xs font-semibold tracking-wide uppercase mb-6 w-fit border border-secondary/40">
                ✨ AI-Powered Space Design
              </span>
              
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-display font-bold tracking-tight text-balance leading-[1.1] mb-6">
                Transform your <span className="text-secondary">room</span> into your <span className="text-accent">dream space</span>
              </h1>
              
              <p className="text-lg text-muted-foreground text-balance max-w-lg mb-10 leading-relaxed">
                Upload your floor plan and let our AI analyze the layout, detect furniture, and recommend premium pieces perfectly sized for your space.
              </p>

              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
              >
                <UploadZone />
              </motion.div>
            </motion.div>

            {/* Right Column - Hero Images */}
            <motion.div 
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.1, ease: "easeOut" }}
              className="relative h-full hidden lg:flex items-center justify-center"
            >
              <div className="relative w-full">
                {/* Main mockup image */}
                <motion.div
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 4, repeat: Infinity }}
                  className="relative"
                >
                  <img 
                    src={heroMockup}
                    alt="App mockup showing floor plan analysis"
                    className="w-full rounded-2xl shadow-2xl border border-border/50"
                  />
                </motion.div>

                {/* Illustration overlay bottom right */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
                  className="absolute -bottom-8 -right-8 w-48 h-48 rounded-2xl overflow-hidden shadow-lg border border-white/20 bg-card"
                >
                  <img 
                    src={illustrationArt}
                    alt="Team working on space design"
                    className="w-full h-full object-cover"
                  />
                </motion.div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* How It Works Section */}
        <section id="how-it-works" className="relative z-10 py-24 bg-card/50 border-t border-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-4xl lg:text-5xl font-display font-bold mb-4">How It Works</h2>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                Three simple steps to transform your space with AI-powered insights
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
              {[
                {
                  step: "01",
                  title: "Upload Your Floor Plan",
                  desc: "Share a clear image of your room layout. Works with sketches, photos, or digital plans.",
                  icon: "📸"
                },
                {
                  step: "02",
                  title: "AI Analyzes Your Space",
                  desc: "Our AI detects furniture zones, dimensions, and spatial characteristics in seconds.",
                  icon: "🧠"
                },
                {
                  step: "03",
                  title: "Get Recommendations",
                  desc: "Discover curated furniture picks from IKEA, Amazon, and more - perfectly sized for you.",
                  icon: "🎯"
                }
              ].map((item, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: i * 0.1 }}
                  viewport={{ once: true }}
                  className="flex flex-col items-start group"
                >
                  <div className="text-4xl mb-4">{item.icon}</div>
                  <div className="w-12 h-12 rounded-full border-2 border-secondary bg-secondary/10 text-secondary flex items-center justify-center font-display text-lg font-bold mb-6 group-hover:bg-secondary/20 transition-colors">
                    {item.step}
                  </div>
                  <h3 className="font-display text-2xl font-bold mb-3">{item.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{item.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </Layout>
  );
}
