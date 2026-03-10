import { pgTable, text, serial, integer, doublePrecision, timestamp } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const floorPlans = pgTable("floor_plans", {
  id: serial("id").primaryKey(),
  imageUrl: text("image_url").notNull(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const detections = pgTable("detections", {
  id: serial("id").primaryKey(),
  floorPlanId: integer("floor_plan_id").notNull(),
  label: text("label").notNull(),
  confidence: doublePrecision("confidence").notNull(),
  boxX: doublePrecision("box_x").notNull(),
  boxY: doublePrecision("box_y").notNull(),
  boxW: doublePrecision("box_w").notNull(),
  boxH: doublePrecision("box_h").notNull(),
});

export const suggestedProducts = pgTable("suggested_products", {
  id: serial("id").primaryKey(),
  detectionId: integer("detection_id").notNull(),
  name: text("name").notNull(),
  price: text("price").notNull(),
  rating: doublePrecision("rating"),
  storeName: text("store_name").notNull(),
  productLink: text("product_link").notNull(),
  imageUrl: text("image_url").notNull(),
});

export const floorPlansRelations = relations(floorPlans, ({ many }) => ({
  detections: many(detections),
}));

export const detectionsRelations = relations(detections, ({ one, many }) => ({
  floorPlan: one(floorPlans, {
    fields: [detections.floorPlanId],
    references: [floorPlans.id],
  }),
  products: many(suggestedProducts),
}));

export const suggestedProductsRelations = relations(suggestedProducts, ({ one }) => ({
  detection: one(detections, {
    fields: [suggestedProducts.detectionId],
    references: [detections.id],
  }),
}));

export const insertFloorPlanSchema = createInsertSchema(floorPlans).omit({ id: true, createdAt: true });
export const insertDetectionSchema = createInsertSchema(detections).omit({ id: true });
export const insertSuggestedProductSchema = createInsertSchema(suggestedProducts).omit({ id: true });

export type FloorPlan = typeof floorPlans.$inferSelect;
export type InsertFloorPlan = z.infer<typeof insertFloorPlanSchema>;

export type Detection = typeof detections.$inferSelect;
export type InsertDetection = z.infer<typeof insertDetectionSchema>;

export type SuggestedProduct = typeof suggestedProducts.$inferSelect;
export type InsertSuggestedProduct = z.infer<typeof insertSuggestedProductSchema>;

// Extended types for API responses
export type DetectionWithProducts = Detection & {
  products: SuggestedProduct[];
};

export type FloorPlanWithDetails = FloorPlan & {
  detections: DetectionWithProducts[];
};

export type UploadResponse = {
  id: number;
  imageUrl: string;
  name: string;
  message: string;
};
