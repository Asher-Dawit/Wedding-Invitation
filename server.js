const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public')); // serve frontend files (optional)

// Path to RSVP data file
const dataFile = path.join(__dirname, 'rsvps.json');

// Helper: read RSVPs from file
function readRSVPs() {
  if (!fs.existsSync(dataFile)) return [];
  const data = fs.readFileSync(dataFile);
  return JSON.parse(data);
}

// Helper: write RSVPs to file
function writeRSVPs(rsvps) {
  fs.writeFileSync(dataFile, JSON.stringify(rsvps, null, 2));
}

// API endpoint to submit RSVP
app.post('/api/rsvp', (req, res) => {
  const { name, email, guests, attending } = req.body;
  if (!name || !email) {
    return res.status(400).json({ error: 'Name and email are required' });
  }

  const rsvps = readRSVPs();
  const newEntry = {
    id: Date.now(),
    name,
    email,
    guests: parseInt(guests) || 1,
    attending: attending === 'yes',
    timestamp: new Date().toISOString()
  };
  rsvps.push(newEntry);
  writeRSVPs(rsvps);
  res.json({ success: true, message: 'RSVP recorded' });
});

// Admin endpoint: get all RSVPs (simple, no authentication for demo)
app.get('/api/admin/rsvps', (req, res) => {
  const rsvps = readRSVPs();
  // compute counts
  const total = rsvps.length;
  const coming = rsvps.filter(r => r.attending).length;
  const notComing = total - coming;
  const totalGuests = rsvps.reduce((sum, r) => sum + (r.attending ? r.guests : 0), 0);

  res.json({
    rsvps,
    stats: { total, coming, notComing, totalGuests }
  });
});

// Optional: serve an admin dashboard page
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});