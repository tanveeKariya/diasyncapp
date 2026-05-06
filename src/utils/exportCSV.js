// PHASE 7 BONUS: Export all logged data as a CSV file and share it
// Works on native (Android/iOS) via expo-sharing, and on web via download
import { Platform, Share, Alert } from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { format } from 'date-fns';

import { fetchGlucose, fetchInsulin, fetchFood } from '../database/db';

// Convert an array of objects to a CSV string
const toCSV = (headers, rows, mapper) => {
  const lines = [headers.join(',')];
  for (const row of rows) {
    lines.push(
      mapper(row)
        .map(v => `"${String(v ?? '').replace(/"/g, '""')}"`)
        .join(',')
    );
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
    ['ID', 'Value_mg_dL', 'Timestamp', 'Note'],
    glucose,
    r => [r.id, r.value, format(new Date(r.timestamp), 'yyyy-MM-dd HH:mm:ss'), r.note || '']
  );

  const insulinCSV = toCSV(
    ['ID', 'Units', 'Type', 'Timestamp', 'Note'],
    insulin,
    r => [r.id, r.units, r.type, format(new Date(r.timestamp), 'yyyy-MM-dd HH:mm:ss'), r.note || '']
  );

  const foodCSV = toCSV(
    ['ID', 'Food', 'Carbs_g', 'Timestamp', 'Note'],
    food,
    r => [r.id, r.name, r.carbs, format(new Date(r.timestamp), 'yyyy-MM-dd HH:mm:ss'), r.note || '']
  );

  const combined =
    'GLUCOSE_READINGS\n' + glucoseCSV +
    '\n\nINSULIN_DOSES\n' + insulinCSV +
    '\n\nFOOD_ENTRIES\n'  + foodCSV;

  const filename = `diabetes_export_${format(new Date(), 'yyyy-MM-dd')}.csv`;

  // Web platform: use the Share API with the CSV text directly
  if (Platform.OS === 'web') {
    try {
      // Create a downloadable blob
      const blob = new Blob([combined], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      return 'web_download';
    } catch (e) {
      // Fallback to React Native Share
      await Share.share({ message: combined, title: filename });
      return 'web_share';
    }
  }

  // Native platform: write to file then share
  const filePath = FileSystem.documentDirectory + filename;

  await FileSystem.writeAsStringAsync(filePath, combined, {
    encoding: FileSystem.EncodingType.UTF8,
  });

  const canShare = await Sharing.isAvailableAsync();
  if (canShare) {
    await Sharing.shareAsync(filePath, {
      mimeType: 'text/csv',
      dialogTitle: 'Export Diabetes Data',
      UTI: 'public.comma-separated-values-text',
    });
  } else {
    // Fallback to React Native Share
    await Share.share({ message: combined, title: filename });
  }

  return filePath;
};
