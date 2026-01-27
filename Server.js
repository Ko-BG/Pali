import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

const app = express();
const PORT = process.env.PORT || 3000;

// Fix for ES module path
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static("public"));

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "LIPA SERVER RUNNING ✅" });
});

// Example payment endpoint (future API hook)
app.post("/api/payment", (req, res) => {
  const { amount, currency, method } = req.body;

  console.log("Payment Request:", amount, currency, method);

  res.json({
    success: true,
    message: "Payment accepted (simulation)",
    reference: "LIPA-" + Math.random().toString(36).substring(2, 10).toUpperCase()
  });
});

// Serve your HTML
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 LIPA running on port ${PORT}`);
});
