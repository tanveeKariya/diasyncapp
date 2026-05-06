// Add Insulin — type selector, unit input, manual date/time, quick-select
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

import { insertInsulin } from '../database/db';
import { COLORS, SPACING, RADIUS } from '../constants/themes';

const TYPES = [
  { key: 'Rapid', label: 'Rapid-Acting', desc: 'Humalog, NovoLog, Fiasp', icon: 'bolt' },
  { key: 'Long',  label: 'Long-Acting',  desc: 'Lantus, Basaglar, Toujeo', icon: 'moon' },
];

const QUICK_UNITS = [1, 2, 3, 4, 5, 6, 8, 10, 12, 15, 20];

export default function AddInsulinScreen({ navigation }) {
  const [units, setUnits]       = useState('');
  const [type, setType]         = useState('Rapid');
  const [note, setNote]         = useState('');
  const [date, setDate]         = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);
  const [pickerMode, setPickerMode] = useState('date');
  const [saving, setSaving]     = useState(false);
  const [saved, setSaved]       = useState(false);
  const [error, setError]       = useState('');

  const numericUnits = parseFloat(units);

  const validate = () => {
    if (!units.trim())        return 'Enter the number of units.';
    if (isNaN(numericUnits))  return 'Must be a number.';
    if (numericUnits <= 0)    return 'Must be greater than 0.';
    if (numericUnits > 100)   return 'Too high (max 100). Double-check.';
    return null;
  };

  const handleSave = async () => {
    const err = validate();
    if (err) { setError(err); return; }
    setError('');
    setSaving(true);
    try {
      await insertInsulin(numericUnits, type, date.toISOString(), note.trim());
      setSaved(true);
      setUnits('');
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

        <Text style={styles.heading}>Log Insulin</Text>
        <Text style={styles.subheading}>Track your insulin dose</Text>

        {/* ─── Type Selector ─── */}
        <Text style={styles.label}>Insulin Type</Text>
        <View style={styles.typeRow}>
          {TYPES.map(t => {
            const active = type === t.key;
            return (
              <TouchableOpacity
                key={t.key}
                style={[styles.typeCard, active && { borderColor: COLORS.accent, backgroundColor: COLORS.accentLight }]}
                onPress={() => setType(t.key)}
              >
                <Text style={[styles.typeTitle, active && { color: COLORS.accent }]}>{t.label}</Text>
                <Text style={[styles.typeDesc, active && { color: COLORS.accent }]}>{t.desc}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ─── Units ─── */}
        <Text style={styles.label}>Units</Text>
        <View style={styles.inputWrap}>
          <TextInput
            value={units}
            onChangeText={v => { setUnits(v); setError(''); }}
            keyboardType="decimal-pad"
            placeholder="0"
            placeholderTextColor={COLORS.placeholder}
            style={styles.bigInput}
            maxLength={5}
          />
          <Text style={styles.unitSuffix}>units</Text>
        </View>

        {/* ─── Quick Select ─── */}
        <Text style={styles.hint}>Quick Select</Text>
        <View style={styles.quickRow}>
          {QUICK_UNITS.map(u => (
            <TouchableOpacity
              key={u}
              style={[styles.quickPill, units === String(u) && styles.quickPillActive]}
              onPress={() => { setUnits(String(u)); setError(''); }}
            >
              <Text style={[styles.quickPillText, units === String(u) && styles.quickPillTextActive]}>{u}</Text>
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
            onChange={(e, sel) => { setShowPicker(false); if (sel) setDate(sel); }}
          />
        )}

        {/* ─── Note ─── */}
        <Text style={styles.label}>Note (optional)</Text>
        <TextInput
          value={note}
          onChangeText={setNote}
          placeholder="e.g. correction dose, pre-meal..."
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
            : <Text style={styles.saveBtnText}>{saved ? 'Saved!' : 'Save Dose'}</Text>
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

  typeRow: { flexDirection: 'row', gap: 8, marginBottom: SPACING.xl },
  typeCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  typeTitle: { fontSize: 14, fontWeight: '700', color: COLORS.textMed, marginBottom: 2 },
  typeDesc:  { fontSize: 11, color: COLORS.placeholder },

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
  unitSuffix: { fontSize: 16, color: COLORS.subtext, fontWeight: '600' },

  quickRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: SPACING.xl },
  quickPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  quickPillActive: { backgroundColor: COLORS.accent, borderColor: COLORS.accent },
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
    backgroundColor: COLORS.accent,
    borderRadius: RADIUS.lg,
    padding: 16,
    alignItems: 'center',
    shadowColor: COLORS.accent,
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  saveBtnDone: { backgroundColor: COLORS.safe },
  saveBtnText: { color: COLORS.white, fontSize: 16, fontWeight: '700' },
});
