import { getSupabaseClient } from "./supabase";

// ─── Types that match the new Supabase schema ────────────────────────────────

export interface ProductSuggestion {
  id: number;
  detection_id: number;
  store_name: string;
  product_name: string;
  price: string;
  rating: number | null;
  product_url: string;
  product_image_url: string;
}

export interface Detection {
  id: number;
  floor_plan_id: number;
  furniture_label: string;
  bounding_box: { x: number; y: number; w: number; h: number };
  confidence_score: number;
  product_suggestions?: ProductSuggestion[];
}

export interface FloorPlan {
  id: number;
  user_id: string | null;
  image_url: string;
  name: string;
  uploaded_at: string;
  detections?: Detection[];
}

export interface InsertFloorPlan {
  image_url: string;
  name: string;
  user_id?: string | null;
}

export interface InsertDetection {
  floor_plan_id: number;
  furniture_label: string;
  bounding_box: { x: number; y: number; w: number; h: number };
  confidence_score: number;
}

export interface InsertProductSuggestion {
  detection_id: number;
  store_name: string;
  product_name: string;
  price: string;
  rating?: number | null;
  product_url: string;
  product_image_url: string;
}

// ─── Storage class ────────────────────────────────────────────────────────────

export class SupabaseStorage {
  /** Creates a floor plan record. Returns the new row ID. */
  async createFloorPlan(plan: InsertFloorPlan, token?: string): Promise<number> {
    const sb = getSupabaseClient(token);
    const { data, error } = await sb
      .from("floor_plans")
      .insert({ image_url: plan.image_url, name: plan.name, user_id: plan.user_id ?? null })
      .select("id")
      .single();

    if (error) throw new Error("createFloorPlan: " + error.message);
    return data.id;
  }

  /** Creates a detection row. Returns the new row ID. */
  async createDetection(det: InsertDetection, token?: string): Promise<number> {
    const sb = getSupabaseClient(token);
    const { data, error } = await sb
      .from("detections")
      .insert({
        floor_plan_id: det.floor_plan_id,
        furniture_label: det.furniture_label,
        bounding_box: det.bounding_box,
        confidence_score: det.confidence_score,
      })
      .select("id")
      .single();

    if (error) throw new Error("createDetection: " + error.message);
    return data.id;
  }

  /** Creates a product suggestion row. Returns the new row ID. */
  async createProductSuggestion(ps: InsertProductSuggestion, token?: string): Promise<number> {
    const sb = getSupabaseClient(token);
    const { data, error } = await sb
      .from("product_suggestions")
      .insert({
        detection_id: ps.detection_id,
        store_name: ps.store_name,
        product_name: ps.product_name,
        price: ps.price,
        rating: ps.rating ?? null,
        product_url: ps.product_url,
        product_image_url: ps.product_image_url,
      })
      .select("id")
      .single();

    if (error) throw new Error("createProductSuggestion: " + error.message);
    return data.id;
  }

  /** Fetches a single floor plan with its detections and product suggestions. */
  async getFloorPlan(id: number, token?: string): Promise<FloorPlan | null> {
    const sb = getSupabaseClient(token);
    const { data, error } = await sb
      .from("floor_plans")
      .select(`
        *,
        detections (
          *,
          product_suggestions (*)
        )
      `)
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === "PGRST116") return null; // not found
      throw new Error("getFloorPlan: " + error.message);
    }
    return data as FloorPlan;
  }

  /** Fetches all floor plans for a given user (ordered newest first). */
  async getUserFloorPlans(userId: string, token?: string): Promise<FloorPlan[]> {
    const sb = getSupabaseClient(token);
    const { data, error } = await sb
      .from("floor_plans")
      .select(`*, detections(*, product_suggestions(*))`)
      .eq("user_id", userId)
      .order("uploaded_at", { ascending: false });

    if (error) throw new Error("getUserFloorPlans: " + error.message);
    return (data ?? []) as FloorPlan[];
  }

  /** Deletes a floor plan (cascades to detections + product_suggestions via FK). */
  async deleteFloorPlan(id: number, token?: string): Promise<void> {
    const sb = getSupabaseClient(token);
    const { error } = await sb.from("floor_plans").delete().eq("id", id);
    if (error) throw new Error("deleteFloorPlan: " + error.message);
  }

  /** Returns the user's plan tier from the users table. */
  async getUserPlan(userId: string, token?: string): Promise<"free" | "pro"> {
    const sb = getSupabaseClient(token);
    const { data, error } = await sb
      .from("users")
      .select("plan")
      .eq("id", userId)
      .single();

    if (error) return "free";
    return (data?.plan as "free" | "pro") ?? "free";
  }

  /** Upgrades a user's plan to 'pro'. */
  async upgradeToPro(userId: string, token?: string): Promise<void> {
    const sb = getSupabaseClient(token);
    const { error } = await sb
      .from("users")
      .update({ plan: "pro" })
      .eq("id", userId);

    if (error) throw new Error("upgradeToPro: " + error.message);
  }

  /** Downgrades a user's plan to 'free'. */
  async downgradeToFree(userId: string, token?: string): Promise<void> {
    const sb = getSupabaseClient(token);
    const { error } = await sb
      .from("users")
      .update({ plan: "free" })
      .eq("id", userId);

    if (error) throw new Error("downgradeToFree: " + error.message);
  }
}

export const storage = new SupabaseStorage();
