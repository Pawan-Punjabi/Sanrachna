import { Layout } from "@/components/Layout";
import { motion } from "framer-motion";
import { Link } from "wouter";
import {
  Check,
  X,
  Zap,
  ArrowRight,
  Upload,
  Store,
  FileImage,
  FileText,
  Brain,
  ScanLine,
  Wallet,
} from "lucide-react";

const features = [
  {
    icon: Upload,
    label: "Floor plan uploads / Day",
    free: "3 uploads",
    pro: "Unlimited",
    freeIsText: true,
    proIsText: true,
  },
  {
    icon: Store,
    label: "Stores shown",
    free: "IKEA + Amazon",
    pro: "IKEA, Amazon, Wayfair,\nWest Elm, Houzz + more",
    freeIsText: true,
    proIsText: true,
  },
  {
    icon: FileImage,
    label: "Annotated image export",
    free: true,
    pro: true,
    freeIsText: false,
    proIsText: false,
  },
  {
    icon: FileText,
    label: "Downloadable PDF",
    free: false,
    pro: "Yes — full detail billing\n& information",
    freeIsText: false,
    proIsText: true,
  },
  {
    icon: Brain,
    label: "AI recommendation",
    free: false,
    pro: true,
    freeIsText: false,
    proIsText: false,
  },
  {
    icon: ScanLine,
    label: "Images per scan",
    free: "1 image",
    pro: "10 images",
    freeIsText: true,
    proIsText: true,
  },
  {
    icon: Wallet,
    label: "Budget filtering",
    free: false,
    pro: "Share your budget,\nget furniture accordingly",
    freeIsText: false,
    proIsText: true,
  },
];

function FeatureValue({
  value,
  isText,
  highlight = false,
}: {
  value: boolean | string;
  isText: boolean;
  highlight?: boolean;
}) {
  if (isText && typeof value === "string") {
    return (
      <span
        className={`text-sm leading-relaxed whitespace-pre-line ${
          highlight ? "text-foreground font-medium" : "text-muted-foreground"
        }`}
      >
        {value}
      </span>
    );
  }
  if (value === true) {
    return (
      <span
        className={`inline-flex items-center justify-center w-7 h-7 rounded-full ${
          highlight
            ? "bg-accent/15 text-accent"
            : "bg-muted text-muted-foreground"
        }`}
      >
        <Check size={15} strokeWidth={2.5} />
      </span>
    );
  }
  return (
    <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-muted/50 text-muted-foreground/50">
      <X size={14} strokeWidth={2} />
    </span>
  );
}

export function Pricing() {
  return (
    <Layout>
      <div className="flex-1 flex flex-col">
        {/* Hero */}
        <section className="relative py-20 lg:py-28 px-4 sm:px-6 lg:px-8 border-b border-border overflow-hidden">
          <div className="absolute inset-0 z-0">
            <div className="absolute -top-32 right-0 w-[500px] h-[500px] bg-accent rounded-full opacity-[0.04] blur-3xl" />
            <div className="absolute -bottom-32 left-0 w-[400px] h-[400px] bg-muted rounded-full opacity-20 blur-3xl" />
          </div>
          <div className="relative z-10 max-w-3xl mx-auto text-center">
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-sm font-semibold uppercase tracking-widest text-accent mb-4"
            >
              Pricing
            </motion.p>
            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.05 }}
              className="text-5xl sm:text-6xl lg:text-7xl font-display font-bold tracking-tight leading-[1.08] mb-6"
            >
              Simple, honest pricing
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.1 }}
              className="text-lg text-muted-foreground leading-relaxed max-w-xl mx-auto"
            >
              Start for free and upgrade when you need more power. No hidden
              fees, no complicated tiers.
            </motion.p>
          </div>
        </section>

        {/* Pricing Cards */}
        <section className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-5xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 mb-20">
              {/* Free Card */}
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55, delay: 0.15 }}
                className="flex flex-col rounded-2xl border border-border bg-card p-8 lg:p-10"
              >
                <div className="mb-8">
                  <p className="text-sm font-semibold uppercase tracking-widest text-muted-foreground mb-3">
                    Free
                  </p>
                  <div className="flex items-end gap-2 mb-4">
                    <span className="text-5xl font-display font-bold tracking-tight">
                      ₹0
                    </span>
                    <span className="text-muted-foreground mb-1.5">/ forever</span>
                  </div>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    Perfect for exploring the tool and analyzing occasional floor plans.
                  </p>
                </div>

                <Link
                  href="/analyzer"
                  className="flex items-center justify-center gap-2 w-full py-3 rounded-lg border border-border text-foreground font-medium text-sm hover:bg-muted transition-colors mb-8"
                >
                  Get started free
                </Link>

                <ul className="space-y-3.5 flex-1">
                  {[
                    "3 floor plan uploads per day",
                    "IKEA + Amazon product results",
                    "Annotated image export",
                    "1 image per scan",
                  ].map((f) => (
                    <li key={f} className="flex items-start gap-3 text-sm text-muted-foreground">
                      <Check size={16} className="mt-0.5 shrink-0 text-foreground/50" strokeWidth={2.5} />
                      {f}
                    </li>
                  ))}
                  {[
                    "Downloadable PDF report",
                    "AI recommendations",
                    "Budget filtering",
                  ].map((f) => (
                    <li key={f} className="flex items-start gap-3 text-sm text-muted-foreground/40 line-through">
                      <X size={16} className="mt-0.5 shrink-0" strokeWidth={2} />
                      {f}
                    </li>
                  ))}
                </ul>
              </motion.div>

              {/* Pro Card */}
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55, delay: 0.2 }}
                className="relative flex flex-col rounded-2xl border-2 border-accent bg-card p-8 lg:p-10 shadow-lg shadow-accent/10"
              >
                {/* Popular badge */}
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                  <span className="inline-flex items-center gap-1.5 px-4 py-1 rounded-full bg-accent text-accent-foreground text-xs font-bold uppercase tracking-wider shadow-md">
                    <Zap size={11} className="fill-current" />
                    Most Popular
                  </span>
                </div>

                <div className="mb-8">
                  <p className="text-sm font-semibold uppercase tracking-widest text-accent mb-3">
                    Pro
                  </p>
                  <div className="flex items-end gap-2 mb-4">
                    <span className="text-5xl font-display font-bold tracking-tight">
                      ₹499
                    </span>
                    <span className="text-muted-foreground mb-1.5">/ month</span>
                  </div>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    For design enthusiasts and professionals who need the full picture.
                  </p>
                </div>

                <Link
                  href="/analyzer"
                  className="flex items-center justify-center gap-2 w-full py-3 rounded-lg bg-accent text-accent-foreground font-medium text-sm hover:bg-accent/90 transition-colors mb-8"
                >
                  Get Pro
                  <ArrowRight size={15} />
                </Link>

                <ul className="space-y-3.5 flex-1">
                  {[
                    "Unlimited floor plan uploads",
                    "IKEA, Amazon, Wayfair, West Elm, Houzz + more",
                    "Annotated image export",
                    "Up to 10 images per scan",
                    "Downloadable PDF (billing & detail)",
                    "AI-powered recommendations",
                    "Budget filtering — share your budget, get matched furniture",
                  ].map((f) => (
                    <li key={f} className="flex items-start gap-3 text-sm text-foreground">
                      <Check size={16} className="mt-0.5 shrink-0 text-accent" strokeWidth={2.5} />
                      {f}
                    </li>
                  ))}
                </ul>
              </motion.div>
            </div>

            {/* Feature Comparison Table */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl font-display font-bold mb-2 text-center">
                Full feature comparison
              </h2>
              <p className="text-muted-foreground text-center mb-10">
                See exactly what's included in each plan.
              </p>

              <div className="rounded-2xl border border-border overflow-hidden">
                {/* Table header */}
                <div className="grid grid-cols-[1fr_140px_140px] bg-muted/50 border-b border-border">
                  <div className="px-6 py-4 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                    Feature
                  </div>
                  <div className="px-4 py-4 text-sm font-semibold text-center text-muted-foreground uppercase tracking-wider">
                    Free
                  </div>
                  <div className="px-4 py-4 text-sm font-semibold text-center text-accent uppercase tracking-wider">
                    Pro
                  </div>
                </div>

                {/* Table rows */}
                {features.map((feature, i) => (
                  <div
                    key={feature.label}
                    className={`grid grid-cols-[1fr_140px_140px] border-b border-border last:border-0 transition-colors hover:bg-muted/30 ${
                      i % 2 === 0 ? "bg-card" : "bg-background"
                    }`}
                  >
                    {/* Feature label */}
                    <div className="px-6 py-5 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                        <feature.icon size={15} className="text-muted-foreground" strokeWidth={1.75} />
                      </div>
                      <span className="text-sm font-medium text-foreground">
                        {feature.label}
                      </span>
                    </div>

                    {/* Free value */}
                    <div className="px-4 py-5 flex items-center justify-center">
                      <FeatureValue
                        value={feature.free}
                        isText={feature.freeIsText}
                        highlight={false}
                      />
                    </div>

                    {/* Pro value */}
                    <div className="px-4 py-5 flex items-center justify-center bg-accent/[0.03]">
                      <FeatureValue
                        value={feature.pro}
                        isText={feature.proIsText}
                        highlight={true}
                      />
                    </div>
                  </div>
                ))}

                {/* Price row */}
                <div className="grid grid-cols-[1fr_140px_140px] bg-muted/50">
                  <div className="px-6 py-5 text-sm font-bold text-foreground uppercase tracking-wider">
                    Price
                  </div>
                  <div className="px-4 py-5 flex items-center justify-center">
                    <span className="text-lg font-display font-bold text-foreground">Free</span>
                  </div>
                  <div className="px-4 py-5 flex items-center justify-center bg-accent/[0.03]">
                    <span className="text-lg font-display font-bold text-accent">₹499 / mo</span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Bottom CTA */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
              className="mt-16 text-center"
            >
              <p className="text-muted-foreground mb-6 text-base">
                Not sure which plan to start with?
              </p>
              <Link
                href="/analyzer"
                className="inline-flex items-center gap-2 px-7 py-3.5 bg-primary text-primary-foreground font-medium rounded-lg hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200"
              >
                Try it free — no account needed
                <ArrowRight size={17} />
              </Link>
            </motion.div>
          </div>
        </section>
      </div>
    </Layout>
  );
}
