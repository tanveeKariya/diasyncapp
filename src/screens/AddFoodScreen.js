// Add Food — meal name, optional carbs, quick-add common foods, manual date/time
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

import { insertFood } from '../database/db';
import { COLORS, SPACING, RADIUS } from '../constants/themes';

const QUICK_FOODS = [
  { name: 'White rice (1 cup)',  carbs: 45 },
  { name: 'White bread (1 sl)', carbs: 15 },
  { name: 'Apple (medium)',     carbs: 25 },
  { name: 'Banana (medium)',    carbs: 27 },
  { name: 'Orange juice (8oz)', carbs: 26 },
  { name: 'Pasta (1 cup)',      carbs: 40 },
  { name: 'Milk (1 cup)',       carbs: 12 },
  { name: 'Egg',                carbs: 0  },
];

export default function AddFoodScreen({ navigation }) {
  const [name, setName]         = useState('');
  const [carbs, setCarbs]       = useState('');
  const [note, setNote]         = useState('');
  const [date, setDate]         = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);
  const [pickerMode, setPickerMode] = useState('date');
  const [saving, setSaving]     = useState(false);
  const [saved, setSaved]       = useState(false);
  const [error, setError]       = useState('');

  const validate = () => {
    if (!name.trim())             return 'Enter a food name.';
    const c = parseFloat(carbs);
    if (carbs !== '' && (isNaN(c) || c < 0)) return 'Carbs must be positive.';
    if (!isNaN(c) && c > 500)    return 'Carbs too high (max 500g).';
    return null;
  };

  const handleSave = async () => {
    const err = validate();
    if (err) { setError(err); return; }
    setError('');
    setSaving(true);
    try {
      const carbsValue = carbs !== '' ? parseFloat(carbs) : 0;
      await insertFood(name.trim(), carbsValue, date.toISOString(), note.trim());
      setSaved(true);
      setName('');
      setCarbs('');
      setNote('');
      setDate(new Date());
      setTimeout(() => { setSaved(false); navigation?.navigate?.('Dashboard'); }, 700);
    } catch {
      Alert.alert('Error', 'Could not save. Try again.');
    } finally {
      setSaving(false);
    }
  };

  const applyQuick = (item) => {
    setName(item.name);
    setCarbs(String(item.carbs));
    setError('');
  };

  const openPicker = (mode) => {
    setPickerMode(mode);
    setShowPicker(true);
  };

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.inner}>

        <Text style={styles.heading}>Log Food</Text>
        <Text style={styles.subheading}>Track your meals and carbohydrates</Text>

        {/* ─── Food Name ─── */}
        <Text style={styles.label}>Food / Meal Name</Text>
        <TextInput
          value={name}
          onChangeText={v => { setName(v); setError(''); }}
          placeholder="e.g. Oatmeal with berries"
          placeholderTextColor={COLORS.placeholder}
          style={styles.textInput}
          maxLength={100}
        />

        {/* ─── Carbs ─── */}
        <Text style={styles.label}>Carbohydrates (g) — optional</Text>
        <View style={styles.carbWrap}>
          <TextInput
            value={carbs}
            onChangeText={v => { setCarbs(v); setError(''); }}
            keyboardType="decimal-pad"
            placeholder="0"
            placeholderTextColor={COLORS.placeholder}
            style={styles.carbInput}
            maxLength={5}
          />
          <Text style={styles.carbSuffix}>g</Text>
        </View>

        {/* ─── Quick Foods ─── */}
        <Text style={styles.hint}>Common Foods</Text>
        <View style={styles.quickGrid}>
          {QUICK_FOODS.map(item => {
            const active = name === item.name;
            return (
              <TouchableOpacity
                key={item.name}
                style={[styles.quickCard, active && { borderColor: COLORS.food, backgroundColor: COLORS.foodLight }]}
                onPress={() => applyQuick(item)}
              >
                <Text style={[styles.quickCardName, active && { color: COLORS.food, fontWeight: '700' }]} numberOfLines={1}>{item.name}</Text>
                <Text style={[styles.quickCardCarbs, active && { color: COLORS.food }]}>{item.carbs}g</Text>
              </TouchableOpacity>
            );
          })}
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
          placeholder="e.g. estimated portion, restaurant..."
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
            : <Text style={styles.saveBtnText}>{saved ? 'Saved!' : 'Save Meal'}</Text>
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

  textInput: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    fontSize: 15,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.lg,
  },

  carbWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    borderWidth: 2,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  carbInput: { flex: 1, fontSize: 32, fontWeight: '800', color: COLORS.text, paddingVertical: 14 },
  carbSuffix: { fontSize: 16, color: COLORS.subtext, fontWeight: '600' },

  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: SPACING.xl },
  quickCard: {
    width: '47%',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.sm,
    padding: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  quickCardName:  { flex: 1, fontSize: 12, color: COLORS.textMed, marginRight: 4 },
  quickCardCarbs: { fontSize: 12, fontWeight: '700', color: COLORS.subtext },

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
    backgroundColor: COLORS.food,
    borderRadius: RADIUS.lg,
    padding: 16,
    alignItems: 'center',
    shadowColor: COLORS.food,
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  saveBtnDone: { backgroundColor: COLORS.safe },
  saveBtnText: { color: COLORS.white, fontSize: 16, fontWeight: '700' },
});
