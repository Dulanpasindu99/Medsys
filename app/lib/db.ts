import Database from "better-sqlite3";
import fs from "fs";
import path from "path";

const dataDir = path.join(process.cwd(), "data");
const dbPath = path.join(dataDir, "medlink.db");

function ensureDataDir() {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
}

function createSchema(db: Database.Database) {
  db.exec(`
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('owner', 'doctor', 'assistant')),
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS patients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      date_of_birth TEXT,
      phone TEXT,
      address TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS patient_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      patient_id INTEGER NOT NULL,
      note TEXT NOT NULL,
      created_by_user_id INTEGER,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY(patient_id) REFERENCES patients(id) ON DELETE CASCADE,
      FOREIGN KEY(created_by_user_id) REFERENCES users(id) ON DELETE SET NULL
    );
  `);
}

declare global {
  // eslint-disable-next-line no-var
  var __medlinkDb: Database.Database | undefined;
}

export function getDb() {
  if (!global.__medlinkDb) {
    ensureDataDir();
    const db = new Database(dbPath);
    createSchema(db);
    global.__medlinkDb = db;
  }

  return global.__medlinkDb;
}
