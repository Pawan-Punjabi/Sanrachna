import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import {
  UploadCloud,
  Image as ImageIcon,
  Trash2,
  ArrowLeft,
  Loader2,
  Box,
  Layout as LayoutIcon,
  Sparkles,
  Zap,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "wouter";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ThreeDWalkthrough } from "@/components/ThreeDWalkthrough";

export function Generate3DFloorplan() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [layoutData, setLayoutData] = useState<any | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStatus, setAnalysisStatus] = useState<string>("");
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const { toast } = useToast();
  
  const statusMessages = [
    "Reading architectural blueprints...",
    "Gemini 1.5 Flash is analyzing wall geometry...",
    "Mapping room boundaries and spatial zones...",
    "Detecting furniture placement and orientation...",
    "Generating structural 3D meshes...",
    "Finalizing digital twin reconstruction...",
  ];

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const selectedFile = acceptedFiles[0];
    if (selectedFile) {
      setFile(selectedFile);
      const reader = new FileReader();
      reader.onload = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(selectedFile);
      setLayoutData(null);
      setAnalysisProgress(0);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [] },
    multiple: false,
  });

  const removeFile = () => {
    setFile(null);
    setPreview(null);
    setLayoutData(null);
    setAnalysisProgress(0);
  };

  const handleAnalyzeLayout = async () => {
    if (!preview) return;
    setIsAnalyzing(true);
    setAnalysisProgress(0);
    setAnalysisStatus(statusMessages[0]);
    
    const progressInterval = setInterval(() => {
      setAnalysisProgress(prev => {
        if (prev >= 95) return prev;
        const next = prev + (prev < 40 ? 5 : prev < 70 ? 2 : 0.5);
        const statusIdx = Math.min(
          Math.floor((next / 100) * statusMessages.length),
          statusMessages.length - 1
        );
        setAnalysisStatus(statusMessages[statusIdx]);
        return next;
      });
    }, 400);

    try {
      const response = await fetch("/api/analyze-layout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl: preview }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Layout analysis failed");
      }

      const data = await response.json();
      setLayoutData(data);
      setAnalysisProgress(100);
      toast({ 
        title: "Workflow Complete", 
        description: "Layout detected, rooms understood, and furniture recommended." 
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Analysis Failed",
        description: error.message || "Failed to reach the server. Please check if the backend is running.",
      });
    } finally {
      clearInterval(progressInterval);
      setIsAnalyzing(false);
    }
  };

  // Helper to count unique furniture items
  const getUniqueFurniture = () => {
    if (!layoutData?.furniture) return [];
    const counts: Record<string, number> = {};
    layoutData.furniture.forEach((f: any) => {
      counts[f.label] = (counts[f.label] || 0) + 1;
    });
    return Object.entries(counts).map(([label, count]) => ({ label, count }));
  };

  return (
    <Layout hideFooter>
      <div className="flex-1 flex flex-col overflow-hidden px-4 sm:px-6 lg:px-8 pt-3 pb-0 bg-[#0a0a0a] text-white">
        {/* Header Section */}
        <div className="flex items-center justify-between mb-3 shrink-0">
          <div className="flex items-center gap-3">
            <Link href="/" className="inline-flex items-center text-xs text-zinc-500 hover:text-white transition-colors cursor-pointer">
              <ArrowLeft size={14} className="mr-1" /> Home
            </Link>
            <span className="text-zinc-800">/</span>
            <h1 className="text-lg font-display font-medium tracking-tight text-white flex items-center gap-2">
              <Box className="text-[#d97706]" size={18} />
              AI Scene Generator
            </h1>
          </div>
          
          {layoutData && (
            <div className="flex items-center gap-2 px-3 py-1 bg-[#d97706]/10 rounded-full border border-[#d97706]/20">
              <Sparkles size={12} className="text-[#d97706]" />
              <span className="text-[9px] font-bold uppercase tracking-wider text-[#d97706]">3D Preview Active</span>
            </div>
          )}
        </div>

        {/* Main Content Area */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 overflow-hidden min-h-0">
          {/* LEFT: Controls */}
          <div className="lg:col-span-4 flex flex-col gap-4 overflow-hidden min-h-0">
            {/* COMPACT Floor Plan Input */}
            <Card className="p-4 border-zinc-800 bg-zinc-900 shadow-2xl flex flex-col shrink-0 rounded-[1.5rem]">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-display font-semibold flex items-center gap-2 text-zinc-100">
                  <UploadCloud size={14} className="text-[#d97706]" />
                  Floor Plan Input
                </h3>
                {file && (
                  <button onClick={removeFile} className="text-zinc-500 hover:text-red-400 transition-colors">
                    <Trash2 size={14} />
                  </button>
                )}
              </div>

              {!preview ? (
                <div
                  {...getRootProps()}
                  className={`
                    border-2 border-dashed rounded-2xl p-4 text-center cursor-pointer transition-all duration-500 flex flex-col items-center justify-center gap-2
                    ${isDragActive
                      ? "border-[#d97706] bg-[#d97706]/5 scale-[1.01]"
                      : "border-zinc-800 hover:border-[#d97706]/40 bg-zinc-900/50"}
                  `}
                >
                  <input {...getInputProps()} />
                  <div className="w-10 h-10 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center">
                    <ImageIcon size={18} className="text-zinc-500" />
                  </div>
                  <p className="text-[10px] font-semibold text-zinc-300">Drop 2D plan here</p>
                </div>
              ) : (
                <div className="relative rounded-xl overflow-hidden border border-zinc-800 group h-32 bg-zinc-950">
                  <img
                    src={preview}
                    alt="Floor plan preview"
                    className="w-full h-full object-contain"
                  />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center backdrop-blur-sm text-[10px] font-bold text-white tracking-widest uppercase">
                    Change Image
                  </div>
                </div>
              )}

              <Button
                onClick={handleAnalyzeLayout}
                disabled={!file || isAnalyzing}
                className="mt-3 py-5 text-[11px] font-bold rounded-xl shadow-lg shadow-[#d97706]/20 hover:shadow-[#d97706]/30 hover:-translate-y-0.5 transition-all duration-300 bg-[#d97706] text-white border-none shrink-0"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Zap className="mr-2 h-3 w-3 fill-current" />
                    Generate 3D Scene
                  </>
                )}
              </Button>

              {isAnalyzing && (
                <div className="mt-2 space-y-1.5">
                  <div className="h-1 w-full bg-zinc-800 rounded-full overflow-hidden">
                    <motion.div 
                      className="h-full bg-[#d97706]"
                      initial={{ width: 0 }}
                      animate={{ width: `${analysisProgress}%` }}
                    />
                  </div>
                  <p className="text-[9px] text-center text-[#d97706] font-medium animate-pulse truncate">
                    {analysisStatus}
                  </p>
                </div>
              )}
            </Card>

            {/* Spatial Intelligence Card */}
            <div className="flex-1 overflow-hidden min-h-0">
              {layoutData && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="h-full"
                >
                  <Card className="h-full p-4 border-zinc-800 bg-zinc-900 shadow-2xl rounded-[1.5rem] flex flex-col min-h-0">
                    <h3 className="text-xs font-display font-semibold mb-3 flex items-center gap-2 border-b border-zinc-800 pb-3 text-zinc-100 shrink-0">
                      <LayoutIcon size={14} className="text-zinc-400" />
                      Spatial Summary
                    </h3>
                    
                    <div className="flex-1 overflow-y-auto pr-1 space-y-4 custom-scrollbar pb-6">
                      <div className="grid grid-cols-2 gap-2">
                        <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-800">
                          <p className="text-[8px] uppercase tracking-widest text-zinc-500 font-bold mb-0.5">Walls</p>
                          <p className="text-base font-display font-bold text-zinc-100">{layoutData.walls.length}</p>
                        </div>
                        <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-800">
                          <p className="text-[8px] uppercase tracking-widest text-zinc-500 font-bold mb-0.5">Rooms</p>
                          <p className="text-base font-display font-bold text-zinc-100">{layoutData.rooms.length}</p>
                        </div>
                      </div>

                      <div className="p-3.5 bg-[#d97706]/5 rounded-xl border border-[#d97706]/10">
                        <p className="text-[8px] uppercase tracking-widest text-[#d97706] font-bold mb-2.5">Furniture Mapping</p>
                        <div className="flex flex-wrap gap-2">
                          {getUniqueFurniture().map((item, i) => (
                            <div key={i} className="flex items-center gap-2 px-2.5 py-1.5 bg-zinc-950 border border-zinc-800 rounded-lg">
                              <div className="w-1 h-1 rounded-full bg-[#d97706]" />
                              <span className="text-[10px] text-zinc-300 font-medium">
                                {item.label}
                                {item.count > 1 && <span className="ml-1 text-[#d97706]">x{item.count}</span>}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              )}
            </div>
          </div>

          {/* RIGHT: 3D Viewer */}
          <div className="lg:col-span-8 flex flex-col min-h-0 overflow-hidden">
            <Card className="flex-1 relative overflow-hidden border-zinc-800 bg-zinc-950 shadow-2xl flex flex-col items-center justify-center min-h-0 rounded-[2rem]">
              <AnimatePresence mode="wait">
                {layoutData ? (
                  <motion.div
                    key="viewer"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="w-full h-full"
                  >
                    <ThreeDWalkthrough layout={layoutData} />
                  </motion.div>
                ) : isAnalyzing ? (
                  <motion.div
                    key="loading"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-center space-y-3"
                  >
                    <div className="relative w-16 h-16 mx-auto">
                      <div className="absolute inset-0 border-3 border-[#d97706]/10 rounded-full" />
                      <div className="absolute inset-0 border-3 border-[#d97706] border-t-transparent rounded-full animate-spin" />
                      <div className="absolute inset-3 bg-[#d97706]/5 rounded-full flex items-center justify-center">
                        <Sparkles className="text-[#d97706] animate-pulse" size={20} />
                      </div>
                    </div>
                    <div className="space-y-0.5">
                      <h3 className="text-base font-display font-bold text-zinc-100">{analysisStatus}</h3>
                      <p className="text-[10px] text-zinc-500">Processing structural layout...</p>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center space-y-3 max-w-sm px-6"
                  >
                    <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mx-auto shadow-inner">
                      <Box size={32} className="text-zinc-800" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-base font-display font-bold text-zinc-100">Interactive Walkthrough</h3>
                      <p className="text-[10px] text-zinc-500">
                        Upload your 2D floor plan to see it in 3D.
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}

