import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

const db = new Database("products.db");

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    model TEXT UNIQUE,
    dio INTEGER,
    aio INTEGER,
    serial_ports INTEGER,
    pulse_axes INTEGER,
    ethercat_axes INTEGER,
    pulse_interp_linear BOOLEAN,
    pulse_interp_circular BOOLEAN,
    pulse_interp_fixed BOOLEAN,
    ethercat_interp_linear BOOLEAN,
    ethercat_interp_circular BOOLEAN,
    ethercat_interp_fixed BOOLEAN,
    ethercat_interp_spiral BOOLEAN,
    e_cam_axes INTEGER
  )
`);

// Seed data if empty
const count = db.prepare("SELECT COUNT(*) as count FROM products").get() as { count: number };
if (count.count === 0) {
  const insert = db.prepare(`
    INSERT INTO products (
      model, dio, aio, serial_ports, pulse_axes, ethercat_axes, 
      pulse_interp_linear, pulse_interp_circular, pulse_interp_fixed,
      ethercat_interp_linear, ethercat_interp_circular, ethercat_interp_fixed, ethercat_interp_spiral,
      e_cam_axes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const sampleData = [
    ["AX-701", 512, 128, 2, 4, 8, 1, 1, 1, 1, 1, 1, 0, 4],
    ["AX-702", 1024, 128, 4, 8, 16, 1, 1, 1, 1, 1, 1, 1, 8],
    ["AX-703", 2048, 256, 6, 8, 32, 1, 1, 1, 1, 1, 1, 1, 16],
    ["BX-100", 256, 64, 1, 2, 0, 1, 0, 0, 0, 0, 0, 0, 0],
    ["CX-500", 1024, 256, 4, 0, 16, 0, 0, 0, 1, 1, 1, 1, 16],
    ["DX-200", 512, 128, 2, 4, 4, 1, 1, 0, 1, 0, 0, 0, 2],
  ];

  for (const row of sampleData) {
    insert.run(...row);
  }
}

async function startServer() {
  const app = express();
  app.use(express.json());
  const PORT = 3000;

  // API Routes
  app.post("/api/products/filter", (req, res) => {
    const filters = req.body;
    
    let query = "SELECT * FROM products WHERE 1=1";
    const params: any[] = [];

    if (filters.dio) {
      query += " AND dio >= ?";
      params.push(filters.dio);
    }
    if (filters.aio) {
      query += " AND aio >= ?";
      params.push(filters.aio);
    }
    if (filters.serial_ports !== undefined) {
      query += " AND serial_ports >= ?";
      params.push(filters.serial_ports);
    }
    if (filters.pulse_axes !== undefined) {
      query += " AND pulse_axes >= ?";
      params.push(filters.pulse_axes);
    }
    if (filters.ethercat_axes !== undefined) {
      query += " AND ethercat_axes >= ?";
      params.push(filters.ethercat_axes);
    }
    if (filters.e_cam_axes !== undefined) {
      query += " AND e_cam_axes >= ?";
      params.push(filters.e_cam_axes);
    }

    // Pulse Interpolation (AND logic: if selected, must support)
    if (filters.pulse_interp_linear) query += " AND pulse_interp_linear = 1";
    if (filters.pulse_interp_circular) query += " AND pulse_interp_circular = 1";
    if (filters.pulse_interp_fixed) query += " AND pulse_interp_fixed = 1";

    // EtherCAT Interpolation
    if (filters.ethercat_interp_linear) query += " AND ethercat_interp_linear = 1";
    if (filters.ethercat_interp_circular) query += " AND ethercat_interp_circular = 1";
    if (filters.ethercat_interp_fixed) query += " AND ethercat_interp_fixed = 1";
    if (filters.ethercat_interp_spiral) query += " AND ethercat_interp_spiral = 1";

    try {
      const results = db.prepare(query).all(...params);
      res.json(results);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  app.get("/api/products/all", (req, res) => {
    const results = db.prepare("SELECT * FROM products").all();
    res.json(results);
  });

  app.post("/api/admin/upload", (req, res) => {
    // In a real app, we'd use multer to handle file uploads and xlsx to parse.
    // For this demo, we'll accept a JSON array of products to "update" the DB.
    const { password, data } = req.body;
    if (password !== "admin123") {
      return res.status(403).json({ error: "Invalid password" });
    }

    try {
      const deleteStmt = db.prepare("DELETE FROM products");
      const insert = db.prepare(`
        INSERT INTO products (
          model, dio, aio, serial_ports, pulse_axes, ethercat_axes, 
          pulse_interp_linear, pulse_interp_circular, pulse_interp_fixed,
          ethercat_interp_linear, ethercat_interp_circular, ethercat_interp_fixed, ethercat_interp_spiral,
          e_cam_axes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const transaction = db.transaction((rows) => {
        deleteStmt.run();
        for (const row of rows) {
          insert.run(
            row.model, row.dio, row.aio, row.serial_ports, row.pulse_axes, row.ethercat_axes,
            row.pulse_interp_linear ? 1 : 0, row.pulse_interp_circular ? 1 : 0, row.pulse_interp_fixed ? 1 : 0,
            row.ethercat_interp_linear ? 1 : 0, row.ethercat_interp_circular ? 1 : 0, row.ethercat_interp_fixed ? 1 : 0, row.ethercat_interp_spiral ? 1 : 0,
            row.e_cam_axes
          );
        }
      });

      transaction(data);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static("dist"));
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
