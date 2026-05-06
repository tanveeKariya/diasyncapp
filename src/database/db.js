import * as SQLite from 'expo-sqlite';

let db;

// Initialize DB
export const initDB = async () => {
  db = await SQLite.openDatabaseAsync('diabetes.db');

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS glucose (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      value REAL,
      timestamp TEXT
    );

    CREATE TABLE IF NOT EXISTS insulin (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      units REAL,
      type TEXT,
      timestamp TEXT
    );
  `);
};

// Insert Glucose
export const insertGlucose = async (value, timestamp) => {
  await db.runAsync(
    `INSERT INTO glucose (value, timestamp) VALUES (?, ?)`,
    [value, timestamp]
  );
};

// Fetch Glucose
export const fetchGlucose = async () => {
  return await db.getAllAsync(
    `SELECT * FROM glucose ORDER BY timestamp DESC`
  );
};

// Insert Insulin
export const insertInsulin = async (units, type) => {
  await db.runAsync(
    `INSERT INTO insulin (units, type, timestamp) VALUES (?, ?, ?)`,
    [units, type, new Date().toISOString()]
  );
};

// Fetch Insulin
export const fetchInsulin = async () => {
  return await db.getAllAsync(
    `SELECT * FROM insulin ORDER BY timestamp DESC`
  );
};