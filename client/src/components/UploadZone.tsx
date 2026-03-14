import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { UploadCloud, Image as ImageIcon, CheckCircle2, AlertCircle, Scan, Zap } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";
import { usePlan } from "@/context/plan-context";
import { useAuth } from "@/context/auth-context";
import { api } from "@shared/routes";
import type { UploadResponse } from "@shared/schema";

type UploadState = "idle" | "scanning" | "success" | "error";

async function uploadFile(file: File, accessToken?: string): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append("image", file);

  const headers: Record<string, string> = {};
  if (accessToken) headers["Authorization"] = "Bearer " + accessToken;

  const res = await fetch(api.floorPlans.upload.path, {
    method: api.floorPlans.upload.method,
    body: formData,
    credentials: "include",
    headers,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || "Upload failed");
  }
  return res.json();
}

export function UploadZone() {
  const [, setLocation] = useLocation();
  const [state, setState] = useState<UploadState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const { isPro } = usePlan();
  const { session } = useAuth();

  const maxFiles = isPro ? 10 : 1;

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (!acceptedFiles.length) {
      setError("Please upload a valid image file.");
      setState("error");
      return;
    }

    setError(null);
    setState("scanning");

    const files = acceptedFiles.slice(0, maxFiles);
    setProgress({ done: 0, total: files.length });

    const accessToken = session?.access_token;
    let firstId: number | null = null;

    for (const file of files) {
      try {
        const data = await uploadFile(file, accessToken);
        if (firstId === null) firstId = data.id;
        setProgress(p => ({ ...p, done: p.done + 1 }));
      } catch (err: any) {
        setError(err?.message || "Failed to analyze a floor plan.");
        setState("error");
        return;
      }
    }

    setState("success");
    if (firstId !== null) {
      setTimeout(() => {
        setLocation(`/analyzer/${firstId}`);
      }, 1200);
    }
  }, [setLocation, maxFiles, session]);

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: {
      "image/jpeg": [".jpg", ".jpeg"],
      "image/png": [".png"],
      "image/webp": [".webp"],
    },
    maxFiles,
    multiple: isPro,
    disabled: state === "scanning" || state === "success",
  });

  const isScanning = state === "scanning";
  const isSuccess = state === "success";
  const isError = state === "error";

  return (
    <div className="w-full">
      {isPro && (
        <div className="flex items-center gap-1.5 mb-3">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-accent/10 text-accent text-xs font-bold uppercase tracking-wider border border-accent/20">
            <Zap size={10} className="fill-current" />
            Pro — up to {maxFiles} images per upload
          </span>
        </div>
      )}

      <div
        {...getRootProps()}
        data-testid="upload-zone"
        className={`
          relative overflow-hidden group cursor-pointer
          rounded-3xl border-2 border-dashed
          transition-all duration-500 ease-out
          flex flex-col items-center justify-center
          min-h-[200px] p-6 text-center
          ${isDragActive ? "border-accent bg-accent/5 scale-[1.02]" : "border-border bg-card hover:border-primary/30 hover:bg-secondary/30"}
          ${(isDragReject || isError) ? "border-destructive bg-destructive/5" : ""}
          ${isScanning ? "pointer-events-none border-accent/30 bg-secondary/50" : ""}
          ${isSuccess ? "pointer-events-none border-green-500/50 bg-green-500/5" : ""}
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
              <div className="relative w-20 h-20 mb-5">
                <div className="absolute inset-0 rounded-full border-4 border-muted" />
                <div className="absolute inset-0 rounded-full border-4 border-accent border-t-transparent animate-spin" />
                <Scan className="absolute inset-0 m-auto text-accent animate-pulse" size={28} />
              </div>
              <h3 className="text-lg font-display font-semibold mb-1">Analyzing Space</h3>
              {progress.total > 1 && (
                <p className="text-xs text-accent font-semibold mb-1">
                  {progress.done} / {progress.total} files processed
                </p>
              )}
              <p className="text-muted-foreground text-sm">Identifying walls, doors, and suggesting layouts...</p>
            </motion.div>
          ) : isSuccess ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center z-10 text-green-600 dark:text-green-400"
            >
              <div className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-5">
                <CheckCircle2 size={40} />
              </div>
              <h3 className="text-lg font-display font-semibold text-foreground mb-1">Analysis Complete</h3>
              <p className="text-muted-foreground text-sm">Redirecting to your interactive blueprint...</p>
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
                w-16 h-16 rounded-2xl flex items-center justify-center mb-5 shadow-sm transition-colors duration-300
                ${isDragActive ? "bg-accent text-accent-foreground" : "bg-secondary text-muted-foreground"}
                ${(isDragReject || isError) ? "bg-destructive text-destructive-foreground" : ""}
              `}>
                {isDragReject || isError ? (
                  <AlertCircle size={30} />
                ) : isDragActive ? (
                  <UploadCloud size={30} />
                ) : (
                  <ImageIcon size={30} />
                )}
              </div>
              <h3 className="text-xl font-display font-medium mb-2">
                {isDragActive
                  ? isPro ? `Drop up to ${maxFiles} plans here` : "Drop floor plan here"
                  : "Upload your floor plan"}
              </h3>
              <p className="text-muted-foreground max-w-xs mb-6 text-sm leading-relaxed">
                {isPro
                  ? `Select up to ${maxFiles} JPG/PNG images. All will be analyzed with Pro insights.`
                  : "Drag and drop a JPG or PNG of your space, or click to browse."}
              </p>

              <div className="px-5 py-2.5 rounded-full bg-primary text-primary-foreground font-medium text-sm shadow-md group-hover:shadow-lg group-hover:-translate-y-0.5 transition-all duration-300">
                {isPro ? `Select Files (up to ${maxFiles})` : "Select File"}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {isScanning && (
          <motion.div
            className="absolute left-0 right-0 h-0.5 bg-accent/80 shadow-[0_0_20px_4px_rgba(200,130,103,0.4)] z-0"
            animate={{ top: ["0%", "100%", "0%"] }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          />
        )}
      </div>

      {isError && error && (
        <motion.p
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-3 text-center text-sm font-medium text-destructive"
        >
          {error}
        </motion.p>
      )}
    </div>
  );
}
