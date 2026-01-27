const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static("public"));

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "LIPA SERVER RUNNING ✅" });
});

// Payment simulation endpoint
app.post("/api/payment", (req, res) => {
  const { amount, currency, method } = req.body;

  console.log("Payment Request:", amount, currency, method);

  res.json({
    success: true,
    message: "Payment accepted (simulation)",
    reference: "LIPA-" + Math.random().toString(36).substring(2, 10).toUpperCase()
  });
});

// Serve frontend
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 LIPA running on port ${PORT}`);
});