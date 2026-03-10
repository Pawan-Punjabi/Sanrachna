import { useState } from "react";
import { useLocation } from "wouter";
import { Layout } from "@/components/Layout";
import { useFloorPlan } from "@/hooks/use-floor-plans";
import { ProductCard } from "@/components/ProductCard";
import { ArrowLeft, Maximize, Layers, Search, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import clsx from "clsx";

interface ResultProps {
  id: number;
}

export function Result({ id }: ResultProps) {
  const [, setLocation] = useLocation();
  const { data: plan, isLoading, error } = useFloorPlan(id);
  const [activeDetectionId, setActiveDetectionId] = useState<number | null>(null);

  if (isLoading) {
    return (
      <Layout>
        <div className="flex-1 flex items-center justify-center py-32">
          <div className="flex flex-col items-center text-muted-foreground animate-pulse">
            <RefreshCw size={32} className="animate-spin mb-4" />
            <p className="font-medium">Retrieving spatial data...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (error || !plan) {
    return (
      <Layout>
        <div className="flex-1 flex flex-col items-center justify-center py-32 text-center px-4">
          <div className="w-20 h-20 bg-destructive/10 text-destructive rounded-full flex items-center justify-center mb-6">
            <Search size={32} />
          </div>
          <h2 className="text-3xl font-display font-medium mb-4">Plan Not Found</h2>
          <p className="text-muted-foreground max-w-md mb-8">
            We couldn't locate the analysis for this floor plan. It may have been removed or the link is invalid.
          </p>
          <button 
            onClick={() => setLocation("/")}
            className="flex items-center gap-2 px-6 py-3 rounded-full bg-primary text-primary-foreground font-medium transition-transform hover:-translate-y-0.5"
          >
            <ArrowLeft size={18} />
            Back to Upload
          </button>
        </div>
      </Layout>
    );
  }

  // Flatten all products across detections for the global gallery
  const activeProducts = activeDetectionId 
    ? plan.detections.find(d => d.id === activeDetectionId)?.products || []
    : plan.detections.flatMap(d => d.products);

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12 w-full">
        <button 
          onClick={() => setLocation("/")}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors w-fit"
        >
          <ArrowLeft size={16} />
          Analyze another plan
        </button>

        <div className="flex flex-col lg:flex-row items-baseline justify-between gap-4 mb-10">
          <div>
            <h1 className="text-4xl lg:text-5xl font-display font-medium tracking-tight mb-2">
              {plan.name || "Analysis Result"}
            </h1>
            <p className="text-muted-foreground flex items-center gap-2">
              <Layers size={16} />
              Identified {plan.detections.length} key zones
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 xl:gap-16 items-start">
          {/* Left Column: Floor Plan Viewer */}
          <div className="lg:col-span-7 xl:col-span-8 sticky top-28">
            <div className="relative rounded-3xl overflow-hidden bg-secondary shadow-2xl shadow-black/5 border border-border">
              <img 
                src={plan.imageUrl} 
                alt="Floor plan" 
                className="w-full h-auto block select-none"
                draggable={false}
              />
              
              {/* Bounding Boxes */}
              <AnimatePresence>
                {plan.detections.map(detection => {
                  const isActive = activeDetectionId === detection.id;
                  const isFaded = activeDetectionId !== null && !isActive;
                  
                  return (
                    <motion.div
                      key={detection.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: isFaded ? 0.2 : 1, scale: 1 }}
                      className={clsx(
                        "absolute rounded-lg border-2 cursor-pointer transition-all duration-300",
                        isActive 
                          ? "border-accent bg-accent/20 z-20 shadow-[0_0_20px_rgba(200,130,103,0.3)]" 
                          : "border-primary/40 bg-primary/10 hover:bg-primary/20 z-10"
                      )}
                      style={{
                        left: `${detection.boxX * 100}%`,
                        top: `${detection.boxY * 100}%`,
                        width: `${detection.boxW * 100}%`,
                        height: `${detection.boxH * 100}%`,
                      }}
                      onClick={() => setActiveDetectionId(isActive ? null : detection.id)}
                      onMouseEnter={() => !activeDetectionId && setActiveDetectionId(detection.id)}
                      onMouseLeave={() => !activeDetectionId && setActiveDetectionId(null)}
                    >
                      {isActive && (
                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-popover text-popover-foreground text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-full shadow-lg whitespace-nowrap pointer-events-none">
                          {detection.label}
                        </div>
                      )}
                      <div className="absolute bottom-2 right-2 w-6 h-6 bg-background/80 rounded-full flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                        <Maximize size={12} />
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
            <p className="text-center text-xs text-muted-foreground mt-4">
              Interactive map. Hover or click zones to filter recommendations.
            </p>
          </div>

          {/* Right Column: Legend & Stats */}
          <div className="lg:col-span-5 xl:col-span-4 flex flex-col gap-6">
            <div className="bg-card rounded-3xl p-6 md:p-8 border border-border shadow-lg shadow-black/5">
              <h3 className="font-display text-2xl mb-6">Detected Layout</h3>
              
              <div className="space-y-3">
                {plan.detections.length === 0 ? (
                  <p className="text-muted-foreground italic text-sm">No distinct zones identified.</p>
                ) : (
                  plan.detections.map(detection => {
                    const isActive = activeDetectionId === detection.id;
                    return (
                      <button
                        key={detection.id}
                        onClick={() => setActiveDetectionId(isActive ? null : detection.id)}
                        className={clsx(
                          "w-full text-left flex items-center justify-between p-4 rounded-xl border transition-all duration-300",
                          isActive 
                            ? "bg-accent/10 border-accent/50 ring-1 ring-accent" 
                            : "bg-background border-border hover:border-primary/30"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <div className={clsx(
                            "w-3 h-3 rounded-full",
                            isActive ? "bg-accent shadow-[0_0_8px_var(--accent)]" : "bg-primary/40"
                          )} />
                          <span className="font-medium capitalize">{detection.label}</span>
                        </div>
                        <span className="text-xs text-muted-foreground bg-secondary px-2 py-1 rounded-md">
                          {Math.round(detection.confidence * 100)}% Match
                        </span>
                      </button>
                    );
                  })
                )}
              </div>
              
              {activeDetectionId && (
                <button 
                  onClick={() => setActiveDetectionId(null)}
                  className="w-full mt-6 py-3 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  Clear Selection
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Recommendations Section */}
        <div className="mt-24 mb-16 border-t border-border pt-16">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
            <div>
              <h2 className="text-3xl font-display font-medium mb-3">Curated Collection</h2>
              <p className="text-muted-foreground text-lg">
                {activeDetectionId 
                  ? `Recommended pieces specifically for the selected ${plan.detections.find(d => d.id === activeDetectionId)?.label.toLowerCase()} zone.`
                  : "Pieces perfectly scaled and styled for your overall space."}
              </p>
            </div>
            <div className="text-sm font-medium px-4 py-2 bg-secondary rounded-full whitespace-nowrap">
              {activeProducts.length} Items Found
            </div>
          </div>

          {activeProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 xl:gap-8">
              <AnimatePresence mode="popLayout">
                {activeProducts.map((product) => (
                  <motion.div
                    key={product.id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.4 }}
                  >
                    <ProductCard product={product} />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          ) : (
            <div className="text-center py-20 bg-card rounded-3xl border border-dashed border-border">
              <p className="text-lg text-muted-foreground font-medium">No products found for this selection.</p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
