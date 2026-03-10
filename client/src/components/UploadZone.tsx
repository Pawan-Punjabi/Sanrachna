import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { UploadCloud, Image as ImageIcon, CheckCircle2, Loader2, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useUploadFloorPlan } from "@/hooks/use-floor-plans";
import { useLocation } from "wouter";

export function UploadZone() {
  const [, setLocation] = useLocation();
  const [error, setError] = useState<string | null>(null);
  
  const uploadMutation = useUploadFloorPlan();

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setError(null);
    const file = acceptedFiles[0];
    
    if (!file) {
      setError("Please upload a valid image file.");
      return;
    }

    uploadMutation.mutate(file, {
      onSuccess: (data) => {
        // Adding a slight delay to let the success animation play
        setTimeout(() => {
          setLocation(`/floor-plan/${data.id}`);
        }, 1500);
      },
      onError: (err) => {
        setError(err.message || "Failed to analyze the floor plan.");
      }
    });
  }, [uploadMutation, setLocation]);

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/webp': ['.webp']
    },
    maxFiles: 1,
    disabled: uploadMutation.isPending || uploadMutation.isSuccess
  });

  const isScanning = uploadMutation.isPending;
  const isSuccess = uploadMutation.isSuccess;

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div 
        {...getRootProps()} 
        className={`
          relative overflow-hidden group cursor-pointer
          rounded-3xl border-2 border-dashed
          transition-all duration-500 ease-out
          flex flex-col items-center justify-center
          min-h-[400px] p-8 text-center
          ${isDragActive ? 'border-accent bg-accent/5 scale-[1.02]' : 'border-border bg-card hover:border-primary/30 hover:bg-secondary/30'}
          ${isDragReject || error ? 'border-destructive bg-destructive/5' : ''}
          ${isScanning ? 'pointer-events-none border-primary/20 bg-secondary/50' : ''}
          ${isSuccess ? 'pointer-events-none border-green-500/50 bg-green-500/5' : ''}
        `}
      >
        <input {...getInputProps()} />

        <AnimatePresence mode="wait">
          {isScanning ? (
            <motion.div
              key="scanning"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="flex flex-col items-center z-10"
            >
              <div className="relative w-24 h-24 mb-6">
                <div className="absolute inset-0 rounded-full border-4 border-muted"></div>
                <div className="absolute inset-0 rounded-full border-4 border-accent border-t-transparent animate-spin"></div>
                <Scan className="absolute inset-0 m-auto text-accent animate-pulse" size={32} />
              </div>
              <h3 className="text-xl font-display font-semibold mb-2">Analyzing Space</h3>
              <p className="text-muted-foreground">Identifying walls, doors, and suggesting layouts...</p>
            </motion.div>
          ) : isSuccess ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center z-10 text-green-600 dark:text-green-400"
            >
              <div className="w-24 h-24 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-6">
                <CheckCircle2 size={48} />
              </div>
              <h3 className="text-xl font-display font-semibold text-foreground mb-2">Analysis Complete</h3>
              <p className="text-muted-foreground">Redirecting to your interactive blueprint...</p>
            </motion.div>
          ) : (
            <motion.div
              key="idle"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center z-10"
            >
              <div className={`
                w-20 h-20 rounded-2xl flex items-center justify-center mb-6 shadow-sm transition-colors duration-300
                ${isDragActive ? 'bg-accent text-accent-foreground shadow-accent/20' : 'bg-secondary text-muted-foreground'}
                ${isDragReject || error ? 'bg-destructive text-destructive-foreground' : ''}
              `}>
                {isDragReject || error ? (
                  <AlertCircle size={36} />
                ) : isDragActive ? (
                  <UploadCloud size={36} />
                ) : (
                  <ImageIcon size={36} />
                )}
              </div>
              <h3 className="text-2xl font-display font-medium mb-3">
                {isDragActive ? "Drop floor plan here" : "Upload your floor plan"}
              </h3>
              <p className="text-muted-foreground max-w-sm mb-8 text-balance text-sm">
                Drag and drop a JPG or PNG of your space, or click to browse. We'll automatically identify areas and recommend furnishings.
              </p>
              
              <div className="px-6 py-3 rounded-full bg-primary text-primary-foreground font-medium text-sm shadow-lg shadow-primary/20 group-hover:shadow-xl group-hover:-translate-y-0.5 transition-all duration-300">
                Select File
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Scanning Beam Animation */}
        {isScanning && (
          <motion.div 
            className="absolute left-0 right-0 h-1 bg-accent/80 shadow-[0_0_20px_4px_rgba(200,130,103,0.4)] z-0"
            animate={{ 
              top: ["0%", "100%", "0%"] 
            }}
            transition={{ 
              duration: 3, 
              repeat: Infinity,
              ease: "linear" 
            }}
          />
        )}
      </div>
      
      {error && (
        <motion.p 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 text-center text-sm font-medium text-destructive"
        >
          {error}
        </motion.p>
      )}
    </div>
  );
}
