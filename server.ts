import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import Database from "better-sqlite3";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import multer from "multer";
import cors from "cors";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;
const app = express();

console.log("Starting Trustline Capital Server...");
console.log("Environment:", process.env.NODE_ENV);
console.log("Port:", PORT);

const dbPath = path.join(process.cwd(), "trustline.db");
console.log("Database Path:", dbPath);

let db: Database.Database;
try {
  db = new Database(dbPath);
  console.log("Database initialized successfully.");
} catch (err) {
  console.error("Failed to initialize database:", err);
  process.exit(1);
}

// Initialize Database Schema
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT DEFAULT 'client', -- 'admin', 'crm', 'client'
    status TEXT DEFAULT 'active', -- 'active', 'suspended'
    realtor_cid TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    roi TEXT NOT NULL,
    duration TEXT NOT NULL,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS investments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    
    -- Personal Info
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    dob TEXT NOT NULL,
    gender TEXT NOT NULL,
    is_pep TEXT NOT NULL,
    tax_id TEXT,
    marital_status TEXT,
    country TEXT,
    state TEXT,
    nin TEXT,
    bvn TEXT,
    
    -- Investment Details
    currency TEXT NOT NULL,
    amount REAL NOT NULL,
    bank_name TEXT,
    account_number TEXT,
    account_name TEXT,
    duration TEXT NOT NULL,
    
    -- Next of Kin
    nok_name TEXT,
    nok_email TEXT,
    nok_address TEXT,
    nok_phone TEXT,
    
    -- Realtor Info
    realtor_cid TEXT,
    
    -- External Realtor Group
    rep_group TEXT,
    rep_group_cid TEXT,
    rep_name TEXT,
    rep_phone TEXT,
    rep_email TEXT,
    
    -- Documents (URLs)
    passport_url TEXT,
    id_card_url TEXT,
    utility_bill_url TEXT,
    signature_url TEXT,
    payment_proof_url TEXT,
    payment_date TEXT,
    
    kyc_status TEXT DEFAULT 'pending', -- 'pending', 'under_review', 'completed'
    validation_status TEXT DEFAULT 'pending', -- 'pending', 'completed'
    
    status TEXT DEFAULT 'pending', -- 'pending', 'verified', 'approved', 'rejected'
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (product_id) REFERENCES products(id)
  );

  CREATE TABLE IF NOT EXISTS permissions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    can_view_clients INTEGER DEFAULT 0,
    can_view_investments INTEGER DEFAULT 0,
    can_update_status INTEGER DEFAULT 0,
    can_edit_clients INTEGER DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );
`);

// Seed initial data if empty
const userCount = db.prepare("SELECT count(*) as count FROM users").get() as { count: number };
if (userCount.count === 0) {
  const hashedPassword = bcrypt.hashSync("trustline_admin_2026", 10);
  db.prepare("INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)").run(
    "Super Admin",
    "admin@trustline.com",
    hashedPassword,
    "admin"
  );

  // Seed default products
  const products = [
    { name: "FIIN NAIRA NOTE", roi: "15%", duration: "12 Months" },
    { name: "FIIN DOLLAR NOTES", roi: "8%", duration: "12 Months" },
    { name: "REAL ESTATE TREIN", roi: "25%", duration: "24 Months" }
  ];
  const insertProduct = db.prepare("INSERT INTO products (name, roi, duration) VALUES (?, ?, ?)");
  products.forEach(p => insertProduct.run(p.name, p.roi, p.duration));
}

const JWT_SECRET = process.env.JWT_SECRET || "trustline_secret_key_2026";

app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString(), env: process.env.NODE_ENV });
});

// Ensure uploads directory exists
const uploadsDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Multer setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname)
});
const upload = multer({ storage });

// Auth Middleware
const authenticate = (req: any, res: any, next: any) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Unauthorized" });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: "Invalid token" });
  }
};

// --- API Routes ---

// Auth
app.post("/api/auth/register", (req, res) => {
  const { name, email, password } = req.body;
  try {
    const hashedPassword = bcrypt.hashSync(password, 10);
    const result = db.prepare("INSERT INTO users (name, email, password) VALUES (?, ?, ?)").run(name, email, hashedPassword);
    res.json({ id: result.lastInsertRowid });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.patch("/api/auth/profile", authenticate, (req: any, res) => {
  const { name, email, password } = req.body;
  const userId = req.user.id;
  
  const fields = [];
  const values = [];
  
  if (name) { fields.push("name = ?"); values.push(name); }
  if (email) { fields.push("email = ?"); values.push(email); }
  if (password) { 
    const hashedPassword = bcrypt.hashSync(password, 10);
    fields.push("password = ?"); 
    values.push(hashedPassword); 
  }
  
  if (fields.length === 0) return res.json({ success: true });
  
  values.push(userId);
  try {
    db.prepare(`UPDATE users SET ${fields.join(", ")} WHERE id = ?`).run(...values);
    res.json({ success: true });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.post("/api/auth/login", (req, res) => {
  const { email, password } = req.body;
  const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email) as any;
  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ error: "Invalid credentials" });
  }
  if (user.status === 'suspended') {
    return res.status(403).json({ error: "Account suspended" });
  }
  
  const permissions = db.prepare("SELECT * FROM permissions WHERE user_id = ?").get(user.id) as any;
  
  const token = jwt.sign({ id: user.id, role: user.role, email: user.email }, JWT_SECRET, { expiresIn: "24h" });
  res.json({ 
    token, 
    user: { 
      id: user.id, 
      name: user.name, 
      email: user.email, 
      role: user.role,
      permissions: permissions || null
    } 
  });
});

// Products
app.get("/api/products", (req, res) => {
  const products = db.prepare("SELECT * FROM products").all();
  res.json(products);
});

app.post("/api/products", authenticate, (req: any, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: "Forbidden" });
  const { name, roi, duration, description } = req.body;
  const result = db.prepare("INSERT INTO products (name, roi, duration, description) VALUES (?, ?, ?, ?)").run(name, roi, duration, description);
  res.json({ id: result.lastInsertRowid });
});

app.patch("/api/products/:id", authenticate, (req: any, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: "Forbidden" });
  const { name, roi, duration, description } = req.body;
  db.prepare("UPDATE products SET name = ?, roi = ?, duration = ?, description = ? WHERE id = ?").run(name, roi, duration, description, req.params.id);
  res.json({ success: true });
});

app.delete("/api/products/:id", authenticate, (req: any, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: "Forbidden" });
  db.prepare("DELETE FROM products WHERE id = ?").run(req.params.id);
  res.json({ success: true });
});

// Investments
app.post("/api/investments", authenticate, upload.fields([
  { name: 'passport', maxCount: 1 },
  { name: 'id_card', maxCount: 1 },
  { name: 'utility_bill', maxCount: 1 },
  { name: 'signature', maxCount: 1 },
  { name: 'payment_proof', maxCount: 1 }
]), (req: any, res) => {
  const { 
    productId, full_name, email, phone, dob, gender, is_pep, tax_id, marital_status, 
    country, state, nin, bvn, currency, amount, bank_name, account_number, account_name, 
    duration, nok_name, nok_email, nok_address, nok_phone, realtor_cid, 
    rep_group, rep_group_cid, rep_name, rep_phone, rep_email, payment_date
  } = req.body;

  const files = req.files as any;
  const passport_url = files['passport'] ? `/uploads/${files['passport'][0].filename}` : null;
  const id_card_url = files['id_card'] ? `/uploads/${files['id_card'][0].filename}` : null;
  const utility_bill_url = files['utility_bill'] ? `/uploads/${files['utility_bill'][0].filename}` : null;
  const signature_url = files['signature'] ? `/uploads/${files['signature'][0].filename}` : null;
  const payment_proof_url = files['payment_proof'] ? `/uploads/${files['payment_proof'][0].filename}` : null;

  try {
    const result = db.prepare(`
      INSERT INTO investments (
        user_id, product_id, full_name, email, phone, dob, gender, is_pep, tax_id, marital_status,
        country, state, nin, bvn, currency, amount, bank_name, account_number, account_name,
        duration, nok_name, nok_email, nok_address, nok_phone, realtor_cid,
        rep_group, rep_group_cid, rep_name, rep_phone, rep_email,
        passport_url, id_card_url, utility_bill_url, signature_url, payment_proof_url, payment_date
      )
      VALUES (
        @user_id, @product_id, @full_name, @email, @phone, @dob, @gender, @is_pep, @tax_id, @marital_status,
        @country, @state, @nin, @bvn, @currency, @amount, @bank_name, @account_number, @account_name,
        @duration, @nok_name, @nok_email, @nok_address, @nok_phone, @realtor_cid,
        @rep_group, @rep_group_cid, @rep_name, @rep_phone, @rep_email,
        @passport_url, @id_card_url, @utility_bill_url, @signature_url, @payment_proof_url, @payment_date
      )
    `).run({
      user_id: req.user.id,
      product_id: productId,
      full_name,
      email,
      phone,
      dob,
      gender,
      is_pep,
      tax_id,
      marital_status,
      country,
      state,
      nin,
      bvn,
      currency,
      amount,
      bank_name,
      account_number,
      account_name,
      duration,
      nok_name,
      nok_email,
      nok_address,
      nok_phone,
      realtor_cid,
      rep_group,
      rep_group_cid,
      rep_name,
      rep_phone,
      rep_email,
      passport_url,
      id_card_url,
      utility_bill_url,
      signature_url,
      payment_proof_url,
      payment_date
    });
    res.json({ id: result.lastInsertRowid });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.get("/api/my-investments", authenticate, (req: any, res) => {
  const investments = db.prepare(`
    SELECT i.*, p.name as product_name 
    FROM investments i 
    JOIN products p ON i.product_id = p.id 
    WHERE i.user_id = ?
  `).all(req.user.id);
  res.json(investments);
});

// Admin/CRM Routes
app.get("/api/admin/stats", authenticate, (req: any, res) => {
  if (!['admin', 'crm'].includes(req.user.role)) return res.status(403).json({ error: "Forbidden" });
  const totalClients = db.prepare("SELECT count(*) as count FROM users WHERE role = 'client'").get() as any;
  const totalInvestments = db.prepare("SELECT count(*) as count FROM investments").get() as any;
  const totalRevenue = db.prepare("SELECT sum(amount) as sum FROM investments WHERE status = 'approved'").get() as any;
  const recentTransactions = db.prepare(`
    SELECT i.*, u.name as client_name, p.name as product_name 
    FROM investments i 
    JOIN users u ON i.user_id = u.id 
    JOIN products p ON i.product_id = p.id 
    ORDER BY i.created_at DESC LIMIT 5
  `).all();

  // Monthly data for chart
  const monthlyData = db.prepare(`
    SELECT strftime('%Y-%m', created_at) as month, SUM(amount) as amount
    FROM investments
    WHERE status = 'approved'
    GROUP BY month
    ORDER BY month ASC
    LIMIT 12
  `).all();

  res.json({
    totalClients: totalClients.count,
    totalInvestments: totalInvestments.count,
    totalRevenue: totalRevenue.sum || 0,
    recentTransactions,
    monthlyData
  });
});

app.get("/api/admin/staff", authenticate, (req: any, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: "Forbidden" });
  const staff = db.prepare(`
    SELECT u.id, u.name, u.email, u.role, u.status, u.created_at,
           p.can_view_clients, p.can_view_investments, p.can_update_status, p.can_edit_clients
    FROM users u
    LEFT JOIN permissions p ON u.id = p.user_id
    WHERE u.role IN ('admin', 'crm')
  `).all();
  res.json(staff);
});

app.post("/api/admin/staff", authenticate, (req: any, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: "Forbidden" });
  const { name, email, password, role, permissions } = req.body;
  const hashedPassword = bcrypt.hashSync(password, 10);
  
  try {
    const result = db.prepare("INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)").run(
      name, email, hashedPassword, role
    );
    const userId = result.lastInsertRowid;
    
    db.prepare(`
      INSERT INTO permissions (user_id, can_view_clients, can_view_investments, can_update_status, can_edit_clients)
      VALUES (?, ?, ?, ?, ?)
    `).run(
      userId,
      permissions?.can_view_clients ? 1 : 0,
      permissions?.can_view_investments ? 1 : 0,
      permissions?.can_update_status ? 1 : 0,
      permissions?.can_edit_clients ? 1 : 0
    );
    
    res.json({ success: true, userId });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.delete("/api/admin/staff/:id", authenticate, (req: any, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: "Forbidden" });
  if (parseInt(req.params.id) === req.user.id) return res.status(400).json({ error: "Cannot delete yourself" });
  
  db.prepare("DELETE FROM permissions WHERE user_id = ?").run(req.params.id);
  db.prepare("DELETE FROM users WHERE id = ?").run(req.params.id);
  res.json({ success: true });
});

app.patch("/api/admin/staff/:id/permissions", authenticate, (req: any, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: "Forbidden" });
  const { can_view_clients, can_view_investments, can_update_status, can_edit_clients } = req.body;
  
  db.prepare(`
    UPDATE permissions 
    SET can_view_clients = ?, can_view_investments = ?, can_update_status = ?, can_edit_clients = ?
    WHERE user_id = ?
  `).run(
    can_view_clients ? 1 : 0,
    can_view_investments ? 1 : 0,
    can_update_status ? 1 : 0,
    can_edit_clients ? 1 : 0,
    req.params.id
  );
  res.json({ success: true });
});

app.get("/api/admin/clients", authenticate, (req: any, res) => {
  if (!['admin', 'crm'].includes(req.user.role)) return res.status(403).json({ error: "Forbidden" });
  const clients = db.prepare("SELECT id, name, email, role, status, created_at FROM users WHERE role = 'client'").all();
  res.json(clients);
});

app.get("/api/admin/clients/:id", authenticate, (req: any, res) => {
  if (!['admin', 'crm'].includes(req.user.role)) return res.status(403).json({ error: "Forbidden" });
  const client = db.prepare("SELECT id, name, email, role, status, created_at FROM users WHERE id = ?").get(req.params.id);
  const investments = db.prepare(`
    SELECT i.*, p.name as product_name 
    FROM investments i 
    JOIN products p ON i.product_id = p.id 
    WHERE i.user_id = ?
  `).all(req.params.id);
  res.json({ client, investments });
});

app.patch("/api/admin/clients/:id", authenticate, (req: any, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: "Forbidden" });
  const { status, name, email } = req.body;
  db.prepare("UPDATE users SET status = ?, name = ?, email = ? WHERE id = ?").run(status, name, email, req.params.id);
  res.json({ success: true });
});

app.delete("/api/admin/clients/:id", authenticate, (req: any, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: "Forbidden" });
  db.prepare("DELETE FROM users WHERE id = ?").run(req.params.id);
  res.json({ success: true });
});

app.get("/api/admin/realtors", authenticate, (req: any, res) => {
  if (!['admin', 'crm'].includes(req.user.role)) return res.status(403).json({ error: "Forbidden" });
  const realtors = db.prepare("SELECT id, name, email, realtor_cid, status, created_at FROM users WHERE role = 'realtor'").all();
  res.json(realtors);
});

app.get("/api/admin/investments", authenticate, (req: any, res) => {
  if (!['admin', 'crm'].includes(req.user.role)) return res.status(403).json({ error: "Forbidden" });
  const investments = db.prepare(`
    SELECT i.*, u.name as client_name, p.name as product_name 
    FROM investments i 
    JOIN users u ON i.user_id = u.id 
    JOIN products p ON i.product_id = p.id 
    ORDER BY i.created_at DESC
  `).all();
  res.json(investments);
});

app.patch("/api/admin/investments/:id", authenticate, upload.fields([
  { name: 'passport', maxCount: 1 },
  { name: 'id_card', maxCount: 1 },
  { name: 'utility_bill', maxCount: 1 },
  { name: 'signature', maxCount: 1 },
  { name: 'payment_proof', maxCount: 1 }
]), (req: any, res) => {
  if (!['admin', 'crm'].includes(req.user.role)) return res.status(403).json({ error: "Forbidden" });
  
  const { id } = req.params;
  const updates = req.body;
  const files = req.files as any;

  // Build dynamic update query
  const fields = [];
  const values = [];

  // Handle regular fields
  const allowedFields = [
    'status', 'kyc_status', 'validation_status', 'full_name', 'email', 'phone', 'dob', 'gender', 'is_pep', 'tax_id', 
    'marital_status', 'country', 'state', 'nin', 'bvn', 'currency', 'amount', 
    'bank_name', 'account_number', 'account_name', 'duration', 'nok_name', 
    'nok_email', 'nok_address', 'nok_phone', 'realtor_cid', 'rep_group', 
    'rep_group_cid', 'rep_name', 'rep_phone', 'rep_email', 'payment_date'
  ];

  allowedFields.forEach(field => {
    if (updates[field] !== undefined) {
      fields.push(`${field} = ?`);
      values.push(updates[field]);
    }
  });

  // Handle file fields
  const fileFields: { [key: string]: string } = {
    passport: 'passport_url',
    id_card: 'id_card_url',
    utility_bill: 'utility_bill_url',
    signature: 'signature_url',
    payment_proof: 'payment_proof_url'
  };

  Object.entries(fileFields).forEach(([formKey, dbKey]) => {
    if (files && files[formKey]) {
      fields.push(`${dbKey} = ?`);
      values.push(`/uploads/${files[formKey][0].filename}`);
    } else if (updates[`delete_${formKey}`] === 'true') {
      fields.push(`${dbKey} = ?`);
      values.push(null);
    }
  });

  if (fields.length === 0) return res.json({ success: true });

  values.push(id);
  try {
    db.prepare(`UPDATE investments SET ${fields.join(', ')} WHERE id = ?`).run(...values);
    res.json({ success: true });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.delete("/api/admin/investments/:id", authenticate, (req: any, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: "Forbidden" });
  db.prepare("DELETE FROM investments WHERE id = ?").run(req.params.id);
  res.json({ success: true });
});

// --- Vite Middleware ---

async function startServer() {
  if (process.env.NODE_ENV === "production" || fs.existsSync(path.join(process.cwd(), "dist"))) {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      if (req.path.startsWith("/api")) return res.status(404).json({ error: "API route not found" });
      res.sendFile(path.join(distPath, "index.html"));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
