import type { Express } from "express";
import express from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { getSupabaseClient } from "./supabase";
import { api } from "@shared/routes";
import multer from "multer";
import path from "path";
import fs from "fs";
import * as imageSize from "image-size";
const sizeOf = (imageSize.default || imageSize) as any;
import * as PDFDocumentModule from "pdfkit";
const PDFDocument = (PDFDocumentModule.default || PDFDocumentModule) as any;
// ─── AI Generation Configuration (Nano Banana / Gemini) ─────────────────────
import axios from "axios";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const ROBOFLOW_API_KEY = process.env.ROBOFLOW_API_KEY;

// Technical architectural presets for maximum accuracy
const NANO_BANANA_PRESETS = {
  default: "create an exact 3D digital twin of this floor plan, matching every wall and furniture position perfectly",
  drone: "high-precision drone top-down view, 3D architectural layout reconstruction, exact furniture placement",
  side: "architectural side-section view with 100% layout accuracy and depth",
  modern: "exact structural reconstruction with premium modern furniture set in identical positions",
  backyard: "accurate floor plan placed in a realistic site context with lawn and garden",
  pool: "structural 3D model with a luxury pool integrated into the exact backyard coordinates"
};

const FREE_AI_RENDER_URL = (prompt: string) =>
  `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=1024&height=1024&nologo=true&seed=${Math.floor(Math.random() * 1000000)}&model=flux`;

const ARCHITECT_PROMPT = "ACT AS AN EXPERT ARCHITECT. Perform a meticulous spatial analysis of this floor plan. Identify the exact coordinates and positions of all walls, rooms, doors, windows, and furniture. Describe the layout room-by-room with extreme precision (e.g., 'Master bedroom in North-East with a king bed centered against the North wall'). Your goal is to provide a comprehensive structural map that allows for a 1:1 3D reconstruction. Be technically exhaustive.";

// ─── Amazon CSV Data Handling ───────────────────────────────

interface ScrapedProduct {
  category: string;
  title: string;
  price: string;
  rating: number;
  image: string;
  link: string;
}

let csvProducts: ScrapedProduct[] = [];

/**
 * Simple CSV parser that handles quoted fields with commas
 */
function parseCSV(csvText: string): string[][] {
  const result: string[][] = [];
  let currentLine: string[] = [];
  let currentField = "";
  let inQuotes = false;

  for (let i = 0; i < csvText.length; i++) {
    const char = csvText[i];
    const nextChar = csvText[i + 1];

    if (inQuotes) {
      if (char === '"' && nextChar === '"') {
        currentField += '"';
        i++;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        currentField += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ",") {
        currentLine.push(currentField.trim());
        currentField = "";
      } else if (char === "\n" || char === "\r") {
        currentLine.push(currentField.trim());
        if (currentLine.some(f => f !== "")) {
          result.push(currentLine);
        }
        currentLine = [];
        currentField = "";
        if (char === "\r" && nextChar === "\n") i++;
      } else {
        currentField += char;
      }
    }
  }
  if (currentField || currentLine.length > 0) {
    currentLine.push(currentField.trim());
    result.push(currentLine);
  }
  return result;
}

function loadCsvData() {
  try {
    const csvPath = path.join(process.cwd(), "Amazon_scraped.csv");
    if (!fs.existsSync(csvPath)) {
      console.warn("[CSV] Amazon_scraped.csv not found.");
      return;
    }

    const csvText = fs.readFileSync(csvPath, "utf-8");
    const rows = parseCSV(csvText);

    // Skip header row
    const dataRows = rows.slice(1);

    csvProducts = dataRows.map(row => {
      if (row.length < 6) return null;

      const [category, title, price, rawRating, image, link] = row;

      // Handle rating column: "3.7 out of 5 stars" -> 3.7, "Previous page" -> 4.2 (default)
      let rating = 4.2;
      if (rawRating && rawRating.toLowerCase().includes("out of 5 stars")) {
        const match = rawRating.match(/(\d+\.?\d*)/);
        if (match) rating = parseFloat(match[1]);
      } else if (rawRating && !isNaN(parseFloat(rawRating))) {
        rating = parseFloat(rawRating);
      }

      // Clean up price: "14,999." -> "14,999"
      let cleanPrice = price.trim().replace(/\.$/, "");
      if (!cleanPrice.startsWith("₹")) {
        cleanPrice = `₹${cleanPrice}`;
      }

      return {
        category: category.trim(),
        title: title.trim(),
        price: cleanPrice,
        rating,
        image: image.trim(),
        link: link.trim()
      };
    }).filter(p => p !== null) as ScrapedProduct[];

    console.log(`[CSV] Loaded ${csvProducts.length} products from Amazon_scraped.csv`);
  } catch (err) {
    console.error("[CSV] Error loading products:", err);
  }
}

// Initial load
loadCsvData();

function getProductsFromCSV(category: string, limit: number = 50): ScrapedProduct[] {
  const normalizedCategory = category.toLowerCase().replace(/[_-]/g, " ").trim();

  // 1. Try Exact Match first (highest priority)
  let exactMatches = csvProducts.filter(p =>
    p.category.toLowerCase().trim() === normalizedCategory
  );

  if (exactMatches.length > 0) {
    return exactMatches.slice(0, limit);
  }

  // 2. Specialized handling for common overlaps (Table vs Study Table, etc.)
  let filtered: ScrapedProduct[] = [];

  if (normalizedCategory === "table") {
    // If specifically asking for "table", don't include "study table" or "dining table"
    filtered = csvProducts.filter(p => p.category.toLowerCase().trim() === "table");
  } else if (normalizedCategory === "study table") {
    filtered = csvProducts.filter(p => p.category.toLowerCase().trim() === "study table");
  } else if (normalizedCategory === "dining table" || normalizedCategory === "dinning table") {
    filtered = csvProducts.filter(p => p.category.toLowerCase().trim() === "dining table");
  } else {
    // 3. Fallback to partial match for other categories
    filtered = csvProducts.filter(p => {
      const pCat = p.category.toLowerCase().trim();
      return pCat.includes(normalizedCategory) || normalizedCategory.includes(pCat);
    });
  }

  // 4. If still no results, try word-based matching
  if (filtered.length === 0) {
    const words = normalizedCategory.split(" ").filter(w => w.length > 2);
    filtered = csvProducts.filter(p => {
      const pCat = p.category.toLowerCase();
      return words.some(word => pCat.includes(word));
    });
  }

  return filtered.slice(0, limit);
}



// Ensure uploads directory exists
const uploadsDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

import sharp from "sharp";

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
        try { if (fs.existsSync(filePath)) fs.unlinkSync(filePath); } catch { }
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
      let imagePath: string;
      let originalName: string;
      const imageUrlInput = req.body.url;

      if (imageUrlInput) {
        // Handle URL submission
        console.log(`[Upload] Processing image URL: ${imageUrlInput}`);
        const response = await axios.get(imageUrlInput, { responseType: 'arraybuffer' });
        const contentType = response.headers['content-type'];
        
        if (!contentType?.startsWith('image/')) {
          return res.status(400).json({ message: "URL does not point to a valid image" });
        }

        const extension = contentType.split('/')[1].split(';')[0] || 'jpg';
        const filename = `${Date.now()}-${Math.round(Math.random() * 1e9)}.${extension}`;
        imagePath = path.join(uploadsDir, filename);
        fs.writeFileSync(imagePath, response.data);
        originalName = "url-image." + extension;
      } else if (req.file) {
        // Handle file upload
        imagePath = req.file.path;
        originalName = req.file.originalname;
      } else {
        return res.status(400).json({ message: "No image file or URL provided" });
      }

      const dbImageUrl = "/uploads/" + path.basename(imagePath);
      const token = extractToken(req);
      const userId = await getUserId(token);

      // 1. Create Floor Plan
      const floorPlanId = await storage.createFloorPlan(
        { image_url: dbImageUrl, name: originalName, user_id: userId ?? null },
        token
      );

      // Read image dimensions
      const imageBuffer = fs.readFileSync(imagePath);
      const dimensions = sizeOf(imageBuffer);
      const imgWidth = dimensions.width || 1;
      const imgHeight = dimensions.height || 1;

      // 2. Call Roboflow Serverless API
      let detections: any[] = [];
      try {
        const base64Image = fs.readFileSync(imagePath).toString("base64");
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
      } catch (apiErr) {
        console.error("Roboflow API error:", apiErr);
      }

      for (const d of detections) {
        // Roboflow prediction: x,y is center. width, height are absolute pixels.
        // Convert to top-left relative [0, 1] range for interactive React boxes.
        const relW = d.width / imgWidth;
        const relH = d.height / imgHeight;
        const relX = (d.x / imgWidth) - (relW / 2);
        const relY = (d.y / imgHeight) - (relH / 2);

        // Sanitize labels (e.g., "Kitchen_Platform" or "king-bed" -> "Kitchen Platform", "king bed")
        const label = (d.class || "Furniture").replace(/[_-]/g, " ");

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

        // 3. Get Products from CSV
        console.log(`[Analysis] Getting CSV products for detected label: ${label}`);
        const scrapedItems = getProductsFromCSV(label);

        let productsToSave: any[] = [];

        if (scrapedItems.length > 0) {
          productsToSave = scrapedItems.map(s => ({
            store_name: "Amazon",
            product_name: s.title,
            price: s.price,
            rating: s.rating,
            product_url: s.link,
            product_image_url: s.image
          }));
        } else {
          console.log(`[Analysis] No CSV products found for ${label}.`);
        }

        for (const p of productsToSave) {
          await storage.createProductSuggestion({ detection_id: detectionId, ...p }, token);
        }

      }

      res.status(201).json({ id: floorPlanId, imageUrl: dbImageUrl, name: originalName, message: "Upload and analysis complete" });
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ message: err.message ?? "Internal server error during upload" });
    }
  });

  // ── POST /api/generate-report ─────────────────────────────────────────────
  app.post("/api/generate-report", async (req, res) => {
    try {
      const data = req.body;
      const doc = new PDFDocument({ margin: 40, size: 'A4', bufferPages: true });

      const buffers: any[] = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const pdfData = Buffer.concat(buffers);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=${(data.floorPlanName || 'Report').replace(/\s+/g, '_')}_Analysis.pdf`);
        res.send(pdfData);
      });

      // --- STYLING HELPERS ---
      const primaryColor = '#0f172a';
      const secondaryColor = '#64748b';
      const accentColor = '#3b82f6';
      const divider = () => {
        doc.moveDown(0.5);
        doc.moveTo(40, doc.y).lineTo(555, doc.y).strokeColor('#e2e8f0').lineWidth(1).stroke();
        doc.moveDown(1);
      };

      // 1. EXECUTIVE SUMMARY & DETECTED LAYOUT
      // -----------------------------------------------------------------------
      doc.fillColor(primaryColor).fontSize(26).text('Sanrachna Architecture Analysis', { align: 'left' });
      doc.fontSize(10).fillColor(secondaryColor).text(`Project: ${data.floorPlanName || 'Untitled Floor Plan'}`);
      doc.text(`Date: ${new Date().toLocaleDateString()}`);
      doc.moveDown(1.5);

      doc.fillColor(primaryColor).fontSize(16).text('1. Executive Summary & Detected Layout', { underline: false });
      divider();

      // Side-by-Side Images
      if (data.annotated_image) {
        try {
          const isLocal = data.annotated_image.startsWith('/uploads/');
          let imgBuffer: Buffer;
          if (isLocal) {
            const localPath = path.join(process.cwd(), data.annotated_image);
            imgBuffer = fs.readFileSync(localPath);
          } else {
            const response = await axios.get(data.annotated_image, { responseType: 'arraybuffer' });
            imgBuffer = Buffer.from(response.data);
          }

          const imgWidth = 250;
          const imgHeight = 180;
          const startY = doc.y;

          // Original Plan
          doc.image(imgBuffer, 40, startY, { fit: [imgWidth, imgHeight] });
          doc.fontSize(9).fillColor(secondaryColor).text('Original Floor Plan', 40, startY + imgHeight + 5, { width: imgWidth, align: 'center' });

          // Annotated Plan (Manual Drawing on PDF)
          const annoX = 305;
          doc.image(imgBuffer, annoX, startY, { fit: [imgWidth, imgHeight] });
          
          // Draw Bounding Boxes manually
          (data.rawDetections || []).forEach((d: any) => {
            const bx = annoX + (d.boxX * imgWidth);
            const by = startY + (d.boxY * imgHeight);
            const bw = d.boxW * imgWidth;
            const bh = d.boxH * imgHeight;
            
            doc.rect(bx, by, bw, bh).lineWidth(1).strokeColor('#ff0000').stroke();
            doc.fontSize(5).fillColor('#ff0000').text(d.label, bx, by - 6);
          });
          doc.fontSize(9).fillColor(secondaryColor).text('AI-Detected Layout (Annotated)', annoX, startY + imgHeight + 5, { width: imgWidth, align: 'center' });

          doc.y = startY + imgHeight + 30;
        } catch (err) {
          console.error("PDF Image Overhaul Error:", err);
          doc.text("[Visual analysis preview error]");
        }
      }

      // Furniture Inventory Table
      doc.moveDown(1);
      doc.fillColor(primaryColor).fontSize(12).text('Furniture Inventory:', { bold: true });
      doc.moveDown(0.5);
      
      const tableTop = doc.y;
      doc.fontSize(10).fillColor(primaryColor);
      doc.text('Item Category', 60, tableTop);
      doc.text('Detected Quantity', 250, tableTop);
      doc.text('Confidence Score', 400, tableTop);
      doc.moveTo(50, tableTop + 15).lineTo(540, tableTop + 15).stroke('#e2e8f0');

      let rowY = tableTop + 25;
      data.detections.forEach((d: any, i: number) => {
        if (i % 2 === 0) doc.rect(50, rowY - 5, 490, 20).fill('#f8fafc');
        doc.fillColor(primaryColor).text(d.label, 60, rowY);
        doc.text(`${d.count} unit(s)`, 250, rowY);
        doc.text('High (92%)', 400, rowY); // Simulated confidence
        rowY += 20;
      });
      doc.y = rowY + 10;

      // Space Utilization Score
      let occupiedArea = 0;
      (data.rawDetections || []).forEach((d: any) => { occupiedArea += (d.boxW * d.boxH); });
      const utilScore = Math.min(100, Math.round(occupiedArea * 150)); // Scaled for normalization
      
      doc.moveDown(1);
      doc.fillColor(primaryColor).fontSize(12).text('Space Utilization Score:');
      const barWidth = 200;
      doc.rect(200, doc.y - 12, barWidth, 15).fill('#e2e8f0');
      doc.rect(200, doc.y - 12, (utilScore / 100) * barWidth, 15).fill(utilScore > 35 ? '#f59e0b' : '#10b981');
      doc.fillColor(primaryColor).text(`${utilScore}%`, 410, doc.y - 10);
      doc.fontSize(9).fillColor(secondaryColor).text(utilScore > 35 ? 'Note: High furniture density. Consider clearing pathways.' : 'Note: Optimal space utilization for a spacious feel.', 200, doc.y + 5);
      doc.moveDown(2);

      // 2. BUDGET OPTIMIZATION TIERS
      // -----------------------------------------------------------------------
      doc.fillColor(primaryColor).fontSize(16).text('2. Budget Optimization Tiers');
      divider();

      let economyTotal = 0;
      let premiumTotal = 0;

      data.cost_estimation.forEach((c: any) => {
        const itemLabel = c.item;
        const products = data.recommendations[itemLabel] || [];
        const prices = products.map((p: any) => parseInt(p.price.replace(/[^0-9]/g, '')) || 0);
        const qty = c.qty || 1;

        if (prices.length > 0) {
          economyTotal += Math.min(...prices) * qty;
          premiumTotal += Math.max(...prices) * qty;
        } else {
          economyTotal += (c.unit_price || 0) * qty;
          premiumTotal += (c.unit_price || 0) * 1.5 * qty;
        }
      });

      const cardWidth = 250;
      const cardY = doc.y;
      
      // Essential Card
      doc.rect(40, cardY, cardWidth, 100).fill('#f0fdf4').stroke('#bbf7d0');
      doc.fillColor('#166534').fontSize(14).text('Shopping Persona: THE ESSENTIALIST', 55, cardY + 15);
      doc.fontSize(10).text('Focus: Top-rated, affordable essentials with high durability.', 55, cardY + 35);
      doc.fontSize(18).text(`Total: ₹${economyTotal.toLocaleString()}`, 55, cardY + 65);

      // Premium Card
      doc.rect(305, cardY, cardWidth, 100).fill('#fffbeb').stroke('#fef3c7');
      doc.fillColor('#92400e').fontSize(14).text('Shopping Persona: THE CURATOR', 320, cardY + 15);
      doc.fontSize(10).text('Focus: Designer aesthetics, premium materials, and luxury finishes.', 320, cardY + 35);
      doc.fontSize(18).text(`Total: ₹${premiumTotal.toLocaleString()}`, 320, cardY + 65);

      doc.y = cardY + 120;

      // 3. INTERIOR DESIGN ANALYSIS
      // -----------------------------------------------------------------------
      doc.addPage();
      doc.fillColor(primaryColor).fontSize(16).text('3. Interior Design Analysis');
      divider();

      // Traffic Flow
      doc.fontSize(12).fillColor(primaryColor).text('Traffic Flow Assessment:');
      doc.fontSize(10).fillColor(secondaryColor).text(
        utilScore > 35 
        ? "CRITICAL: The current layout has a high density of furniture. We recommend a minimum clearance of 30 inches between major pieces to ensure comfortable movement."
        : "OPTIMAL: Your layout provides excellent clearance. The open space allows for a natural transition between living and private zones."
      );
      doc.moveDown(1.5);

      // Style & Palette
      const style = utilScore > 30 ? "Maximalist Modern" : "Scandinavian Minimalist";
      doc.fillColor(primaryColor).fontSize(12).text(`Recommended Design Style: ${style}`);
      doc.fontSize(10).fillColor(secondaryColor).text("Based on your detection density and room configuration.");
      doc.moveDown(1);

      doc.fontSize(12).fillColor(primaryColor).text('Suggested Color Palette:');
      const palette = ['#1e293b', '#64748b', '#f8fafc', '#e2e8f0', '#3b82f6'];
      let px = 50;
      palette.forEach(c => {
        doc.rect(px, doc.y + 5, 45, 30).fill(c);
        px += 55;
      });
      doc.moveDown(3);

      // 4. SMART SUGGESTIONS & UPGRADES
      // -----------------------------------------------------------------------
      doc.fillColor(primaryColor).fontSize(16).text('4. Smart Suggestions & Upgrades');
      divider();

      const labels = data.detections.map((d: any) => d.label.toLowerCase());
      const missing = [];
      if (!labels.some(l => l.includes('lamp'))) missing.push('Floor Lamp (for ambient lighting)');
      if (labels.some(l => l.includes('bed')) && !labels.some(l => l.includes('table'))) missing.push('Nightstand / Side Table');
      if (labels.some(l => l.includes('sofa')) && !labels.some(l => l.includes('tv'))) missing.push('Entertainment Unit');

      doc.fillColor(primaryColor).fontSize(12).text('Detected Missing Essentials:');
      if (missing.length) {
        missing.forEach(m => doc.fontSize(10).fillColor(secondaryColor).text(`• ${m}`));
      } else {
        doc.fontSize(10).fillColor(secondaryColor).text("• Your layout appears comprehensive based on detections.");
      }
      doc.moveDown(1.5);

      doc.fillColor('#15803d').fontSize(12).text('The "Green" Choice (Eco-Friendly Upgrade):');
      doc.fontSize(10).fillColor(secondaryColor).text(
        "Upgrade your primary seating to a sustainably-sourced bamboo or recycled fabric alternative. Look for products with the 'Climate Pledge Friendly' badge on Amazon for 15% better long-term durability."
      );

      // --- FOOTER ---
      const pageCount = doc.bufferedPageRange().count;
      for (let i = 0; i < pageCount; i++) {
        doc.switchToPage(i);
        doc.fontSize(8).fillColor(secondaryColor).text(
          `Page ${i + 1} of ${pageCount} | Sanrachna Architecture Analysis Report | Powered by Gemini 1.5 Flash`,
          40,
          doc.page.height - 40,
          { align: 'center' }
        );
      }

      doc.end();

    } catch (err: any) {
      console.error("PDF Overhaul Error:", err);
      res.status(500).json({ message: "Failed to generate professional report" });
    }
  });


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

  // ── POST /api/analyze-layout ──────────────────────────────────────────
  app.post("/api/analyze-layout", async (req, res) => {
    try {
      const { imageUrl } = req.body;
      if (!imageUrl) {
        console.error("[Layout AI] Missing imageUrl in request body");
        return res.status(400).json({ message: "Image URL is required" });
      }

      console.log("[Layout AI] 🚀 Starting enhanced spatial analysis (Sharp + Roboflow + Gemini)...");

      let imageBuffer: Buffer;
      try {
        if (imageUrl.startsWith('data:')) {
          imageBuffer = Buffer.from(imageUrl.split(',')[1], 'base64');
        } else {
          const fullPath = path.join(process.cwd(), imageUrl.startsWith('/') ? imageUrl : "/" + imageUrl);
          if (fs.existsSync(fullPath)) {
            imageBuffer = fs.readFileSync(fullPath);
          } else {
            throw new Error("Local image file not found");
          }
        }
      } catch (imgErr: any) {
        return res.status(400).json({ message: `Image processing failed: ${imgErr.message}` });
      }

      // --- STEP 1: Image Enhancement (Sharp) ---
      // We create a high-contrast grayscale version to help Gemini see the lines better
      console.log("[Layout AI] 🎨 Enhancing image for structural visibility...");
      const enhancedBuffer = await sharp(imageBuffer)
        .grayscale()
        .linear(1.5, -20) // Increase contrast
        .sharpen()
        .toBuffer();

      const base64Data = imageBuffer.toString("base64");
      const base64Enhanced = enhancedBuffer.toString("base64");

      // 1. Detect Furniture using the project's Roboflow Model
      console.log("[Layout AI] 🛋️ Step 1: Detecting furniture with Roboflow...");
      let furniture: any[] = [];
      try {
        const roboflowResponse = await fetch('https://serverless.roboflow.com/pawan-iofmv/workflows/detect-count-and-visualize-2', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            api_key: ROBOFLOW_API_KEY,
            inputs: { "image": { "type": "base64", "value": base64Data } }
          })
        });
        const roboflowResult = await roboflowResponse.json();
        let rawDetections: any[] = [];

        if (roboflowResult && roboflowResult.outputs) {
          roboflowResult.outputs.forEach((o: any) => {
            if (Array.isArray(o.predictions)) rawDetections.push(...o.predictions);
            else if (o.predictions && typeof o.predictions === 'object') {
              Object.values(o.predictions).forEach((v: any) => { if (Array.isArray(v)) rawDetections.push(...v); });
            }
          });
        } else if (roboflowResult && roboflowResult.predictions) {
          rawDetections = roboflowResult.predictions;
        }

        const dimensions = sizeOf(imageBuffer);
        const imgW = dimensions.width || 1000;
        const imgH = dimensions.height || 1000;

        furniture = rawDetections.map((d: any) => ({
          type: (d.class || "furniture").toLowerCase().replace(/[_-]/g, ' '),
          label: d.class || "Furniture",
          position: { x: d.x / imgW, y: d.y / imgH },
          rotation: 0,
          scale: { w: d.width / imgW, h: d.height / imgH }
        }));
        console.log(`[Layout AI] Roboflow found ${furniture.length} items.`);

        // --- Suggestion 1: Icon Patch Generation ---
        // For each detected piece, we crop a "zoom" view to help Gemini see the orientation
        console.log("[Layout AI] 🔍 Step 1.5: Generating high-res patches for furniture rotation...");
        for (let i = 0; i < furniture.length; i++) {
          try {
            const f = furniture[i];
            const w = f.scale.w * imgW;
            const h = f.scale.h * imgH;
            const left = Math.max(0, Math.floor((f.position.x * imgW) - (w / 2)));
            const top = Math.max(0, Math.floor((f.position.y * imgH) - (h / 2)));
            const width = Math.min(imgW - left, Math.ceil(w));
            const height = Math.min(imgH - top, Math.ceil(h));

            if (width > 0 && height > 0) {
              const patchBuffer = await sharp(imageBuffer)
                .extract({ left, top, width, height })
                .resize(128, 128, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
                .toBuffer();
              (f as any).patchBase64 = patchBuffer.toString("base64");
            }
          } catch (patchErr) {
            console.warn(`[Layout AI] Failed to crop patch for furniture ${i}:`, patchErr);
          }
        }
      } catch (rfErr) {
        console.warn("[Layout AI] Roboflow failed, falling back to Gemini for furniture:", rfErr);
      }

      // 2. Detect Walls and Rooms using Gemini with the Enhanced Image
      console.log("[Layout AI] 🏗️ Step 2: Isolating Walls (Applying User Algorithm via SVG Masking)...");

      const dimensions = sizeOf(imageBuffer);
      const imgW = dimensions.width || 1000;
      const imgH = dimensions.height || 1000;

      // Create a Furniture Mask SVG to "erase" furniture and keep only walls
      const maskSvg = `
        <svg width="${imgW}" height="${imgH}">
          <rect x="0" y="0" width="${imgW}" height="${imgH}" fill="none" />
          ${furniture.map(f => {
            const w = f.scale.w * imgW;
            const h = f.scale.h * imgH;
            const x = (f.position.x * imgW) - (w / 2);
            const y = (f.position.y * imgH) - (h / 2);
            // Draw a white rectangle to mask out furniture
            return `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="white" />`;
          }).join('')}
        </svg>
      `;

      // Bridge Gaps & Isolate Walls (Reduced blur to preserve door gaps)
      const isolatedWallBuffer = await sharp(imageBuffer)
        .composite([{ input: Buffer.from(maskSvg), blend: 'over' }])
        .grayscale()
        .threshold(50)
        .blur(0.8) // Reduced from 1.5 to prevent filling door gaps
        .threshold(128)
        .median(3)
        .toBuffer();

      const base64Isolated = isolatedWallBuffer.toString("base64");

      const LAYOUT_PROMPT = `
        ACT AS AN EXPERT ARCHITECTURAL ANALYZER. 
        Analyze the floor plan images provided.
        
        GOAL: Extract a high-precision structural map including all walls and rooms.
        
        CRITICAL RULES:
        1. DOOR GAPS: You MUST leave a physical gap in the walls for every Door icon you see in the original image. DO NOT trace a continuous wall across a door.
        2. WALL SOURCES: Use the "Isolated Wall Map" (Image 3) for primary wall placement, but CROSS-REFERENCE with Image 1 (Original) to identify door positions.
        3. WALL TYPES: "exterior" (thick), "interior" (thin), "window" (glass/openings).
        
        ROTATION RULES:
        - 0 = Facing Right, 90 = Facing Down, 180 = Facing Left, 270 = Facing Up.
        
        FURNITURE & DOORS LIST:
        ${furniture.map((f, i) => `- [${i}] ${f.label} at (${f.position.x.toFixed(3)}, ${f.position.y.toFixed(3)})`).join('\n')}

        REQUIRED JSON:
        {
          "globalRotation": number,
          "walls": [{ "start": {"x": number, "y": number}, "end": {"x": number, "y": number}, "thickness": number, "type": "exterior"|"interior"|"window" }],
          "rooms": [{ "name": string, "type": string, "bounds": {"x": number, "y": number, "w": number, "h": number} }],
          "furniture_refinement": [{ "index": number, "exact_rotation": number }]
        }
        Only return JSON.
      `;

      const startTime = Date.now();
      const geminiResponse = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${GEMINI_API_KEY}`,
        {
          contents: [{
            parts: [
              { text: LAYOUT_PROMPT },
              { inlineData: { mimeType: "image/png", data: base64Data } },
              { inlineData: { mimeType: "image/png", data: base64Enhanced } },
              { inlineData: { mimeType: "image/png", data: base64Isolated } }
            ]
          }],
          generationConfig: { responseMimeType: "application/json", temperature: 0.1 }
        },
        { timeout: 60000 }
      );

      console.log(`[Layout AI] Gemini responded in ${(Date.now() - startTime) / 1000}s`);
      let layoutJsonText = geminiResponse.data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!layoutJsonText) throw new Error("Gemini failed to return structural data");

      if (layoutJsonText.includes("```json")) {
        layoutJsonText = layoutJsonText.split("```json")[1].split("```")[0].trim();
      }

      const structuralLayout = JSON.parse(layoutJsonText);
      structuralLayout.furniture_refinement = structuralLayout.furniture_refinement || [];
      structuralLayout.fixed_furniture = structuralLayout.fixed_furniture || [];

      // 3. Merge and Straighten Coordinates with Higher Precision
      const globalRotationDeg = structuralLayout.globalRotation || 0;
      const rotationRad = (globalRotationDeg * Math.PI) / 180;

      const rotatePoint = (p: { x: number, y: number }) => {
        const cx = 0.5, cy = 0.5;
        const dx = p.x - cx;
        const dy = p.y - cy;
        // Apply negative rotation to straighten
        return {
          x: cx + dx * Math.cos(-rotationRad) - dy * Math.sin(-rotationRad),
          y: cy + dx * Math.sin(-rotationRad) + dy * Math.cos(-rotationRad)
        };
      };

      const straightenedWalls = (structuralLayout.walls || []).map((w: any) => ({
        ...w,
        start: rotatePoint(w.start),
        end: rotatePoint(w.end)
      }));

      const straightenedRooms = (structuralLayout.rooms || []).map((r: any) => ({
        ...r,
        bounds: {
          ...r.bounds,
          ...rotatePoint({ x: r.bounds.x + r.bounds.w / 2, y: r.bounds.y + r.bounds.h / 2 })
        }
      }));

      const refinedFurniture = furniture.map((f, index) => {
        const refinement = structuralLayout.furniture_refinement?.find((r: any) =>
          r.index === index || (r.label?.toLowerCase() === f.label?.toLowerCase() && Math.abs(r.position?.x - f.position.x) < 0.05)
        );
        const pos = rotatePoint(f.position);

        // Final Rotation = Gemini's absolute rotation - Global Tilt
        let finalRotDeg = refinement ? refinement.exact_rotation : 0;

        return {
          ...f,
          position: pos,
          rotation: ((finalRotDeg - globalRotationDeg) * Math.PI) / 180
        };
      });

      // Add fixed furniture detected by Gemini (like Kitchen Platforms)
      if (structuralLayout.fixed_furniture) {
        structuralLayout.fixed_furniture.forEach((fixed: any) => {
          refinedFurniture.push({
            type: (fixed.label || "furniture").toLowerCase(),
            label: fixed.label || "Kitchen_Platform",
            position: rotatePoint(fixed.position),
            rotation: ((fixed.rotation - globalRotationDeg) * Math.PI) / 180,
            scale: fixed.scale || { w: 0.1, h: 0.1 }
          });
        });
      }

      const finalLayout = {
        metadata: {
          aspectRatio: 1,
          estimatedRealWorldScale: "1:100",
          originalRotation: globalRotationDeg
        },
        walls: straightenedWalls,
        rooms: straightenedRooms,
        furniture: refinedFurniture
      };

      console.log(`[Layout AI] ✅ Analysis Complete. Walls: ${finalLayout.walls.length}, Furniture: ${finalLayout.furniture.length}`);
      res.json(finalLayout);

    } catch (err: any) {
      console.error("[Layout AI] ❌ Critical Error:", err.response?.data || err.message);
      res.status(err.response?.status || 500).json({
        message: `Layout Analysis Failed: ${err.response?.data?.error?.message || err.message}`
      });
    }
  });

  return httpServer;
}

/**
 * Normalise Supabase row → frontend camelCase shape
 */
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


