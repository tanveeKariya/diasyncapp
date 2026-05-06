// PHASE 2 + PHASE 5: Log a glucose reading with validation and datetime picker
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
import { COLORS, getGlucoseStatus } from '../constants/themes';

// Quick-select preset values common in T1D management
const QUICK_VALUES = [70, 90, 110, 140, 180, 250];

export default function AddGlucoseScreen({ navigation }) {
  const [value, setValue]   = useState('');
  const [note, setNote]     = useState('');
  const [date, setDate]     = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved]   = useState(false);
  const [error, setError]   = useState('');

  const numericValue = parseFloat(value);
  const previewStatus = !isNaN(numericValue) && numericValue > 0
    ? getGlucoseStatus(numericValue)
    : null;

  const validate = () => {
    if (!value.trim())              return 'Please enter a glucose value.';
    if (isNaN(numericValue))        return 'Value must be a number.';
    if (numericValue < 20)          return 'Value seems too low (min 20 mg/dL).';
    if (numericValue > 600)         return 'Value seems too high (max 600 mg/dL).';
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
      // Navigate to Dashboard after a brief delay so the user sees "Saved!"
      setTimeout(() => {
        setSaved(false);
        navigation?.navigate?.('Dashboard');
      }, 800);
    } catch (e) {
      Alert.alert('Error', 'Could not save reading. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.inner}>

        <Text style={styles.heading}>Log Glucose</Text>
        <Text style={styles.subheading}>Record your blood glucose reading</Text>

        {/* ─── Value Input ─── */}
        <Text style={styles.label}>Blood Glucose (mg/dL)</Text>
        <View style={[styles.inputRow, previewStatus && { borderColor: previewStatus.color }]}>
          <TextInput
            value={value}
            onChangeText={v => { setValue(v); setError(''); }}
            keyboardType="decimal-pad"
            placeholder="e.g. 110"
            placeholderTextColor={COLORS.placeholder}
            style={styles.bigInput}
            maxLength={5}
          />
          {previewStatus && (
            <View style={[styles.liveTag, { backgroundColor: previewStatus.bg }]}>
              <Text style={[styles.liveTagText, { color: previewStatus.color }]}>
                {previewStatus.label}
              </Text>
            </View>
          )}
        </View>

        {/* ─── Quick-Select Buttons ─── */}
        <Text style={styles.quickLabel}>Quick Select</Text>
        <View style={styles.quickRow}>
          {QUICK_VALUES.map(v => (
            <TouchableOpacity
              key={v}
              style={[styles.quickBtn, value === String(v) && styles.quickBtnActive]}
              onPress={() => { setValue(String(v)); setError(''); }}
            >
              <Text style={[styles.quickBtnText, value === String(v) && styles.quickBtnTextActive]}>
                {v}
              </Text>
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
            onChange={(e, selected) => {
              setShowPicker(false);
              if (selected) setDate(selected);
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

        {/* ─── Error ─── */}
        {!!error && <Text style={styles.error}>{error}</Text>}

        {/* ─── Save Button ─── */}
        <TouchableOpacity
          style={[styles.saveBtn, saved && styles.saveBtnSuccess]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.saveBtnText}>{saved ? 'Saved!' : 'Save Reading'}</Text>
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
  liveTag: {
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  liveTagText: { fontSize: 12, fontWeight: '700' },

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
  quickBtnActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  quickBtnText:     { color: COLORS.textMed, fontWeight: '500' },
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
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
  },
  saveBtnSuccess: { backgroundColor: COLORS.safe },
  saveBtnText: { color: COLORS.white, fontSize: 16, fontWeight: '700' },
});