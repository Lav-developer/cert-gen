const express = require('express');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const db = require('./db');
const { generateCertificates } = require('./utils/generator');

const app = express();
const PORT = process.env.PORT || 3000;

// Ensure generated directory exists
const genDir = path.join(__dirname, 'public', 'generated');
if (!fs.existsSync(genDir)) fs.mkdirSync(genDir, { recursive: true });

// Middleware
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(session({
  secret: 'certsecret123',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 24 * 60 * 60 * 1000 } // 1 day
}));

// Admin authentication middleware
function requireAdmin(req, res, next) {
  if (req.session && req.session.admin) return next();
  res.redirect('/admin/login');
}

// Generate unique certificate ID
function generateCertId() {
  return 'CERT-' + uuidv4().slice(0, 8).toUpperCase();
}

// Default landing page
app.get('/', (req, res) => {
  if (req.session && req.session.admin) return res.redirect('/admin/dashboard');
  res.redirect('/admin/login');
});

// ---------------- Admin Routes -----------------
app.get('/admin/login', (req, res) => {
  if (req.session.admin) return res.redirect('/admin/dashboard');
  res.render('login', { error: null });
});

app.post('/admin/login', (req, res) => {
  const { username, password } = req.body;
  db.get('SELECT * FROM admin_users WHERE username = ?', [username], (err, user) => {
    if (err || !user) return res.render('login', { error: 'Invalid credentials' });
    bcrypt.compare(password, user.password_hash, (err, result) => {
      if (result) {
        req.session.admin = { id: user.id, username: user.username };
        res.redirect('/admin/dashboard');
      } else {
        res.render('login', { error: 'Invalid credentials' });
      }
    });
  });
});

app.get('/admin/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/admin/login');
});

app.get('/admin/dashboard', requireAdmin, (req, res) => {
  res.render('dashboard');
});

// ---------------- API Endpoints -----------------
// Get all certificates (admin only)
app.get('/api/certificates', requireAdmin, (req, res) => {
  db.all('SELECT * FROM certificates ORDER BY created_at DESC', (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Generate new certificate
app.post('/api/certificates', requireAdmin, async (req, res) => {
  try {
    const { full_name, role, event_name, event_date } = req.body;
    if (!full_name || !role || !event_name || !event_date) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Generate unique ID (retry if collision)
    let cert_id;
    let exists = true;
    while (exists) {
      cert_id = generateCertId();
      const row = await new Promise(resolve => {
        db.get('SELECT id FROM certificates WHERE certificate_id = ?', [cert_id], (err, row) => resolve(row));
      });
      exists = !!row;
    }

    // Generate PDF and image
    const { pdfPath, imagePath } = await generateCertificates({
      full_name, role, event_name, event_date, certificate_id: cert_id
    });

    // Insert into database
    const stmt = db.prepare(
      'INSERT INTO certificates (certificate_id, full_name, role, event_name, event_date, pdf_path, image_path) VALUES (?,?,?,?,?,?,?)'
    );
    stmt.run(cert_id, full_name, role, event_name, event_date, pdfPath, imagePath, function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({
        success: true,
        certificate: {
          certificate_id: cert_id,
          full_name, role, event_name, event_date,
          pdf_path: pdfPath,
          image_path: imagePath
        }
      });
    });
    stmt.finalize();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Download PDF
app.get('/api/certificates/:cert_id/download/pdf', (req, res) => {
  const cert_id = req.params.cert_id;
  db.get('SELECT * FROM certificates WHERE certificate_id = ?', [cert_id], (err, cert) => {
    if (err || !cert) return res.status(404).send('Certificate not found');
    res.download(path.join(__dirname, 'public', cert.pdf_path));
  });
});

// Download Image
app.get('/api/certificates/:cert_id/download/image', (req, res) => {
  const cert_id = req.params.cert_id;
  db.get('SELECT * FROM certificates WHERE certificate_id = ?', [cert_id], (err, cert) => {
    if (err || !cert) return res.status(404).send('Certificate not found');
    res.download(path.join(__dirname, 'public', cert.image_path));
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});