import { Platform, Share, Alert } from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { format } from 'date-fns';

import { fetchGlucose, fetchInsulin, fetchFood } from '../database/db';

const escapeCSV = (val) => {
  const str = String(val ?? '');
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
};

export const exportAllData = async () => {
  const [glucose, insulin, food] = await Promise.all([
    fetchGlucose(),
    fetchInsulin(),
    fetchFood(),
  ]);

  const lines = ['type,value,units,carbs,note,timestamp'];

  for (const g of glucose) {
    lines.push([
      'glucose',
      escapeCSV(g.value),
      '',
      '',
      escapeCSV(g.note),
      escapeCSV(g.timestamp),
    ].join(','));
  }

  for (const i of insulin) {
    lines.push([
      'insulin',
      '',
      escapeCSV(i.units),
      '',
      escapeCSV(i.note),
      escapeCSV(i.timestamp),
    ].join(','));
  }

  for (const f of food) {
    lines.push([
      'food',
      escapeCSV(f.name),
      '',
      escapeCSV(f.carbs),
      escapeCSV(f.note),
      escapeCSV(f.timestamp),
    ].join(','));
  }

  const csvContent = lines.join('\n');
  const filename = `diabetes_export_${format(new Date(), 'yyyy-MM-dd_HHmm')}.csv`;

  if (Platform.OS === 'web') {
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    return filename;
  }

  const filePath = FileSystem.documentDirectory + filename;

  await FileSystem.writeAsStringAsync(filePath, csvContent, {
    encoding: FileSystem.EncodingType.UTF8,
  });

  const info = await FileSystem.getInfoAsync(filePath);
  if (!info.exists) {
    throw new Error('File was not created.');
  }

  const canShare = await Sharing.isAvailableAsync();
  if (canShare) {
    await Sharing.shareAsync(filePath, {
      mimeType: 'text/csv',
      dialogTitle: 'Export Diabetes Data',
      UTI: 'public.comma-separated-values-text',
    });
  } else {
    await Share.share({ message: csvContent, title: filename });
  }

  return filePath;
};
