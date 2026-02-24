import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import fs from "fs";
import * as XLSX from "xlsx";

const db = new Database("products.db");
const EXCEL_PATH = path.resolve("src/Product_List.xlsx");

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

function syncWithExcel() {
  console.log("Checking for Excel database at:", EXCEL_PATH);
  
  const sampleData = [
    { model: "AX-701", dio: 512, aio: 128, serial_ports: 2, pulse_axes: 4, ethercat_axes: 8, pulse_interp_linear: 1, pulse_interp_circular: 1, pulse_interp_fixed: 1, ethercat_interp_linear: 1, ethercat_interp_circular: 1, ethercat_interp_fixed: 1, ethercat_interp_spiral: 0, e_cam_axes: 4 },
    { model: "AX-702", dio: 1024, aio: 128, serial_ports: 4, pulse_axes: 8, ethercat_axes: 16, pulse_interp_linear: 1, pulse_interp_circular: 1, pulse_interp_fixed: 1, ethercat_interp_linear: 1, ethercat_interp_circular: 1, ethercat_interp_fixed: 1, ethercat_interp_spiral: 1, e_cam_axes: 8 },
    { model: "AX-703", dio: 2048, aio: 256, serial_ports: 6, pulse_axes: 8, ethercat_axes: 32, pulse_interp_linear: 1, pulse_interp_circular: 1, pulse_interp_fixed: 1, ethercat_interp_linear: 1, ethercat_interp_circular: 1, ethercat_interp_fixed: 1, ethercat_interp_spiral: 1, e_cam_axes: 16 },
    { model: "BX-100", dio: 256, aio: 64, serial_ports: 1, pulse_axes: 2, ethercat_axes: 0, pulse_interp_linear: 1, pulse_interp_circular: 0, pulse_interp_fixed: 0, ethercat_interp_linear: 0, ethercat_interp_circular: 0, ethercat_interp_fixed: 0, ethercat_interp_spiral: 0, e_cam_axes: 0 },
    { model: "CX-500", dio: 1024, aio: 256, serial_ports: 4, pulse_axes: 0, ethercat_axes: 16, pulse_interp_linear: 0, pulse_interp_circular: 0, pulse_interp_fixed: 0, ethercat_interp_linear: 1, ethercat_interp_circular: 1, ethercat_interp_fixed: 1, ethercat_interp_spiral: 1, e_cam_axes: 16 },
    { model: "DX-200", dio: 512, aio: 128, serial_ports: 2, pulse_axes: 4, ethercat_axes: 4, pulse_interp_linear: 1, pulse_interp_circular: 1, pulse_interp_fixed: 0, ethercat_interp_linear: 1, ethercat_interp_circular: 0, ethercat_interp_fixed: 0, ethercat_interp_spiral: 0, e_cam_axes: 2 },
  ];

  if (!fs.existsSync(EXCEL_PATH)) {
    console.log("Excel file not found. Creating sample at src/Product_List.xlsx");
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(sampleData);
    XLSX.utils.book_append_sheet(wb, ws, "Products");
    XLSX.writeFile(wb, EXCEL_PATH);
  }

  try {
    const workbook = XLSX.readFile(EXCEL_PATH);
    const sheetName = workbook.SheetNames[0];
    const data = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]) as any[];

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
    console.log(`Successfully synced ${data.length} products from Excel.`);
  } catch (error) {
    console.error("Error syncing with Excel:", error);
  }
}

// Initial sync
syncWithExcel();

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

    // Pulse Interpolation
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

  app.post("/api/admin/sync", (req, res) => {
    const { password } = req.body;
    if (password !== "admin123") {
      return res.status(403).json({ error: "Invalid password" });
    }
    syncWithExcel();
    res.json({ success: true });
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
