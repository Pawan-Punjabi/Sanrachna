import { supabase } from "./supabase";

// ─── Auth helpers ─────────────────────────────────────────────────────────────

/** Returns the currently logged-in user, or null. */
export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

/** Email + password signup. Auto-inserts a users profile row (via DB trigger). */
export async function signUp(email: string, password: string) {
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw error;
  return data;
}

/** Email + password login. */
export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

/** Sign out and clear session. */
export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

// ─── User plan helpers ────────────────────────────────────────────────────────

/** Returns the plan for the given user id. */
export async function getUserPlan(userId: string): Promise<"free" | "pro"> {
  const { data, error } = await supabase
    .from("users")
    .select("plan")
    .eq("id", userId)
    .single();

  if (error || !data) return "free";
  return data.plan as "free" | "pro";
}

/** Upgrades the current user to pro. */
export async function upgradeToPro(userId: string) {
  const { error } = await supabase
    .from("users")
    .update({ plan: "pro" })
    .eq("id", userId);
  if (error) throw error;
}

/** Downgrades the current user to free. */
export async function downgradeToFree(userId: string) {
  const { error } = await supabase
    .from("users")
    .update({ plan: "free" })
    .eq("id", userId);
  if (error) throw error;
}

// ─── Floor plan helpers ───────────────────────────────────────────────────────

/**
 * Saves a floor plan record for a user.
 * Note: actual uploads happen via the Express API (which handles multer/file storage).
 */
export async function saveFloorPlan(userId: string, imageUrl: string, name = "Untitled Plan") {
  const { data, error } = await supabase
    .from("floor_plans")
    .insert({ user_id: userId, image_url: imageUrl, name })
    .select()
    .single();
  if (error) throw error;
  return data;
}

/**
 * Saves multiple detections for a floor plan.
 * Each detection should have: { furniture_label, bounding_box, confidence_score }
 */
export async function saveDetections(
  floorPlanId: number,
  detections: Array<{
    furniture_label: string;
    bounding_box: { x: number; y: number; w: number; h: number };
    confidence_score: number;
  }>
) {
  const rows = detections.map(d => ({ ...d, floor_plan_id: floorPlanId }));
  const { data, error } = await supabase.from("detections").insert(rows).select();
  if (error) throw error;
  return data;
}

/**
 * Saves product suggestions for a detection.
 */
export async function saveProductSuggestions(
  detectionId: number,
  products: Array<{
    store_name: string;
    product_name: string;
    price: string;
    rating?: number;
    product_url: string;
    product_image_url: string;
  }>
) {
  const rows = products.map(p => ({ ...p, detection_id: detectionId }));
  const { data, error } = await supabase.from("product_suggestions").insert(rows).select();
  if (error) throw error;
  return data;
}

/**
 * Fetches all floor plans for a user, including detections and product suggestions.
 */
export async function getUserHistory(userId: string) {
  const { data, error } = await supabase
    .from("floor_plans")
    .select(`
      *,
      detections (
        *,
        product_suggestions (*)
      )
    `)
    .eq("user_id", userId)
    .order("uploaded_at", { ascending: false });

  if (error) throw error;
  return data;
}
