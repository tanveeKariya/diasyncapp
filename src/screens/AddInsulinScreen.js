import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet
} from 'react-native';

import { insertInsulin } from '../database/db';
import { COLORS } from '../constants/themes';

export default function AddInsulinScreen() {
  const [units, setUnits] = useState('');
  const [type, setType] = useState('Rapid');

  const handleSave = async () => {
    if (!units) return;

    await insertInsulin(parseFloat(units), type);
    setUnits('');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Units</Text>

      <TextInput
        value={units}
        onChangeText={setUnits}
        keyboardType="numeric"
        style={styles.input}
      />

      <Text style={styles.label}>Type</Text>

      <View style={styles.row}>
        {['Rapid', 'Long'].map((t) => (
          <TouchableOpacity
            key={t}
            onPress={() => setType(t)}
            style={[
              styles.typeButton,
              { backgroundColor: type === t ? COLORS.primary : COLORS.card }
            ]}
          >
            <Text
              style={{
                color: type === t ? '#fff' : COLORS.text,
                fontWeight: '600'
              }}
            >
              {t}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={styles.button} onPress={handleSave}>
        <Text style={styles.buttonText}>Save Insulin</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: COLORS.background,
  },
  label: {
    fontSize: 16,
    color: COLORS.subtext,
    marginBottom: 8,
  },
  input: {
    backgroundColor: COLORS.card,
    padding: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 20,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  typeButton: {
    flex: 1,
    padding: 12,
    borderRadius: 10,
    marginRight: 10,
    alignItems: 'center',
  },
  button: {
    backgroundColor: COLORS.primary,
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});