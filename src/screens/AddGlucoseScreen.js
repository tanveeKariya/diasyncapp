// Add Glucose — polished input with live status, quick-select, manual date/time
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format } from 'date-fns';

import { insertGlucose } from '../database/db';
import { COLORS, SPACING, RADIUS, getGlucoseStatus } from '../constants/themes';

const QUICK_VALUES = [54, 70, 90, 110, 140, 180, 250, 350];

export default function AddGlucoseScreen({ navigation }) {
  const [value, setValue]       = useState('');
  const [note, setNote]         = useState('');
  const [date, setDate]         = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);
  const [pickerMode, setPickerMode] = useState('date');
  const [saving, setSaving]     = useState(false);
  const [saved, setSaved]       = useState(false);
  const [error, setError]       = useState('');

  const numericValue = parseFloat(value);
  const preview = !isNaN(numericValue) && numericValue > 0 ? getGlucoseStatus(numericValue) : null;

  const validate = () => {
    if (!value.trim())        return 'Enter a glucose value.';
    if (isNaN(numericValue))  return 'Must be a number.';
    if (numericValue < 20)    return 'Too low (min 20 mg/dL).';
    if (numericValue > 600)   return 'Too high (max 600 mg/dL).';
    return null;
  };

  const handleSave = async () => {
    const err = validate();
    if (err) { setError(err); return; }
    setError('');
    setSaving(true);
    try {
      await insertGlucose(numericValue, date.toISOString(), note.trim());
      setSaved(true);
      setValue('');
      setNote('');
      setDate(new Date());
      setTimeout(() => { setSaved(false); navigation?.navigate?.('Dashboard'); }, 700);
    } catch {
      Alert.alert('Error', 'Could not save. Try again.');
    } finally {
      setSaving(false);
    }
  };

  const openPicker = (mode) => {
    setPickerMode(mode);
    setShowPicker(true);
  };

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.inner}>

        <Text style={styles.heading}>Log Glucose</Text>
        <Text style={styles.subheading}>Record your blood glucose reading</Text>

        {/* ─── Value ─── */}
        <Text style={styles.label}>Blood Glucose (mg/dL)</Text>
        <View style={[styles.inputWrap, preview && { borderColor: preview.color }]}>
          <TextInput
            value={value}
            onChangeText={v => { setValue(v); setError(''); }}
            keyboardType="decimal-pad"
            placeholder="0"
            placeholderTextColor={COLORS.placeholder}
            style={styles.bigInput}
            maxLength={5}
          />
          {preview && (
            <View style={[styles.livePill, { backgroundColor: preview.bg }]}>
              <Text style={[styles.livePillText, { color: preview.color }]}>{preview.label}</Text>
            </View>
          )}
        </View>

        {/* ─── Quick Select ─── */}
        <Text style={styles.hint}>Quick Select</Text>
        <View style={styles.quickRow}>
          {QUICK_VALUES.map(v => (
            <TouchableOpacity
              key={v}
              style={[styles.quickPill, value === String(v) && styles.quickPillActive]}
              onPress={() => { setValue(String(v)); setError(''); }}
            >
              <Text style={[styles.quickPillText, value === String(v) && styles.quickPillTextActive]}>{v}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ─── Date & Time ─── */}
        <Text style={styles.label}>Date & Time</Text>
        <View style={styles.dtRow}>
          <TouchableOpacity style={styles.dtBtn} onPress={() => openPicker('date')}>
            <Text style={styles.dtBtnLabel}>Date</Text>
            <Text style={styles.dtBtnValue}>{format(date, 'd MMM yyyy')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.dtBtn} onPress={() => openPicker('time')}>
            <Text style={styles.dtBtnLabel}>Time</Text>
            <Text style={styles.dtBtnValue}>{format(date, 'HH:mm')}</Text>
          </TouchableOpacity>
        </View>
        {showPicker && (
          <DateTimePicker
            value={date}
            mode={pickerMode}
            display="default"
            onChange={(e, sel) => {
              setShowPicker(false);
              if (sel) setDate(sel);
            }}
          />
        )}

        {/* ─── Note ─── */}
        <Text style={styles.label}>Note (optional)</Text>
        <TextInput
          value={note}
          onChangeText={setNote}
          placeholder="e.g. before breakfast, after exercise..."
          placeholderTextColor={COLORS.placeholder}
          style={styles.noteInput}
          multiline
          maxLength={200}
        />

        {!!error && <Text style={styles.error}>{error}</Text>}
        }

        <TouchableOpacity
          style={[styles.saveBtn, saved && styles.saveBtnDone]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.saveBtnText}>{saved ? 'Saved!' : 'Save Reading'}</Text>
          }
        </TouchableOpacity>

        <View style={{ height: 30 }} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  inner: { padding: SPACING.xl },

  heading:    { fontSize: 24, fontWeight: '800', color: COLORS.text, marginBottom: 2 },
  subheading: { fontSize: 14, color: COLORS.subtext, marginBottom: SPACING.xxl },

  label: { fontSize: 12, fontWeight: '700', color: COLORS.textMed, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.8 },
  hint:  { fontSize: 11, color: COLORS.subtext, marginBottom: 6 },

  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    borderWidth: 2,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.lg,
    shadowColor: COLORS.shadow,
    shadowOpacity: 1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  bigInput: { flex: 1, fontSize: 36, fontWeight: '800', color: COLORS.text, paddingVertical: 14 },
  livePill:     { borderRadius: RADIUS.full, paddingHorizontal: 12, paddingVertical: 5 },
  livePillText: { fontSize: 12, fontWeight: '700' },

  quickRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: SPACING.xl },
  quickPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  quickPillActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  quickPillText:       { color: COLORS.textMed, fontWeight: '600', fontSize: 13 },
  quickPillTextActive: { color: COLORS.white },

  dtRow: { flexDirection: 'row', gap: 8, marginBottom: SPACING.lg },
  dtBtn: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  dtBtnLabel: { fontSize: 10, color: COLORS.subtext, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 },
  dtBtnValue: { fontSize: 15, fontWeight: '700', color: COLORS.text },

  noteInput: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    fontSize: 14,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.border,
    minHeight: 72,
    textAlignVertical: 'top',
    marginBottom: SPACING.lg,
  },

  error: { color: COLORS.high, fontSize: 13, fontWeight: '600', marginBottom: SPACING.md },

  saveBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.lg,
    padding: 16,
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  saveBtnDone: { backgroundColor: COLORS.safe },
  saveBtnText: { color: COLORS.white, fontSize: 16, fontWeight: '700' },
});
