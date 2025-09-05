import express from "express";
import axios from "axios";
import pkg from "pdf-to-printer";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import cors from "cors";
import getPrintersManual from "./test.js";

const { print } = pkg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// 🔑 Your ShipStation API key
const API_KEY = "JILBDAG+l4sbNKSl5+8PihQkIiZQXqDFjDe5aMfXeuw";

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(
  cors({
    origin: "*",
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// UI page
app.get("/", (req, res) => {
  res.render("index", { error: null, success: null });
});

// ✅ Get connected printers
app.get("/printers", async (req, res) => {
  try {
    const printers = await getPrintersManual();
    console.log("✅ Printers fetched:", printers);
    res.json({ printers });
  } catch (err) {
    console.error("❌ Printer list error:", err.message);
    res.status(500).json({ error: "Failed to fetch printers" });
  }
});

// ✅ Get default printers
app.get("/printers/default", async (req, res) => {
  try {
    const defaultPrinter = await getPrintersManual();
    console.log(defaultPrinter);
    res.json({ defaultPrinter });
  } catch (err) {
    console.error("❌ Default printer error:", err.message);
    res.status(500).json({ error: "Failed to fetch default printer" });
  }
});

// Handle printing by fetching label from ShipStation
app.post("/print", async (req, res) => {
  const shipmentId = req.body.shipmentId || "se-939039759";

  if (!shipmentId) {
    return res.status(400).json({
      success: false,
      error: "❌ shipmentId is required",
    });
  }

  try {
    console.log("📦 Fetching label for shipment:", shipmentId);

    const response = await axios.get(`https://api.shipstation.com/v2/labels/`, {
      headers: {
        "api-key": API_KEY,
        "Content-Type": "application/json",
      },
      params: {
        shipment_id: shipmentId,
      },
    });

    const labelData = response.data;
    const label = labelData?.labels?.[0];
    const pdfUrl = label?.label_download?.pdf;

    if (!pdfUrl) {
      throw new Error("❌ No PDF URL found for this shipment");
    }

    console.log("✅ PDF URL:", pdfUrl);

    // Download the PDF
    const pdfResponse = await axios.get(pdfUrl, {
      responseType: "arraybuffer",
    });
    const filePath = path.join(__dirname, `${shipmentId}-label.pdf`);
    await fs.writeFile(filePath, pdfResponse.data);

    // Print the label
    await print(filePath);

    console.log("🖨️ Print job sent successfully");
    return res.json({
      success: true,
      message: "✅ Label printed successfully!",
      shipmentId,
    });
  } catch (err) {
    console.error("❌ Print error:", err.response?.data || err.message);
    return res.status(500).json({
      success: false,
      error: err.message || "Internal server error",
    });
  }
});

app.post("/generate-and-print", async (req, res) => {
  const shipmentId = req.query.shipmentId;

  if (!shipmentId) {
    return res.status(400).json({
      success: false,
      error: "❌ shipmentId is required",
    });
  }

  try {
    console.log("📦 Fetching label for shipment:", shipmentId);

    const response = await axios.post(
      `https://api.shipstation.com/v2/labels/shipment/${shipmentId}`,
      {
        validate_address: "no_validation",
        label_layout: "4x6",
        label_format: "pdf",
        label_download_type: "url",
        display_scheme: "label",
      },
      {
        headers: {
          "Content-Type": "application/json",
          "api-key": API_KEY, // replace with your actual key
        },
      }
    );

    const pdfUrl = response.data.label_download.pdf;
    console.log(pdfUrl);
    if (!pdfUrl) {
      throw new Error("❌ No PDF URL found for this shipment");
    }

    console.log("✅ PDF URL:", pdfUrl);

    // Download the PDF
    const pdfResponse = await axios.get(pdfUrl, {
      responseType: "arraybuffer",
    });
    const filePath = path.join(__dirname, `${shipmentId}-label.pdf`);
    await fs.writeFile(filePath, pdfResponse.data);

    // Print the label
    await print(filePath);

    console.log("🖨️ Print job sent successfully");
    return res.json({
      success: true,
      message: "✅ Label printed successfully!",
      shipmentId,
    });
  } catch (err) {
    console.error("❌ Print error:", err.response?.data || err.message);
    return res.status(500).json({
      success: false,
      error: err.message || "Internal server error",
    });
  }
});

app.listen(4000, () => {
  console.log("🖨️ Printer service running at http://localhost:4000");
});
