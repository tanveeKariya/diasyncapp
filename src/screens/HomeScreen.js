import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions
} from 'react-native';

import { fetchGlucose } from '../database/db';
import { useFocusEffect } from '@react-navigation/native';
import { LineChart } from 'react-native-chart-kit';
import { COLORS } from '../constants/themes';

export default function HomeScreen() {
  const [chartLabels, setChartLabels] = useState([]);
  const [chartValues, setChartValues] = useState([]);

  const [avg, setAvg] = useState(0);
  const [latest, setLatest] = useState(null);

  const loadData = async () => {
    const glucose = await fetchGlucose();

    if (!glucose || glucose.length === 0) return;

    // Last 7 readings
    const last7 = glucose.slice(0, 7).reverse();

    setChartLabels(
      last7.map(i =>
        new Date(i.timestamp).toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        })
      )
    );

    setChartValues(last7.map(i => i.value));

    // Insights
    const values = glucose.map(i => i.value);
    const avgValue = Math.round(
      values.reduce((a, b) => a + b, 0) / values.length
    );

    setAvg(avgValue);
    setLatest(glucose[0]);
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const getStatus = (value) => {
    if (value > 180) return { label: 'High', color: COLORS.high };
    if (value < 70) return { label: 'Low', color: COLORS.low };
    return { label: 'Normal', color: COLORS.safe };
  };

  const status = latest ? getStatus(latest.value) : null;

  return (
    <View style={styles.container}>

      {/* 🔷 Header */}
      <Text style={styles.title}>Dashboard</Text>

      {/* 🧠 Insight Cards */}
      <View style={styles.row}>

        <View style={styles.card}>
          <Text style={styles.label}>Average</Text>
          <Text style={styles.value}>{avg} mg/dL</Text>
        </View>

        {latest && (
          <View style={[styles.card, { borderColor: status.color, borderWidth: 2 }]}>
            <Text style={styles.label}>Latest</Text>
            <Text style={[styles.value, { color: status.color }]}>
              {latest.value}
            </Text>
            <Text style={{ color: status.color, fontSize: 12 }}>
              {status.label}
            </Text>
          </View>
        )}

      </View>

      {/* 📊 Chart Section */}
      <Text style={styles.section}>Glucose Trend</Text>

      {chartValues.length > 0 ? (
        <LineChart
          data={{
            labels: chartLabels,
            datasets: [{ data: chartValues }],
          }}
          width={Dimensions.get('window').width - 40}
          height={220}
          chartConfig={{
            backgroundGradientFrom: COLORS.card,
            backgroundGradientTo: COLORS.card,
            color: () => COLORS.primary,
            labelColor: () => COLORS.text,
            decimalPlaces: 0,
          }}
          style={styles.chart}
        />
      ) : (
        <Text style={styles.empty}>
          No data yet. Add glucose readings to see trends.
        </Text>
      )}

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: COLORS.background,
  },

  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 15,
    color: COLORS.text,
  },

  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },

  card: {
    flex: 1,
    backgroundColor: COLORS.card,
    padding: 15,
    borderRadius: 12,
    marginRight: 10,
  },

  label: {
    color: COLORS.subtext,
    marginBottom: 5,
  },

  value: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.text,
  },

  section: {
    fontSize: 18,
    marginBottom: 10,
    color: COLORS.subtext,
  },

  chart: {
    borderRadius: 12,
  },

  empty: {
    color: COLORS.subtext,
    marginTop: 20,
  },
});