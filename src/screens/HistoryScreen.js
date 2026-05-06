import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { fetchGlucose } from '../database/db';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS } from '../constants/themes';

export default function HistoryScreen() {
  const [data, setData] = useState([]);

  const loadData = async () => {
    const res = await fetchGlucose();
    setData(res);
  };

  useFocusEffect(useCallback(() => { loadData(); }, []));

  return (
    <FlatList
      data={data}
      keyExtractor={(item) => item.id.toString()}
      contentContainerStyle={{ padding: 20, backgroundColor: COLORS.background }}
      renderItem={({ item }) => (
        <View style={styles.card}>
          <Text style={styles.value}>{item.value} mg/dL</Text>
          <Text style={styles.time}>
            {new Date(item.timestamp).toLocaleString()}
          </Text>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.card,
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
  },
  value: { fontSize: 18, fontWeight: 'bold' },
  time: { color: COLORS.subtext, marginTop: 5 },
});