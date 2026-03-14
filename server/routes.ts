import type { Express } from "express";
import express from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { getSupabaseClient } from "./supabase";
import { api } from "@shared/routes";
import multer from "multer";
import path from "path";
import fs from "fs";

// Ensure uploads directory exists
const uploadsDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const upload = multer({
  storage: multer.diskStorage({
    destination: uploadsDir,
    filename: (_req, file, cb) => {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      cb(null, uniqueSuffix + path.extname(file.originalname));
    },
  }),
  limits: { fileSize: 10 * 1024 * 1024 },
});

/** Extract Bearer token from Authorization header */
function extractToken(req: express.Request): string | undefined {
  const auth = req.headers.authorization;
  if (auth?.startsWith("Bearer ")) return auth.slice(7);
  return undefined;
}

/** Get user id from a Supabase access token */
async function getUserId(token?: string): Promise<string | undefined> {
  if (!token) return undefined;
  try {
    const sb = getSupabaseClient(token);
    const { data: { user } } = await sb.auth.getUser();
    return user?.id;
  } catch {
    return undefined;
  }
}

export async function registerRoutes(httpServer: Server, app: Express): Promise<Server> {
  app.use("/uploads", express.static(uploadsDir));

  // ── GET /api/floor-plans/:id ──────────────────────────────────────────────
  app.get(api.floorPlans.get.path, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: "Invalid ID" });

      const token = extractToken(req);
      const plan = await storage.getFloorPlan(id, token);
      if (!plan) return res.status(404).json({ message: "Floor plan not found" });

      res.json(normalisePlan(plan));
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ message: err.message ?? "Failed to fetch floor plan" });
    }
  });

  // ── DELETE /api/floor-plans/:id ───────────────────────────────────────────
  app.delete(api.floorPlans.delete.path, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: "Invalid ID" });

      const token = extractToken(req);
      const plan = await storage.getFloorPlan(id, token);
      if (plan?.image_url) {
        const filePath = path.join(process.cwd(), plan.image_url);
        try { if (fs.existsSync(filePath)) fs.unlinkSync(filePath); } catch {}
      }

      await storage.deleteFloorPlan(id, token);
      res.status(204).end();
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ message: err.message ?? "Failed to delete floor plan" });
    }
  });

  // ── POST /api/floor-plans/upload ─────────────────────────────────────────
  app.post(api.floorPlans.upload.path, upload.single("image"), async (req, res) => {
    try {
      if (!req.file) return res.status(400).json({ message: "No image file provided" });

      const imageUrl = "/uploads/" + req.file.filename;
      const name = req.file.originalname;
      const token = extractToken(req);
      const userId = await getUserId(token);

      // 1. Create Floor Plan
      const floorPlanId = await storage.createFloorPlan(
        { image_url: imageUrl, name, user_id: userId ?? null },
        token
      );

      // 2. Mock YOLO Detections
      const mockDetections = [
        { label: "bed",          confidence: 0.92, x: 0.1, y: 0.1, w: 0.3, h: 0.4 },
        { label: "sofa",         confidence: 0.88, x: 0.5, y: 0.2, w: 0.4, h: 0.2 },
        { label: "dining table", confidence: 0.75, x: 0.2, y: 0.6, w: 0.3, h: 0.3 },
      ];

      for (const d of mockDetections) {
        const detectionId = await storage.createDetection({
          floor_plan_id: floorPlanId,
          furniture_label: d.label,
          bounding_box: { x: d.x, y: d.y, w: d.w, h: d.h },
          confidence_score: d.confidence,
        }, token);

        // 3. Mock Product Suggestions
        const products = getMockProducts(d.label);
        for (const p of products) {
          await storage.createProductSuggestion({ detection_id: detectionId, ...p }, token);
        }
      }

      res.status(201).json({ id: floorPlanId, imageUrl, name, message: "Upload and analysis complete" });
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ message: err.message ?? "Internal server error during upload" });
    }
  });

  // ── GET /api/floor-plans (list for current user) ──────────────────────────
  app.get(api.floorPlans.list.path, async (req, res) => {
    try {
      const token = extractToken(req);
      const userId = await getUserId(token);
      if (!userId) return res.json([]);

      const plans = await storage.getUserFloorPlans(userId, token);
      res.json(plans.map(normalisePlan));
    } catch (err: any) {
      res.status(500).json({ message: err.message ?? "Failed to list plans" });
    }
  });

  return httpServer;
}

// ── Normalise Supabase row → frontend camelCase shape ────────────────────────

function normalisePlan(plan: any) {
  return {
    id: plan.id,
    name: plan.name,
    imageUrl: plan.image_url,
    createdAt: plan.uploaded_at,
    detections: (plan.detections ?? []).map((d: any) => ({
      id: d.id,
      label: d.furniture_label,
      confidence: d.confidence_score,
      boxX: d.bounding_box?.x ?? 0,
      boxY: d.bounding_box?.y ?? 0,
      boxW: d.bounding_box?.w ?? 0,
      boxH: d.bounding_box?.h ?? 0,
      products: (d.product_suggestions ?? []).map((p: any) => ({
        id: p.id,
        name: p.product_name,
        price: p.price,
        rating: p.rating,
        storeName: p.store_name,
        productLink: p.product_url,
        imageUrl: p.product_image_url,
      })),
    })),
  };
}

// ── Mock product generator ────────────────────────────────────────────────────

function getMockProducts(label: string) {
  const images: Record<string, string> = {
    "bed":          "https://images.unsplash.com/photo-1505693314120-0d443867891c?w=500&q=80",
    "sofa":         "https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?w=500&q=80",
    "dining table": "https://images.unsplash.com/photo-1533090481728-8bbf9425e01c?w=500&q=80",
  };
  const img = images[label] ?? "https://images.unsplash.com/photo-1538688525198-9b88f6f53126?w=500&q=80";
  const cap = label.charAt(0).toUpperCase() + label.slice(1);

  return [
    { store_name: "IKEA",    product_name: "Modern " + cap,     price: "$299.99", rating: 4.5, product_url: "https://www.ikea.com",    product_image_url: img },
    { store_name: "Amazon",  product_name: "Minimalist " + cap, price: "$199.99", rating: 4.2, product_url: "https://www.amazon.com",  product_image_url: img },
    { store_name: "Wayfair", product_name: "Premium " + cap,    price: "$499.99", rating: 4.8, product_url: "https://www.wayfair.com", product_image_url: img },
  ];
}
