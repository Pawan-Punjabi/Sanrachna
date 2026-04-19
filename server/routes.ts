import type { Express } from "express";
import express from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { getSupabaseClient } from "./supabase";
import { api } from "@shared/routes";
import multer from "multer";
import path from "path";
import fs from "fs";
import sizeOf from "image-size";
import PDFDocument from "pdfkit";

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

/** Get user id from a Supabase access token and ensure they exist in public.users */
async function getUserId(token?: string): Promise<string | undefined> {
  if (!token) return undefined;
  try {
    const sb = getSupabaseClient(token);
    const { data: { user } } = await sb.auth.getUser();
    
    if (user?.id) {
      // Upsert the user into public.users to satisfy the foreign key constraint
      const { error } = await sb.from('users').upsert({
        id: user.id,
        email: user.email,
        first_name: user.user_metadata?.first_name || null
      }, { onConflict: 'id' });
      
      if (error) {
        console.error("Upsert user error (possibly missing first_name column):", error);
        // Fallback: try inserting without first_name if the schema isn't updated yet!
        await sb.from('users').upsert({
          id: user.id,
          email: user.email
        }, { onConflict: 'id' });
      }
    }
    
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

      // Read image dimensions
      const imageBuffer = fs.readFileSync(req.file.path);
      const dimensions = sizeOf(imageBuffer);
      const imgWidth = dimensions.width || 1;
      const imgHeight = dimensions.height || 1;

      // 2. Call Roboflow Serverless API
      let detections: any[] = [];
      try {
        const base64Image = fs.readFileSync(req.file.path).toString("base64");
        const response = await fetch('https://serverless.roboflow.com/pawan-iofmv/workflows/detect-count-and-visualize-2', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                api_key: 'Kga1QxiZnr9ZAlRWfeQH',
                inputs: {
                    "image": { "type": "base64", "value": base64Image }
                }
            })
        });

        const result = await response.json();
        console.log("ROBOFLOW DEBUG: Raw Workflow Result:", JSON.stringify(result, null, 2).substring(0, 500));
        
        if (result && result.outputs && Array.isArray(result.outputs)) {
           console.log("ROBOFLOW DEBUG: Outputs found:", result.outputs.length);
           result.outputs.forEach((o: any, idx: number) => {
              console.log(`ROBOFLOW DEBUG: Output ${idx} keys:`, Object.keys(o));
              if (Array.isArray(o.predictions)) {
                 console.log(`ROBOFLOW DEBUG: Adding ${o.predictions.length} predictions from array`);
                 detections.push(...o.predictions);
              } else if (o.predictions && typeof o.predictions === 'object') {
                 const vals = Object.values(o.predictions);
                 console.log(`ROBOFLOW DEBUG: Prediction object found with ${vals.length} keys`);
                 vals.forEach((v: any) => {
                   if (Array.isArray(v)) {
                      console.log(`ROBOFLOW DEBUG: Adding ${v.length} detections from nested array`);
                      detections.push(...v);
                   }
                 });
              } else {
                 console.log(`ROBOFLOW DEBUG: Output ${idx} has no recognizable predictions.`);
              }
           });
        } else if (result && result.predictions && Array.isArray(result.predictions)) {
           console.log(`ROBOFLOW DEBUG: Direct predictions array found with ${result.predictions.length} items`);
           detections = result.predictions;
        } else {
           console.log("ROBOFLOW DEBUG: Response format unexpected:", JSON.stringify(result));
        }
        
        console.log("ROBOFLOW DEBUG: Final detections count:", detections.length);
      } catch(apiErr) {
        console.error("Roboflow API error:", apiErr);
      }

      for (const d of detections) {
        // Roboflow prediction: x,y is center. width, height are absolute pixels.
        // Convert to top-left relative [0, 1] range for interactive React boxes.
        const relW = d.width / imgWidth;
        const relH = d.height / imgHeight;
        const relX = (d.x / imgWidth) - (relW / 2);
        const relY = (d.y / imgHeight) - (relH / 2);

        // Sanitize labels (e.g., "Kitchen_Platform" -> "Kitchen Platform")
        const label = (d.class || "Furniture").replace(/_/g, " ");

        const detectionId = await storage.createDetection({
          floor_plan_id: floorPlanId,
          furniture_label: label,
          bounding_box: { 
            x: Math.max(0, Math.min(1, relX)), 
            y: Math.max(0, Math.min(1, relY)), 
            w: Math.max(0, Math.min(1, relW)), 
            h: Math.max(0, Math.min(1, relH)) 
          },
          confidence_score: d.confidence || 0,
        }, token);

        // 3. Mock Product Suggestions (based on sanitized label)
        const products = getMockProducts(label.toLowerCase());
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

  // ── POST /api/generate-report ───────────────────────────────────────────
  app.post(api.floorPlans.report.path, async (req, res) => {
    try {
      const {
        annotated_image,
        cost_estimation,
        recommendations,
        design_suggestions,
        budget_suggestions
      } = req.body;

      // Initialize PDFDocument
      const doc = new PDFDocument({ margin: 50 });

      // Set response headers to force download
      res.setHeader('Content-disposition', 'attachment; filename="floorplan-report.pdf"');
      res.setHeader('Content-type', 'application/pdf');

      // Pipe the PDF into the response
      doc.pipe(res);

      // --- Page 1: Cover & Annotated Image ---
      doc.fontSize(24).font('Helvetica-Bold').text("Floor Plan Analysis Report", { align: 'center' });
      doc.moveDown();
      doc.fontSize(12).font('Helvetica').text(`Generated on: ${new Date().toLocaleDateString()}`, { align: 'center' });
      doc.moveDown(2);

      // We have the floor plan image as annotated_image (e.g. "/uploads/file.png")
      // We will read it from the file system.
      if (annotated_image && typeof annotated_image === "string") {
        try {
          const imagePath = path.join(process.cwd(), annotated_image);
          if (fs.existsSync(imagePath)) {
             doc.image(imagePath, { fit: [500, 400], align: 'center', valign: 'top' });
          }
        } catch (e) {
          console.error("Error loading image for PDF", e);
        }
      }

      doc.addPage();

      // --- Page 2: Furniture Inventory & Cost Estimation ---
      doc.fontSize(20).font('Helvetica-Bold').text("Furniture Inventory & Cost Estimation");
      doc.moveDown(1);
      
      let y = doc.y;
      doc.fontSize(12).font('Helvetica-Bold');
      doc.text("Item", 50, y);
      doc.text("Qty", 250, y);
      doc.text("Unit Price", 350, y);
      doc.text("Total", 450, y);
      
      y += 20;
      doc.moveTo(50, y).lineTo(550, y).stroke();
      y += 10;
      
      doc.font('Helvetica');
      let grandTotal = 0;
      for (const item of (cost_estimation || [])) {
         doc.text(item.item, 50, y);
         doc.text(item.qty.toString(), 250, y);
         doc.text(`$${item.unit_price.toFixed(2)}`, 350, y);
         const total = item.qty * item.unit_price;
         grandTotal += total;
         doc.text(`$${total.toFixed(2)}`, 450, y);
         y += 20;
      }
      
      doc.moveTo(50, y).lineTo(550, y).stroke();
      y += 15;
      doc.font('Helvetica-Bold').text("Estimated Total:", 300, y);
      doc.text(`$${grandTotal.toFixed(2)}`, 450, y);

      doc.addPage();

      // --- Page 3: Recommendations & Suggestions ---
      doc.fontSize(20).font('Helvetica-Bold').text("Curated Recommendations", 50, 50);
      doc.moveDown(1);
      
      for (const [furniture, items] of Object.entries(recommendations || {})) {
         doc.fontSize(16).font('Helvetica-Bold').text(furniture);
         doc.moveDown(0.5);
         doc.fontSize(12).font('Helvetica');
         const recList = Array.isArray(items) ? items : [];
         recList.forEach((prod: any) => {
           // We expect the price to be a formatted string starting with $ or another currency symbol, like "$299.99"
            doc.text(`• ${prod.name} - ${prod.price || "N/A"}`, { link: prod.link, underline: true });
         });
         doc.moveDown(1);
      }

      doc.moveDown(1);
      doc.fontSize(20).font('Helvetica-Bold').text("Smart Design & Budget Suggestions");
      doc.moveDown(1);
      doc.fontSize(14).text("Design Layout");
      doc.fontSize(12).font('Helvetica');
      (design_suggestions || []).forEach((s: string) => doc.text(`• ${s}`));
      doc.moveDown(1);
      
      doc.fontSize(14).font('Helvetica-Bold').text("Budget Optimization");
      doc.fontSize(12).font('Helvetica');
      (budget_suggestions || []).forEach((s: string) => doc.text(`• ${s}`));
      
      // Finalize PDF file
      doc.end();

    } catch (err: any) {
      console.error("PDF generation failed:", err);
      if (!res.headersSent) {
        res.status(500).json({ message: "Failed to generate PDF report" });
      }
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
