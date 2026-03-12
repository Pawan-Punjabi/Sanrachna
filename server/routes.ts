import type { Express } from "express";
import express from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import multer from "multer";
import path from "path";
import fs from "fs";

// Ensure uploads directory exists
const uploadsDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Set up multer for file uploads
const upload = multer({
  storage: multer.diskStorage({
    destination: uploadsDir,
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      cb(null, uniqueSuffix + path.extname(file.originalname));
    },
  }),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
});

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Serve uploaded files statically
  app.use("/uploads", express.static(uploadsDir));

  app.get(api.floorPlans.list.path, async (req, res) => {
    try {
      const plans = await storage.getFloorPlans();
      res.json(plans);
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch floor plans" });
    }
  });

  app.get(api.floorPlans.get.path, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID" });
      }
      
      const plan = await storage.getFloorPlan(id);
      if (!plan) {
        return res.status(404).json({ message: "Floor plan not found" });
      }
      
      res.json(plan);
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch floor plan" });
    }
  });

  app.delete(api.floorPlans.delete.path, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID" });
      }

      // Get plan first so we can delete the image file
      const plan = await storage.getFloorPlan(id);
      
      if (plan?.imageUrl) {
        const filePath = path.join(process.cwd(), plan.imageUrl);
        try {
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
        } catch (fileErr) {
          console.warn("Could not delete image file:", fileErr);
        }
      }

      await storage.deleteFloorPlan(id);
      res.status(204).end();
    } catch (err) {
      res.status(500).json({ message: "Failed to delete floor plan" });
    }
  });

  // Upload and process endpoint
  app.post(api.floorPlans.upload.path, upload.single("image"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No image file provided" });
      }

      const imageUrl = "/uploads/" + req.file.filename;
      const name = req.file.originalname;

      // 1. Create Floor Plan record
      const floorPlanId = await storage.createFloorPlan({
        name,
        imageUrl,
      });

      // 2. Mock YOLO Object Detection
      const mockDetections = [
        { label: "bed", confidence: 0.92, boxX: 0.1, boxY: 0.1, boxW: 0.3, boxH: 0.4 },
        { label: "sofa", confidence: 0.88, boxX: 0.5, boxY: 0.2, boxW: 0.4, boxH: 0.2 },
        { label: "dining table", confidence: 0.75, boxX: 0.2, boxY: 0.6, boxW: 0.3, boxH: 0.3 },
      ];

      for (const d of mockDetections) {
        const detectionId = await storage.createDetection({
          floorPlanId,
          ...d
        });

        // 3. Mock Product Recommendations based on detection label
        const products = getMockProducts(d.label);
        for (const p of products) {
          await storage.createSuggestedProduct({
            detectionId,
            ...p
          });
        }
      }

      res.status(201).json({
        id: floorPlanId,
        imageUrl,
        name,
        message: "Upload and analysis complete",
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Internal server error during upload" });
    }
  });

  return httpServer;
}

// Helper to generate fake products
function getMockProducts(label: string) {
  const images: Record<string, string> = {
    "bed": "https://images.unsplash.com/photo-1505693314120-0d443867891c?w=500&q=80",
    "sofa": "https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?w=500&q=80",
    "dining table": "https://images.unsplash.com/photo-1533090481728-8bbf9425e01c?w=500&q=80",
  };

  const defaultImage = "https://images.unsplash.com/photo-1538688525198-9b88f6f53126?w=500&q=80";

  return [
    {
      name: "Modern " + label.charAt(0).toUpperCase() + label.slice(1),
      price: "$299.99",
      rating: 4.5,
      storeName: "IKEA",
      productLink: "https://www.ikea.com",
      imageUrl: images[label] || defaultImage,
    },
    {
      name: "Minimalist " + label.charAt(0).toUpperCase() + label.slice(1),
      price: "$199.99",
      rating: 4.2,
      storeName: "Amazon",
      productLink: "https://www.amazon.com",
      imageUrl: images[label] || defaultImage,
    },
    {
      name: "Premium " + label.charAt(0).toUpperCase() + label.slice(1),
      price: "$499.99",
      rating: 4.8,
      storeName: "Wayfair",
      productLink: "https://www.wayfair.com",
      imageUrl: images[label] || defaultImage,
    }
  ];
}
