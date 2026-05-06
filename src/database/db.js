import * as SQLite from 'expo-sqlite';

let db;

// ---------------------------------------------------------------------------
// PHASE 3: DATA STORAGE
// Opens (or creates) the local SQLite database and creates all three tables.
// WAL mode gives better concurrent read performance on mobile.
// ---------------------------------------------------------------------------

export const initDB = async () => {
  db = await SQLite.openDatabaseAsync('diabetes.db');

  await db.execAsync(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS glucose (
      id        INTEGER PRIMARY KEY AUTOINCREMENT,
      value     REAL    NOT NULL,
      note      TEXT    DEFAULT '',
      timestamp TEXT    NOT NULL
    );

    CREATE TABLE IF NOT EXISTS insulin (
      id        INTEGER PRIMARY KEY AUTOINCREMENT,
      units     REAL    NOT NULL,
      type      TEXT    NOT NULL DEFAULT 'Rapid',
      note      TEXT    DEFAULT '',
      timestamp TEXT    NOT NULL
    );

    CREATE TABLE IF NOT EXISTS food (
      id        INTEGER PRIMARY KEY AUTOINCREMENT,
      name      TEXT    NOT NULL,
      carbs     REAL    DEFAULT 0,
      note      TEXT    DEFAULT '',
      timestamp TEXT    NOT NULL
    );
  `);
};

// ---------------------------------------------------------------------------
// GLUCOSE CRUD
// ---------------------------------------------------------------------------

export const insertGlucose = async (value, timestamp, note = '') => {
  await db.runAsync(
    `INSERT INTO glucose (value, timestamp, note) VALUES (?, ?, ?)`,
    [value, timestamp, note]
  );
};

export const fetchGlucose = async () => {
  return await db.getAllAsync(
    `SELECT * FROM glucose ORDER BY timestamp DESC`
  );
};

export const fetchGlucoseByRange = async (startISO, endISO) => {
  return await db.getAllAsync(
    `SELECT * FROM glucose WHERE timestamp >= ? AND timestamp <= ? ORDER BY timestamp ASC`,
    [startISO, endISO]
  );
};

export const deleteGlucose = async (id) => {
  await db.runAsync(`DELETE FROM glucose WHERE id = ?`, [id]);
};

export const updateGlucose = async (id, value, timestamp, note = '') => {
  await db.runAsync(
    `UPDATE glucose SET value = ?, timestamp = ?, note = ? WHERE id = ?`,
    [value, timestamp, note, id]
  );
};

// ---------------------------------------------------------------------------
// INSULIN CRUD
// ---------------------------------------------------------------------------

export const insertInsulin = async (units, type, timestamp, note = '') => {
  await db.runAsync(
    `INSERT INTO insulin (units, type, timestamp, note) VALUES (?, ?, ?, ?)`,
    [units, type, timestamp, note]
  );
};

export const fetchInsulin = async () => {
  return await db.getAllAsync(
    `SELECT * FROM insulin ORDER BY timestamp DESC`
  );
};

export const fetchInsulinByRange = async (startISO, endISO) => {
  return await db.getAllAsync(
    `SELECT * FROM insulin WHERE timestamp >= ? AND timestamp <= ? ORDER BY timestamp ASC`,
    [startISO, endISO]
  );
};

export const deleteInsulin = async (id) => {
  await db.runAsync(`DELETE FROM insulin WHERE id = ?`, [id]);
};

// ---------------------------------------------------------------------------
// FOOD CRUD
// ---------------------------------------------------------------------------

export const insertFood = async (name, carbs, timestamp, note = '') => {
  await db.runAsync(
    `INSERT INTO food (name, carbs, timestamp, note) VALUES (?, ?, ?, ?)`,
    [name, carbs ?? 0, timestamp, note]
  );
};

export const fetchFood = async () => {
  return await db.getAllAsync(
    `SELECT * FROM food ORDER BY timestamp DESC`
  );
};

export const fetchFoodByRange = async (startISO, endISO) => {
  return await db.getAllAsync(
    `SELECT * FROM food WHERE timestamp >= ? AND timestamp <= ? ORDER BY timestamp ASC`,
    [startISO, endISO]
  );
};

export const deleteFood = async (id) => {
  await db.runAsync(`DELETE FROM food WHERE id = ?`, [id]);
};

// ---------------------------------------------------------------------------
// ANALYTICS HELPERS
// ---------------------------------------------------------------------------

export const fetchGlucoseStats = async (startISO, endISO) => {
  const rows = await fetchGlucoseByRange(startISO, endISO);
  if (!rows.length) return { avg: null, min: null, max: null, count: 0, inRange: 0 };

  const values = rows.map(r => r.value);
  const avg = values.reduce((a, b) => a + b, 0) / values.length;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const inRange = values.filter(v => v >= 70 && v <= 180).length;

  return { avg: Math.round(avg), min, max, count: values.length, inRange };
};