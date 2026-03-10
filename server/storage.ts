import { db } from "./db";
import {
  floorPlans,
  detections,
  suggestedProducts,
  type InsertFloorPlan,
  type InsertDetection,
  type InsertSuggestedProduct,
  type FloorPlanWithDetails,
} from "@shared/schema";
import { eq } from "drizzle-orm";

export interface IStorage {
  createFloorPlan(plan: InsertFloorPlan): Promise<number>;
  createDetection(detection: InsertDetection): Promise<number>;
  createSuggestedProduct(product: InsertSuggestedProduct): Promise<number>;
  getFloorPlan(id: number): Promise<FloorPlanWithDetails | undefined>;
  getFloorPlans(): Promise<FloorPlanWithDetails[]>;
  deleteFloorPlan(id: number): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async createFloorPlan(plan: InsertFloorPlan): Promise<number> {
    const [result] = await db.insert(floorPlans).values(plan).returning({ id: floorPlans.id });
    return result.id;
  }

  async createDetection(detection: InsertDetection): Promise<number> {
    const [result] = await db.insert(detections).values(detection).returning({ id: detections.id });
    return result.id;
  }

  async createSuggestedProduct(product: InsertSuggestedProduct): Promise<number> {
    const [result] = await db.insert(suggestedProducts).values(product).returning({ id: suggestedProducts.id });
    return result.id;
  }

  async getFloorPlan(id: number): Promise<FloorPlanWithDetails | undefined> {
    const plan = await db.query.floorPlans.findFirst({
      where: eq(floorPlans.id, id),
      with: {
        detections: {
          with: {
            products: true,
          },
        },
      },
    });
    return plan as FloorPlanWithDetails | undefined;
  }

  async getFloorPlans(): Promise<FloorPlanWithDetails[]> {
    const plans = await db.query.floorPlans.findMany({
      with: {
        detections: {
          with: {
            products: true,
          },
        },
      },
      orderBy: (floorPlans, { desc }) => [desc(floorPlans.createdAt)],
    });
    return plans as FloorPlanWithDetails[];
  }

  async deleteFloorPlan(id: number): Promise<void> {
    await db.delete(floorPlans).where(eq(floorPlans.id, id));
    // cascade deletes will happen or we can delete manually, 
    // but Drizzle standard without foreign key cascades requires manual if not configured
    await db.delete(detections).where(eq(detections.floorPlanId, id));
  }
}

export const storage = new DatabaseStorage();
