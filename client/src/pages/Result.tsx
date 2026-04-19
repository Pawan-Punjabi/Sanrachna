import { useState } from "react";
import { useLocation } from "wouter";
import { Layout } from "@/components/Layout";
import { useFloorPlan } from "@/hooks/use-floor-plans";
import { ProductCard } from "@/components/ProductCard";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Maximize, Layers, Search, RefreshCw, Download, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import clsx from "clsx";

import { NormalisedDetection, NormalisedFloorPlan } from "@shared/schema";

interface ResultProps {
  id: number;
}

export function Result({ id }: ResultProps) {
  const [, setLocation] = useLocation();
  const { data: plan, isLoading, error } = useFloorPlan(id);
  const { toast } = useToast();
  const [activeLabel, setActiveLabel] = useState<string | null>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  // Helper to generate a unique, light color based on the furniture label
  const getFurnitureColor = (label: string) => {
    const furnitureColors: Record<string, string> = {
      "bed": "#D1FAE5",          // light emerald
      "king-bed": "#D1FAE5",     // light emerald
      "single-bed": "#ECFDF5",   // light emerald variant
      "sofa": "#FEF3C7",         // light amber
      "dining_table": "#DBEAFE", // light blue
      "table": "#DBEAFE",        // light blue
      "study_table": "#E0E7FF",  // light indigo
      "door": "#FEE2E2",         // light red/rose
      "sink": "#E0F2FE",         // light sky
      "toilet": "#F1F5F9",       // light slate
      "kitchen_platform": "#F3E8FF" // light purple
    };

    const sanitized = label.toLowerCase().replace(/_/g, " ");
    if (furnitureColors[sanitized]) return furnitureColors[sanitized];
    
    // Hash-based unique light color generation (no black/white)
    let hash = 0;
    for (let i = 0; i < label.length; i++) {
      hash = label.charCodeAt(i) + ((hash << 5) - hash);
    }
    const h = Math.abs(hash) % 360;
    return `hsl(${h}, 80%, 80%)`; 
  };

  // Group detections by label for the sidebar summary
  const detectionCategories = (plan?.detections || []).reduce((acc: Record<string, {label: string, count: number}>, d) => {
    if (!acc[d.label]) acc[d.label] = { label: d.label, count: 0 };
    acc[d.label].count++;
    return acc;
  }, {});

  const categories = Object.values(detectionCategories).sort((a, b) => b.count - a.count);

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

  // Flatten all products across detections matching the active category
  const activeProducts = activeLabel 
    ? plan.detections.filter(d => d.label === activeLabel).flatMap(d => d.products)
    : plan.detections.flatMap(d => d.products);

  const downloadReport = async () => {
    if (!plan) return;
    setIsGeneratingPdf(true);
    
    // Construct payload
    const costEstimation = plan.detections.map(d => ({
       item: d.label.replace(/_/g, " "),
       qty: 1, 
       unit_price: d.products.length ? parseFloat(d.products[0].price.replace(/[^0-9.]/g, '') || "0") : 0
    }));

    // aggregate identical labels
    const costMap = new Map();
    costEstimation.forEach(c => {
       if (costMap.has(c.item)) {
          const ex = costMap.get(c.item);
          ex.qty += 1;
       } else {
          costMap.set(c.item, { ...c });
       }
    });

    const recommendations: Record<string, any[]> = {};
    plan.detections.forEach(d => {
       const label = d.label.replace(/_/g, " ");
       if (!recommendations[label]) {
           recommendations[label] = d.products.map(p => ({
              name: p.name,
              price: p.price,
              link: p.productLink
           })).slice(0, 3); // limit to top 3 products per category
       }
    });

    const reportData = {
      annotated_image: plan.imageUrl,
      detections: categories.map(c => ({ label: c.label, count: c.count })),
      cost_estimation: Array.from(costMap.values()),
      recommendations,
      design_suggestions: [
        `Consider grouping your ${categories[0]?.label.replace(/_/g, " ") || "major furniture pieces"} to anchor the space.`,
        "Utilize natural light by leaving main pathways clear."
      ],
      budget_suggestions: [
        "Check standardized sizes for potential bulk savings.",
        "Compare top-rated Wayfair alternatives against premium IKEA finds."
      ]
    };

    try {
      const res = await fetch('/api/generate-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reportData)
      });
      if (!res.ok) throw new Error("Failed to generate report");
      
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'floorplan-report.pdf';
      a.click();
      window.URL.revokeObjectURL(url);
      
      toast({
         title: "Success",
         description: "Your PDF report has been downloaded.",
      });
    } catch (err: any) {
       toast({
         title: "Error",
         description: err.message || "Failed to generate report",
         variant: "destructive"
       });
    } finally {
       setIsGeneratingPdf(false);
    }
  };

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
          <button
            onClick={downloadReport}
            disabled={isGeneratingPdf}
            className="flex items-center gap-2 bg-foreground text-background px-5 py-2.5 rounded-full font-medium hover:bg-foreground/90 transition shadow-sm disabled:opacity-70"
          >
            {isGeneratingPdf ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
            {isGeneratingPdf ? "Generating..." : "Download PDF Report"}
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 xl:gap-16 items-start">
          {/* Left Column: Floor Plan Viewer */}
          <div className="lg:col-span-6 xl:col-span-7 sticky top-28">
            <div className="relative rounded-3xl overflow-hidden bg-secondary shadow-2xl shadow-black/5 border border-border w-fit mx-auto">
              <img 
                src={plan.imageUrl} 
                alt="Floor plan" 
                className="w-auto max-h-[65vh] block select-none"
                draggable={false}
              />
              
              {/* Bounding Boxes */}
              <AnimatePresence>
                {plan.detections.map(detection => {
                  const isActive = activeLabel === detection.label;
                  const isFaded = activeLabel !== null && !isActive;
                  const catColor = getFurnitureColor(detection.label);
                  
                  return (
                    <motion.div
                      key={detection.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: isFaded ? 0.2 : 1, scale: 1 }}
                      className={clsx(
                        "absolute rounded-lg border-2 cursor-pointer transition-all duration-300 shadow-sm",
                        isActive 
                          ? "z-20 scale-[1.03]" 
                          : "z-10"
                      )}
                      style={{
                        left: `${detection.boxX * 100}%`,
                        top: `${detection.boxY * 100}%`,
                        width: `${detection.boxW * 100}%`,
                        height: `${detection.boxH * 100}%`,
                        borderColor: catColor,
                        backgroundColor: `${catColor}44`, // ~25% opacity
                        borderStyle: isActive ? "solid" : "dashed"
                      }}
                      onClick={() => setActiveLabel(isActive ? null : detection.label)}
                    >
                      {isActive && (
                        <div 
                          className="absolute -top-10 left-1/2 -translate-x-1/2 bg-white border border-border text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-full shadow-xl flex items-center gap-2 whitespace-nowrap pointer-events-none"
                          style={{ color: "black" }} // Black text on white label for contrast
                        >
                          <div className="w-2.5 h-2.5 rounded-full shadow-sm" style={{ backgroundColor: catColor }} />
                          {detection.label}
                        </div>
                      )}
                      <div className="absolute bottom-2 right-2 w-6 h-6 bg-background/80 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
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

          {/* Right Column: Legend & Status (Summarized) */}
          <div className="lg:col-span-6 xl:col-span-5 flex flex-col gap-6">
            <div className="bg-card rounded-3xl p-6 md:p-8 border border-border shadow-lg shadow-black/5">
              <h3 className="font-display text-2xl mb-6 italic">Detected Layout</h3>
              
              <div className="grid grid-cols-2 gap-3">
                {categories.length === 0 ? (
                  <p className="text-muted-foreground italic text-sm">No unique zones identified.</p>
                ) : (
                  categories.map(({ label, count }) => {
                    const isActive = activeLabel === label;
                    const catColor = getFurnitureColor(label);
                    return (
                      <button
                        key={label}
                        onClick={() => setActiveLabel(isActive ? null : label)}
                        className={clsx(
                          "w-full text-left flex items-center justify-between p-3 rounded-xl border transition-all duration-300 group",
                          isActive 
                            ? "border-foreground/20 shadow-md transform scale-[1.01]" 
                            : "bg-background border-border hover:border-foreground/20 hover:shadow-md"
                        )}
                        style={isActive ? { backgroundColor: catColor } : {}}
                      >
                        <div className="flex items-center gap-4">
                          <div 
                            className="w-5 h-5 rounded-lg border border-foreground/10 shadow-sm" 
                            style={{ backgroundColor: catColor }} 
                          />
                          <span className={clsx(
                            "font-semibold capitalize text-lg tracking-tight",
                            isActive ? "text-black" : "text-foreground/80"
                          )}>
                            {label.replace(/_/g, " ")}
                          </span>
                        </div>
                        <div className={clsx(
                          "flex items-center justify-center min-w-[32px] h-8 rounded-full border px-2 text-sm font-bold transition-colors",
                          isActive 
                            ? "bg-white/80 border-foreground/10 text-black shadow-sm" 
                            : "bg-muted border-border text-muted-foreground group-hover:bg-background"
                        )}>
                          {count}
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
              
              {activeLabel && (
                <button 
                  onClick={() => setActiveLabel(null)}
                  className="w-full mt-8 py-3 text-sm font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground transition-all border border-border border-dashed rounded-xl bg-background hover:bg-muted shadow-sm"
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
                {activeLabel 
                  ? `Recommended pieces specifically for the selected ${activeLabel.replace(/_/g, " ").toLowerCase()} detections.`
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
