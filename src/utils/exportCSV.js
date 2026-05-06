// Export all data as CSV — uses FileSystem.writeAsStringAsync + Sharing.shareAsync
import { Platform, Share, Alert } from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { format } from 'date-fns';

import { fetchGlucose, fetchInsulin, fetchFood } from '../database/db';

export const exportAllData = async () => {
  const [glucose, insulin, food] = await Promise.all([
    fetchGlucose(),
    fetchInsulin(),
    fetchFood(),
  ]);

  // Unified CSV format: type,value,units,timestamp
  const lines = ['type,value,units,timestamp'];

  for (const g of glucose) {
    lines.push(`glucose,${g.value},,${g.timestamp}`);
  }

  for (const i of insulin) {
    lines.push(`insulin,,${i.units},${i.timestamp}`);
  }

  for (const f of food) {
    const carbsPart = f.carbs > 0 ? `${f.carbs}` : '';
    lines.push(`food,${f.name},${carbsPart},${f.timestamp}`);
  }

  const csvContent = lines.join('\n');
  const filename = `diabetes_export_${format(new Date(), 'yyyy-MM-dd_HHmm')}.csv`;

  // Write file to device storage
  const filePath = FileSystem.documentDirectory + filename;

  await FileSystem.writeAsStringAsync(filePath, csvContent, {
    encoding: FileSystem.EncodingType.UTF8,
  });

  // Verify file was created
  const info = await FileSystem.getInfoAsync(filePath);
  if (!info.exists) {
    throw new Error('File was not created.');
  }

  // Share the file
  if (Platform.OS === 'web') {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    return filePath;
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
