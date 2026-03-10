import { Layout } from "@/components/Layout";
import { UploadZone } from "@/components/UploadZone";
import { motion } from "framer-motion";

export function Home() {
  return (
    <Layout>
      <div className="flex-1 flex flex-col relative">
        {/* Background decorative elements */}
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-[20%] -right-[10%] w-[50%] h-[50%] rounded-full bg-accent/5 blur-[120px]" />
          <div className="absolute top-[40%] -left-[10%] w-[40%] h-[40%] rounded-full bg-primary/5 blur-[100px]" />
        </div>

        <section className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 sm:px-6 py-20 lg:py-32">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="text-center max-w-3xl mx-auto mb-16"
          >
            <span className="inline-block py-1.5 px-4 rounded-full bg-secondary text-secondary-foreground text-xs font-semibold tracking-wide uppercase mb-6 shadow-sm border border-border/50">
              AI-Powered Curation
            </span>
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-display font-medium tracking-tight text-balance leading-[1.1] mb-6">
              Design your space with <span className="text-accent italic">intention.</span>
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground text-balance max-w-2xl mx-auto">
              Upload your floor plan and let our AI analyze the layout, detect zones, and curate a collection of premium furniture tailored to your space.
            </p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2, ease: "easeOut" }}
            className="w-full"
          >
            <UploadZone />
          </motion.div>
        </section>

        <section id="how-it-works" className="relative z-10 py-24 bg-card border-y border-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
              {[
                {
                  step: "01",
                  title: "Upload Plan",
                  desc: "Share a 2D floor plan or sketch of your empty room."
                },
                {
                  step: "02",
                  title: "AI Analysis",
                  desc: "We identify spatial boundaries, logical zones, and scale."
                },
                {
                  step: "03",
                  title: "Curated Selection",
                  desc: "Discover beautiful pieces that perfectly fit your dimensions."
                }
              ].map((item, i) => (
                <div key={i} className="flex flex-col items-center">
                  <div className="w-12 h-12 rounded-full border border-accent/30 text-accent flex items-center justify-center font-display text-xl mb-6 bg-accent/5">
                    {item.step}
                  </div>
                  <h3 className="font-display text-2xl mb-3">{item.title}</h3>
                  <p className="text-muted-foreground">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </Layout>
  );
}
