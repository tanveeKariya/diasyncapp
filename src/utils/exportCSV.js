// PHASE 7 BONUS: Export all logged data as a CSV file and share it
import * as FileSystem from 'expo-file-system';
import * as Sharing    from 'expo-sharing';
import { format }      from 'date-fns';

import { fetchGlucose, fetchInsulin, fetchFood } from '../database/db';

// Convert an array of objects to a CSV string
const toCSV = (headers, rows, mapper) => {
  const lines = [headers.join(',')];
  for (const row of rows) {
    lines.push(mapper(row).map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(','));
  }
  return lines.join('\n');
};

export const exportAllData = async () => {
  const [glucose, insulin, food] = await Promise.all([
    fetchGlucose(),
    fetchInsulin(),
    fetchFood(),
  ]);

  const glucoseCSV = toCSV(
    ['ID', 'Value (mg/dL)', 'Timestamp', 'Note'],
    glucose,
    r => [r.id, r.value, format(new Date(r.timestamp), 'yyyy-MM-dd HH:mm:ss'), r.note]
  );

  const insulinCSV = toCSV(
    ['ID', 'Units', 'Type', 'Timestamp', 'Note'],
    insulin,
    r => [r.id, r.units, r.type, format(new Date(r.timestamp), 'yyyy-MM-dd HH:mm:ss'), r.note]
  );

  const foodCSV = toCSV(
    ['ID', 'Food', 'Carbs (g)', 'Timestamp', 'Note'],
    food,
    r => [r.id, r.name, r.carbs, format(new Date(r.timestamp), 'yyyy-MM-dd HH:mm:ss'), r.note]
  );

  const combined =
    '=== GLUCOSE READINGS ===\n' + glucoseCSV +
    '\n\n=== INSULIN DOSES ===\n' + insulinCSV +
    '\n\n=== FOOD ENTRIES ===\n'  + foodCSV;

  const filename = `diabetes_data_${format(new Date(), 'yyyy-MM-dd')}.csv`;
  const filePath = FileSystem.documentDirectory + filename;

  await FileSystem.writeAsStringAsync(filePath, combined, {
    encoding: FileSystem.EncodingType.UTF8,
  });

  const canShare = await Sharing.isAvailableAsync();
  if (canShare) {
    await Sharing.shareAsync(filePath, {
      mimeType: 'text/csv',
      dialogTitle: 'Export Diabetes Data',
    });
  }

  return filePath;
};
