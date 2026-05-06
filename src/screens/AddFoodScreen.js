// PHASE 2 + PHASE 5: Log a food entry with carb tracking
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
import { COLORS } from '../constants/themes';

// Common foods with typical carb values for quick-add
const QUICK_FOODS = [
  { name: 'White rice (1 cup)',  carbs: 45 },
  { name: 'White bread (1 sl)', carbs: 15 },
  { name: 'Apple (medium)',     carbs: 25 },
  { name: 'Banana (medium)',    carbs: 27 },
  { name: 'Orange juice (8oz)', carbs: 26 },
  { name: 'Pasta (1 cup)',      carbs: 40 },
];

export default function AddFoodScreen({ navigation }) {
  const [name, setName]         = useState('');
  const [carbs, setCarbs]       = useState('');
  const [note, setNote]         = useState('');
  const [date, setDate]         = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);
  const [saving, setSaving]     = useState(false);
  const [saved, setSaved]       = useState(false);
  const [error, setError]       = useState('');

  const validate = () => {
    if (!name.trim())             return 'Please enter a food name.';
    const c = parseFloat(carbs);
    if (carbs !== '' && (isNaN(c) || c < 0)) return 'Carbs must be a positive number.';
    if (!isNaN(c) && c > 500)    return 'Carbs value seems too high (max 500g).';
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
      setTimeout(() => {
        setSaved(false);
        navigation?.navigate?.('Dashboard');
      }, 800);
    } catch (e) {
      Alert.alert('Error', 'Could not save food entry. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const applyQuickFood = (item) => {
    setName(item.name);
    setCarbs(String(item.carbs));
    setError('');
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
          style={styles.input}
          maxLength={100}
        />

        {/* ─── Carbs ─── */}
        <Text style={styles.label}>Carbohydrates (g) — optional</Text>
        <View style={styles.inputRow}>
          <TextInput
            value={carbs}
            onChangeText={v => { setCarbs(v); setError(''); }}
            keyboardType="decimal-pad"
            placeholder="0"
            placeholderTextColor={COLORS.placeholder}
            style={styles.carbInput}
            maxLength={5}
          />
          <Text style={styles.carbSuffix}>g carbs</Text>
        </View>

        {/* ─── Quick Foods ─── */}
        <Text style={styles.quickLabel}>Common Foods</Text>
        <View style={styles.quickGrid}>
          {QUICK_FOODS.map(item => (
            <TouchableOpacity
              key={item.name}
              style={[styles.quickCard, name === item.name && styles.quickCardActive]}
              onPress={() => applyQuickFood(item)}
            >
              <Text style={[styles.quickCardName, name === item.name && styles.quickCardNameActive]} numberOfLines={1}>
                {item.name}
              </Text>
              <Text style={[styles.quickCardCarbs, name === item.name && styles.quickCardCarbsActive]}>
                {item.carbs}g
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
            onChange={(e, sel) => { setShowPicker(false); if (sel) setDate(sel); }}
          />
        )}

        {/* ─── Note ─── */}
        <Text style={styles.label}>Note (optional)</Text>
        <TextInput
          value={note}
          onChangeText={setNote}
          placeholder="e.g. estimated portion, restaurant meal..."
          placeholderTextColor={COLORS.placeholder}
          style={styles.noteInput}
          multiline
          maxLength={200}
        />

        {!!error && <Text style={styles.error}>{error}</Text>}

        <TouchableOpacity
          style={[styles.saveBtn, saved && styles.saveBtnSuccess]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.saveBtnText}>{saved ? 'Saved!' : 'Save Meal'}</Text>
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

  input: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 20,
  },

  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  carbInput: {
    flex: 1,
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.text,
    paddingVertical: 14,
  },
  carbSuffix: { fontSize: 15, color: COLORS.subtext, fontWeight: '500' },

  quickLabel: { fontSize: 12, color: COLORS.subtext, marginBottom: 8 },
  quickGrid:  { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  quickCard: {
    width: '47%',
    backgroundColor: COLORS.card,
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  quickCardActive: { backgroundColor: COLORS.foodLight, borderColor: COLORS.food },
  quickCardName:       { flex: 1, fontSize: 12, color: COLORS.textMed, marginRight: 4 },
  quickCardNameActive: { color: COLORS.food, fontWeight: '600' },
  quickCardCarbs:       { fontSize: 12, fontWeight: '700', color: COLORS.subtext },
  quickCardCarbsActive: { color: COLORS.food },

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
    backgroundColor: COLORS.food,
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
  },
  saveBtnSuccess: { backgroundColor: COLORS.safe },
  saveBtnText: { color: COLORS.white, fontSize: 16, fontWeight: '700' },
});
