import { z } from "zod";

// ─── Supabase-aligned types ───────────────────────────────────────────────────

export interface User {
  id: string;
  email: string;
  first_name?: string | null;
  plan: "free" | "pro";
  created_at: string;
}

export interface FloorPlan {
  id: number;
  user_id: string | null;
  image_url: string;
  name: string;
  uploaded_at: string;
}

export interface Detection {
  id: number;
  floor_plan_id: number;
  furniture_label: string;
  bounding_box: { x: number; y: number; w: number; h: number };
  confidence_score: number;
}

export interface ProductSuggestion {
  id: number;
  detection_id: number;
  store_name: string;
  product_name: string;
  price: string;
  rating: number | null;
  product_url: string;
  product_image_url: string;
  created_at: string;
}

// ─── Composed / extended types ────────────────────────────────────────────────

export type DetectionWithProducts = Detection & {
  products: ProductSuggestion[];
};

export type FloorPlanWithDetails = FloorPlan & {
  detections: DetectionWithProducts[];
};

// ─── Legacy-compatible normalised shapes (returned by the Express API) ────────
// The frontend expects camelCase keys; the server's normalisePlan() converts.

export interface NormalisedProduct {
  id: number;
  name: string;
  price: string;
  rating: number | null;
  storeName: string;
  productLink: string;
  imageUrl: string;
}

export interface NormalisedDetection {
  id: number;
  label: string;
  confidence: number;
  boxX: number;
  boxY: number;
  boxW: number;
  boxH: number;
  products: NormalisedProduct[];
}

export interface NormalisedFloorPlan {
  id: number;
  name: string;
  imageUrl: string;
  createdAt: string;
  detections: NormalisedDetection[];
}

export type UploadResponse = {
  id: number;
  imageUrl: string;
  name: string;
  message: string;
};

// ─── Zod schemas (for server-side validation) ─────────────────────────────────

export const insertFloorPlanSchema = z.object({
  image_url: z.string().min(1),
  name: z.string().min(1),
  user_id: z.string().uuid().nullable().optional(),
});

export const insertDetectionSchema = z.object({
  floor_plan_id: z.number().int().positive(),
  furniture_label: z.string().min(1),
  bounding_box: z.object({ x: z.number(), y: z.number(), w: z.number(), h: z.number() }),
  confidence_score: z.number().min(0).max(1),
});

export const insertProductSuggestionSchema = z.object({
  detection_id: z.number().int().positive(),
  store_name: z.string().min(1),
  product_name: z.string().min(1),
  price: z.string().min(1),
  rating: z.number().nullable().optional(),
  product_url: z.string().url(),
  product_image_url: z.string().url(),
});

export type InsertFloorPlan = z.infer<typeof insertFloorPlanSchema>;
export type InsertDetection = z.infer<typeof insertDetectionSchema>;
export type InsertProductSuggestion = z.infer<typeof insertProductSuggestionSchema>;
