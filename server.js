const express = require("express");
const path = require("path");
const bodyParser = require("body-parser");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "public")));

// Routes
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public/index.html"));
});

// Simulated API for payment initiation
app.post("/api/payment", (req, res) => {
  const { amount, currency, method, merchant } = req.body;
  if (!amount || !currency || !method || !merchant)
    return res.status(400).json({ error: "Missing parameters" });

  const ref = "REF-" + Math.random().toString(36).substr(2, 8).toUpperCase();
  res.json({ status: "success", ref, amount, currency, method, merchant });
});

// Simulated withdrawal API
app.post("/api/withdraw", (req, res) => {
  const { amount, wallet, pin } = req.body;
  if (!amount || !wallet || !pin)
    return res.status(400).json({ error: "Missing parameters" });

  if (pin !== "1234") return res.status(403).json({ error: "Invalid PIN" });

  res.json({ status: "success", wallet, amount });
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));