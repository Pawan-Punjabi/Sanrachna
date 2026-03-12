import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { Layout } from "@/components/Layout";
import { UploadZone } from "@/components/UploadZone";
import { useFloorPlan } from "@/hooks/use-floor-plans";
import { ProductCard } from "@/components/ProductCard";
import { ArrowLeft, Layers, Search, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import clsx from "clsx";
import { buildUrl, api } from "@shared/routes";

interface AnalyzerProps {
  id?: number;
}

export function Analyzer({ id }: AnalyzerProps) {
  const [, setLocation] = useLocation();
  const { data: plan, isLoading, error } = useFloorPlan(id ?? 0);
  const [activeDetectionId, setActiveDetectionId] = useState<number | null>(null);
  const idRef = useRef(id);
  idRef.current = id;

  // Delete floor plan and its image file when the user navigates away
  useEffect(() => {
    if (!id) return;
    return () => {
      const planId = idRef.current;
      if (!planId) return;
      const url = buildUrl(api.floorPlans.delete.path, { id: planId });
      fetch(url, { method: "DELETE", credentials: "include" }).catch(() => {});
    };
  }, [id]);

  // No ID — show the upload page
  if (!id) {
    return (
      <Layout>
        <div className="flex-1 flex flex-col">
          {/* Header bar */}
          <div className="border-b border-border bg-card/50 px-4 sm:px-6 lg:px-8 py-5">
            <div className="max-w-7xl mx-auto flex items-center gap-3">
              <button
                onClick={() => setLocation("/")}
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft size={16} />
                Home
              </button>
              <span className="text-border">/</span>
              <span className="text-sm font-medium text-foreground">Floor Plan Analyzer</span>
            </div>
          </div>

          <div className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 py-16 lg:py-24">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="w-full max-w-2xl text-center mb-10"
            >
              <h1 className="text-4xl lg:text-5xl font-display font-bold tracking-tight mb-4">
                Analyze Your Floor Plan
              </h1>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Upload a clear image of your room layout and we'll detect furniture zones, dimensions, and curate tailored product recommendations for your space.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.15 }}
              className="w-full max-w-xl"
            >
              <UploadZone />
            </motion.div>

            {/* Supported formats info */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="mt-6 text-sm text-muted-foreground"
            >
              Supported formats: JPG, PNG, WebP · Max file size: 10MB
            </motion.p>
          </div>
        </div>
      </Layout>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <Layout>
        <div className="flex-1 flex items-center justify-center py-32">
          <div className="flex flex-col items-center gap-4 text-muted-foreground">
            <div className="relative w-16 h-16">
              <div className="absolute inset-0 rounded-full border-4 border-muted" />
              <div className="absolute inset-0 rounded-full border-4 border-accent border-t-transparent animate-spin" />
            </div>
            <p className="font-medium text-lg">Loading analysis...</p>
          </div>
        </div>
      </Layout>
    );
  }

  // Error / Not found state
  if (error || !plan) {
    return (
      <Layout>
        <div className="flex-1 flex flex-col items-center justify-center py-32 text-center px-4">
          <div className="w-20 h-20 bg-muted text-muted-foreground rounded-full flex items-center justify-center mb-6">
            <Search size={32} />
          </div>
          <h2 className="text-3xl font-display font-bold mb-4">Analysis Not Found</h2>
          <p className="text-muted-foreground max-w-md mb-8">
            We couldn't locate this floor plan analysis. It may have been removed or the link is invalid.
          </p>
          <button
            onClick={() => setLocation("/analyzer")}
            className="flex items-center gap-2 px-6 py-3 rounded-lg bg-primary text-primary-foreground font-medium hover:-translate-y-0.5 transition-transform"
          >
            <ArrowLeft size={18} />
            Upload a New Plan
          </button>
        </div>
      </Layout>
    );
  }

  // Flatten products across detections
  const activeProducts = activeDetectionId
    ? plan.detections.find(d => d.id === activeDetectionId)?.products || []
    : plan.detections.flatMap(d => d.products);

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12 w-full">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 mb-8 text-sm text-muted-foreground">
          <button onClick={() => setLocation("/")} className="hover:text-foreground transition-colors">
            Home
          </button>
          <span>/</span>
          <button onClick={() => setLocation("/analyzer")} className="hover:text-foreground transition-colors">
            Analyzer
          </button>
          <span>/</span>
          <span className="text-foreground font-medium truncate max-w-[200px]">{plan.name}</span>
        </div>

        {/* Page header */}
        <div className="flex flex-col lg:flex-row items-baseline justify-between gap-4 mb-10">
          <div>
            <h1 className="text-4xl lg:text-5xl font-display font-bold tracking-tight mb-2">
              {plan.name || "Analysis Result"}
            </h1>
            <p className="text-muted-foreground flex items-center gap-2 text-base">
              <Layers size={16} />
              {plan.detections.length} furniture zone{plan.detections.length !== 1 ? "s" : ""} identified
            </p>
          </div>
          <button
            onClick={() => setLocation("/analyzer")}
            className="flex items-center gap-2 text-sm text-muted-foreground border border-border px-4 py-2 rounded-lg hover:text-foreground hover:border-primary/40 transition-all"
          >
            <RefreshCw size={14} />
            Analyze Another
          </button>
        </div>

        {/* Main analysis grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 xl:gap-16 items-start">
          {/* Floor Plan Viewer */}
          <div className="lg:col-span-7 xl:col-span-8 sticky top-28">
            <div className="relative rounded-2xl overflow-hidden bg-muted border border-border shadow-lg">
              <img
                src={plan.imageUrl}
                alt="Floor plan"
                className="w-full h-auto block select-none"
                draggable={false}
              />
              <AnimatePresence>
                {plan.detections.map(detection => {
                  const isActive = activeDetectionId === detection.id;
                  const isFaded = activeDetectionId !== null && !isActive;
                  return (
                    <motion.div
                      key={detection.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: isFaded ? 0.2 : 1 }}
                      className={clsx(
                        "absolute rounded-md border-2 cursor-pointer transition-all duration-300",
                        isActive
                          ? "border-accent bg-accent/20 z-20"
                          : "border-primary/50 bg-primary/10 hover:bg-primary/20 z-10"
                      )}
                      style={{
                        left: `${detection.boxX * 100}%`,
                        top: `${detection.boxY * 100}%`,
                        width: `${detection.boxW * 100}%`,
                        height: `${detection.boxH * 100}%`,
                      }}
                      onClick={() => setActiveDetectionId(isActive ? null : detection.id)}
                    >
                      {isActive && (
                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-foreground text-background text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-full whitespace-nowrap pointer-events-none shadow-lg">
                          {detection.label}
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
            <p className="text-center text-xs text-muted-foreground mt-3">
              Click a zone to filter recommendations
            </p>
          </div>

          {/* Detected Zones Panel */}
          <div className="lg:col-span-5 xl:col-span-4 flex flex-col gap-6">
            <div className="bg-card rounded-2xl p-6 md:p-8 border border-border">
              <h3 className="font-display text-xl font-bold mb-5">Detected Zones</h3>
              <div className="space-y-2">
                {plan.detections.length === 0 ? (
                  <p className="text-muted-foreground italic text-sm">No zones identified.</p>
                ) : (
                  plan.detections.map(detection => {
                    const isActive = activeDetectionId === detection.id;
                    return (
                      <button
                        key={detection.id}
                        onClick={() => setActiveDetectionId(isActive ? null : detection.id)}
                        className={clsx(
                          "w-full text-left flex items-center justify-between p-4 rounded-xl border transition-all duration-200",
                          isActive
                            ? "bg-accent/10 border-accent/50"
                            : "bg-background border-border hover:border-primary/30"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <div className={clsx(
                            "w-2.5 h-2.5 rounded-full",
                            isActive ? "bg-accent" : "bg-primary/40"
                          )} />
                          <span className="font-medium capitalize text-sm">{detection.label}</span>
                        </div>
                        <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-md">
                          {Math.round(detection.confidence * 100)}% match
                        </span>
                      </button>
                    );
                  })
                )}
              </div>
              {activeDetectionId && (
                <button
                  onClick={() => setActiveDetectionId(null)}
                  className="w-full mt-5 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors border border-border rounded-lg"
                >
                  Clear Selection
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Product Recommendations */}
        <div className="mt-20 mb-16 border-t border-border pt-14">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
            <div>
              <h2 className="text-3xl font-display font-bold mb-2">Product Recommendations</h2>
              <p className="text-muted-foreground">
                {activeDetectionId
                  ? `Curated picks for the selected ${plan.detections.find(d => d.id === activeDetectionId)?.label} zone.`
                  : "Curated furniture picks suited for your space."}
              </p>
            </div>
            <div className="text-sm font-medium px-4 py-2 bg-muted rounded-full whitespace-nowrap border border-border">
              {activeProducts.length} item{activeProducts.length !== 1 ? "s" : ""} found
            </div>
          </div>

          {activeProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              <AnimatePresence mode="popLayout">
                {activeProducts.map(product => (
                  <motion.div
                    key={product.id}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.3 }}
                  >
                    <ProductCard product={product} />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          ) : (
            <div className="text-center py-20 bg-card rounded-2xl border border-dashed border-border">
              <p className="text-lg text-muted-foreground">No products found for this selection.</p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
