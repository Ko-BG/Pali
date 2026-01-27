const express = require('express');
const multer = require('multer');
const path = require('path');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS & JSON parsing
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Ensure uploads folder exists
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

// Configure Multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ storage });

// ====== Routes ====== //

// Health check
app.get('/', (req, res) => res.send('LIPA Upay API Running'));

// Upload endpoint
app.post('/api/upload', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  res.json({
    status: 'success',
    filename: req.file.filename,
    url: `/uploads/${req.file.filename}`
  });
});

// Sample payment endpoint
app.post('/api/payment', (req, res) => {
  const { amount, currency, method, merchantWallet } = req.body;
  if (!amount || !currency || !method || !merchantWallet) {
    return res.status(400).json({ error: 'Missing payment info' });
  }

  // Simulate payment processing
  const reference = 'REF-' + Math.random().toString(36).substr(2, 6).toUpperCase();
  res.json({ status: 'success', reference, amount, currency });
});

// Start server
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));