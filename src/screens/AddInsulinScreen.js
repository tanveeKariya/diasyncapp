// PHASE 2 + PHASE 5: Log an insulin dose with type selector and validation
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
import { COLORS } from '../constants/themes';

const INSULIN_TYPES = [
  { key: 'Rapid', label: 'Rapid-Acting', desc: 'Humalog, NovoLog, Fiasp' },
  { key: 'Long',  label: 'Long-Acting',  desc: 'Lantus, Basaglar, Toujeo' },
];

const QUICK_UNITS = [1, 2, 4, 6, 8, 10, 12, 15];

export default function AddInsulinScreen({ navigation }) {
  const [units, setUnits]   = useState('');
  const [type, setType]     = useState('Rapid');
  const [note, setNote]     = useState('');
  const [date, setDate]     = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved]   = useState(false);
  const [error, setError]   = useState('');

  const numericUnits = parseFloat(units);

  const validate = () => {
    if (!units.trim())          return 'Please enter the number of units.';
    if (isNaN(numericUnits))    return 'Units must be a number.';
    if (numericUnits <= 0)      return 'Units must be greater than 0.';
    if (numericUnits > 100)     return 'Units seem very high (max 100). Double-check.';
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
      setTimeout(() => {
        setSaved(false);
        navigation?.navigate?.('Dashboard');
      }, 800);
    } catch (e) {
      Alert.alert('Error', 'Could not save dose. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.inner}>

        <Text style={styles.heading}>Log Insulin</Text>
        <Text style={styles.subheading}>Track your insulin dose</Text>

        {/* ─── Insulin Type ─── */}
        <Text style={styles.label}>Insulin Type</Text>
        <View style={styles.typeRow}>
          {INSULIN_TYPES.map(t => {
            const active = type === t.key;
            return (
              <TouchableOpacity
                key={t.key}
                style={[styles.typeCard, active && styles.typeCardActive]}
                onPress={() => setType(t.key)}
              >
                <Text style={[styles.typeTitle, active && styles.typeTitleActive]}>{t.label}</Text>
                <Text style={[styles.typeDesc,  active && styles.typeDescActive]}>{t.desc}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ─── Units Input ─── */}
        <Text style={styles.label}>Units</Text>
        <View style={styles.inputRow}>
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

        {/* ─── Quick-Select Units ─── */}
        <Text style={styles.quickLabel}>Quick Select</Text>
        <View style={styles.quickRow}>
          {QUICK_UNITS.map(u => (
            <TouchableOpacity
              key={u}
              style={[styles.quickBtn, units === String(u) && styles.quickBtnActive]}
              onPress={() => { setUnits(String(u)); setError(''); }}
            >
              <Text style={[styles.quickBtnText, units === String(u) && styles.quickBtnTextActive]}>{u}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ─── Timestamp ─── */}
        <Text style={styles.label}>Date & Time</Text>
        <TouchableOpacity style={styles.timeRow} onPress={() => setShowPicker(true)}>
          <Text style={styles.timeText}>{format(date, 'EEEE, d MMM yyyy  HH:mm')}</Text>
          <Text style={styles.editLink}>Change</Text>
        </TouchableOpacity>
        {showPicker && (
          <DateTimePicker
            value={date}
            mode="datetime"
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
          style={[styles.saveBtn, saved && styles.saveBtnSuccess]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.saveBtnText}>{saved ? 'Saved!' : 'Save Dose'}</Text>
          }
        </TouchableOpacity>

      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  inner: { padding: 20, paddingBottom: 40 },

  heading:    { fontSize: 24, fontWeight: '700', color: COLORS.text, marginBottom: 4 },
  subheading: { fontSize: 14, color: COLORS.subtext, marginBottom: 24 },

  label: { fontSize: 13, fontWeight: '600', color: COLORS.textMed, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },

  typeRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  typeCard: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 14,
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  typeCardActive: { borderColor: COLORS.accent, backgroundColor: COLORS.accentLight },
  typeTitle:       { fontSize: 13, fontWeight: '700', color: COLORS.textMed },
  typeTitleActive: { color: COLORS.accent },
  typeDesc:        { fontSize: 11, color: COLORS.placeholder, marginTop: 3 },
  typeDescActive:  { color: COLORS.accent },

  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: COLORS.border,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  bigInput: {
    flex: 1,
    fontSize: 32,
    fontWeight: '700',
    color: COLORS.text,
    paddingVertical: 14,
  },
  unitSuffix: { fontSize: 16, color: COLORS.subtext, fontWeight: '500' },

  quickLabel: { fontSize: 12, color: COLORS.subtext, marginBottom: 8 },
  quickRow:   { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  quickBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  quickBtnActive: { backgroundColor: COLORS.accent, borderColor: COLORS.accent },
  quickBtnText:   { color: COLORS.textMed, fontWeight: '500' },
  quickBtnTextActive: { color: COLORS.white },

  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 20,
  },
  timeText: { color: COLORS.text, fontSize: 14 },
  editLink: { color: COLORS.primary, fontSize: 13, fontWeight: '600' },

  noteInput: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 14,
    fontSize: 14,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.border,
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: 20,
  },

  error: { color: COLORS.high, fontSize: 13, marginBottom: 12 },

  saveBtn: {
    backgroundColor: COLORS.accent,
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
  },
  saveBtnSuccess: { backgroundColor: COLORS.safe },
  saveBtnText: { color: COLORS.white, fontSize: 16, fontWeight: '700' },
});