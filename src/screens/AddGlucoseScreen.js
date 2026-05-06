import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform
} from 'react-native';

import DateTimePicker from '@react-native-community/datetimepicker';
import { insertGlucose } from '../database/db';
import { COLORS } from '../constants/themes';

export default function AddGlucoseScreen() {
  const [value, setValue] = useState('');
  const [date, setDate] = useState(new Date());
  const [show, setShow] = useState(false);

  const handleSave = async () => {
    if (!value) return;

    await insertGlucose(parseFloat(value), date.toISOString());
    setValue('');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Glucose (mg/dL)</Text>

      <TextInput
        value={value}
        onChangeText={setValue}
        keyboardType="numeric"
        style={styles.input}
      />

      <Text style={styles.label}>Time</Text>

      <TouchableOpacity style={styles.input} onPress={() => setShow(true)}>
        <Text>{date.toLocaleString()}</Text>
      </TouchableOpacity>

      {show && (
        <DateTimePicker
          value={date}
          mode="datetime"
          display="default"
          onChange={(e, selectedDate) => {
            setShow(false);
            if (selectedDate) setDate(selectedDate);
          }}
        />
      )}

      <TouchableOpacity style={styles.button} onPress={handleSave}>
        <Text style={styles.buttonText}>Save</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: COLORS.background },
  label: { marginBottom: 8, color: COLORS.subtext },
  input: {
    backgroundColor: COLORS.card,
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
  },
  button: {
    backgroundColor: COLORS.primary,
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonText: { color: '#fff', fontWeight: 'bold' },
});