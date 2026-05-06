// PHASE 2 + PHASE 4: Dashboard — real-time glucose stats and charts
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { LineChart, BarChart } from 'react-native-chart-kit';
import { format, subDays, startOfDay, endOfDay, subWeeks, subMonths, startOfMonth, endOfMonth } from 'date-fns';

import {
  fetchGlucose,
  fetchInsulin,
  fetchGlucoseByRange,
  fetchInsulinByRange,
  fetchFoodByRange,
  fetchGlucoseStats,
} from '../database/db';
import { COLORS, getGlucoseStatus } from '../constants/themes';

const SCREEN_W = Dimensions.get('window').width;
const CHART_W   = SCREEN_W - 40;

const RANGE_OPTIONS = ['Today', '7 Days', '30 Days'];

export default function HomeScreen() {
  const [range, setRange]         = useState('Today');
  const [stats, setStats]         = useState({ avg: null, min: null, max: null, count: 0, inRange: 0 });
  const [latest, setLatest]       = useState(null);
  const [chartLabels, setLabels]  = useState([]);
  const [chartValues, setValues]  = useState([]);
  const [insulinData, setInsulin] = useState([]);
  const [totalCarbs, setCarbs]    = useState(0);

  const getRangeISO = () => {
    const now = new Date();
    switch (range) {
      case '7 Days':  return { start: startOfDay(subDays(now, 6)).toISOString(), end: now.toISOString() };
      case '30 Days': return { start: startOfMonth(subMonths(now, 0)).toISOString(), end: endOfMonth(now).toISOString() };
      default:        return { start: startOfDay(now).toISOString(), end: endOfDay(now).toISOString() };
    }
  };

  const loadData = useCallback(async () => {
    const { start, end } = getRangeISO();

    // Stats block
    const s = await fetchGlucoseStats(start, end);
    setStats(s);

    // Latest reading (across all time)
    const all = await fetchGlucose();
    setLatest(all[0] ?? null);

    // Chart data
    const rows = await fetchGlucoseByRange(start, end);
    // Reduce to max 10 points for readability
    const step  = Math.max(1, Math.floor(rows.length / 10));
    const sampled = rows.filter((_, i) => i % step === 0).slice(-10);

    const labelFmt = range === 'Today' ? 'HH:mm' : range === '7 Days' ? 'EEE' : 'd MMM';
    setLabels(sampled.map(r => format(new Date(r.timestamp), labelFmt)));
    setValues(sampled.map(r => r.value));

    // Insulin summary
    const insulin = await fetchInsulinByRange(start, end);
    const rapidTotal = insulin.filter(i => i.type === 'Rapid').reduce((a, b) => a + b.units, 0);
    const longTotal  = insulin.filter(i => i.type === 'Long').reduce((a, b) => a + b.units, 0);
    setInsulin([
      { label: 'Rapid', value: Math.round(rapidTotal * 10) / 10 },
      { label: 'Long',  value: Math.round(longTotal  * 10) / 10 },
    ]);

    // Carbs summary
    const food = await fetchFoodByRange(start, end);
    setCarbs(Math.round(food.reduce((a, b) => a + (b.carbs || 0), 0)));
  }, [range]);

  useFocusEffect(
    useCallback(() => { loadData(); }, [loadData])
  );

  const latestStatus = latest ? getGlucoseStatus(latest.value) : null;
  const inRangePct   = stats.count > 0 ? Math.round((stats.inRange / stats.count) * 100) : null;

  const chartConfig = {
    backgroundGradientFrom: COLORS.card,
    backgroundGradientTo:   COLORS.card,
    color: (opacity = 1) => `rgba(14,165,233,${opacity})`,  // sky-500
    labelColor: () => COLORS.subtext,
    decimalPlaces: 0,
    propsForDots: { r: '4', strokeWidth: '2', stroke: COLORS.primaryDark },
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>

      {/* ─── Header ─── */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Dashboard</Text>
        <Text style={styles.headerSub}>{format(new Date(), 'EEEE, d MMMM yyyy')}</Text>
      </View>

      {/* ─── Current Reading Banner ─── */}
      {latest && (
        <View style={[styles.bannerCard, { borderLeftColor: latestStatus.color }]}>
          <View>
            <Text style={styles.bannerLabel}>Latest Reading</Text>
            <Text style={styles.bannerTime}>{format(new Date(latest.timestamp), 'HH:mm, d MMM')}</Text>
          </View>
          <View style={styles.bannerRight}>
            <Text style={[styles.bannerValue, { color: latestStatus.color }]}>{latest.value}</Text>
            <Text style={styles.bannerUnit}>mg/dL</Text>
            <View style={[styles.statusBadge, { backgroundColor: latestStatus.bg }]}>
              <Text style={[styles.statusBadgeText, { color: latestStatus.color }]}>{latestStatus.label}</Text>
            </View>
          </View>
        </View>
      )}

      {/* ─── Range Selector ─── */}
      <View style={styles.rangeRow}>
        {RANGE_OPTIONS.map(opt => (
          <TouchableOpacity
            key={opt}
            style={[styles.rangeBtn, range === opt && styles.rangeBtnActive]}
            onPress={() => setRange(opt)}
          >
            <Text style={[styles.rangeBtnText, range === opt && styles.rangeBtnTextActive]}>{opt}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ─── Stats Grid ─── */}
      <View style={styles.statsGrid}>
        <StatCard label="Avg BG" value={stats.avg !== null ? `${stats.avg}` : '—'} unit="mg/dL" color={COLORS.primary} />
        <StatCard label="Min"    value={stats.min !== null ? `${stats.min}` : '—'} unit="mg/dL" color={COLORS.safe}    />
        <StatCard label="Max"    value={stats.max !== null ? `${stats.max}` : '—'} unit="mg/dL" color={COLORS.high}    />
        <StatCard label="In Range" value={inRangePct !== null ? `${inRangePct}%` : '—'} unit={`${stats.inRange}/${stats.count}`} color={COLORS.secondary} />
      </View>

      {/* ─── Glucose Chart ─── */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Glucose Trend</Text>
        {chartValues.length >= 2 ? (
          <LineChart
            data={{ labels: chartLabels, datasets: [{ data: chartValues }] }}
            width={CHART_W}
            height={200}
            chartConfig={chartConfig}
            bezier
            style={styles.chart}
            withShadow={false}
            fromZero={false}
          />
        ) : (
          <EmptyChart text="No glucose readings for this period" />
        )}
      </View>

      {/* ─── Insulin Summary ─── */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Insulin Summary</Text>
        <View style={styles.insulinRow}>
          {insulinData.map(item => (
            <View key={item.label} style={[styles.insulinCard, { borderLeftColor: COLORS.accent }]}>
              <Text style={styles.insulinType}>{item.label}-Acting</Text>
              <Text style={styles.insulinUnits}>{item.value} <Text style={styles.insulinUnitLabel}>units</Text></Text>
            </View>
          ))}
          <View style={[styles.insulinCard, { borderLeftColor: COLORS.food }]}>
            <Text style={styles.insulinType}>Total Carbs</Text>
            <Text style={styles.insulinUnits}>{totalCarbs} <Text style={styles.insulinUnitLabel}>g</Text></Text>
          </View>
        </View>
      </View>

      <View style={{ height: 30 }} />
    </ScrollView>
  );
}

// Small reusable stat card
function StatCard({ label, value, unit, color }) {
  return (
    <View style={[styles.statCard, { borderTopColor: color }]}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statUnit}>{unit}</Text>
    </View>
  );
}

function EmptyChart({ text }) {
  return (
    <View style={styles.emptyChart}>
      <Text style={styles.emptyText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },

  header: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 12 },
  headerTitle: { fontSize: 28, fontWeight: '700', color: COLORS.text },
  headerSub:   { fontSize: 13, color: COLORS.subtext, marginTop: 2 },

  bannerCard: {
    marginHorizontal: 20,
    marginBottom: 16,
    backgroundColor: COLORS.card,
    borderRadius: 14,
    borderLeftWidth: 5,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: COLORS.shadow,
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  bannerLabel: { fontSize: 12, color: COLORS.subtext, marginBottom: 2 },
  bannerTime:  { fontSize: 12, color: COLORS.placeholder },
  bannerRight: { alignItems: 'flex-end' },
  bannerValue: { fontSize: 36, fontWeight: '700', lineHeight: 40 },
  bannerUnit:  { fontSize: 12, color: COLORS.subtext },
  statusBadge: { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3, marginTop: 4 },
  statusBadgeText: { fontSize: 11, fontWeight: '600' },

  rangeRow: { flexDirection: 'row', marginHorizontal: 20, marginBottom: 16, backgroundColor: COLORS.card, borderRadius: 10, padding: 4 },
  rangeBtn: { flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: 8 },
  rangeBtnActive: { backgroundColor: COLORS.primary },
  rangeBtnText: { fontSize: 13, color: COLORS.subtext, fontWeight: '500' },
  rangeBtnTextActive: { color: COLORS.white, fontWeight: '600' },

  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: 20, gap: 10, marginBottom: 20 },
  statCard: {
    flex: 1,
    minWidth: '44%',
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 14,
    borderTopWidth: 3,
    shadowColor: COLORS.shadow,
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 1,
  },
  statLabel: { fontSize: 11, color: COLORS.subtext, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
  statValue: { fontSize: 22, fontWeight: '700' },
  statUnit:  { fontSize: 11, color: COLORS.placeholder, marginTop: 2 },

  section: { marginHorizontal: 20, marginBottom: 20 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: COLORS.text, marginBottom: 10 },

  chart: { borderRadius: 12, marginLeft: -10 },

  emptyChart: {
    height: 100,
    backgroundColor: COLORS.card,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: { color: COLORS.placeholder, fontSize: 13 },

  insulinRow: { flexDirection: 'row', gap: 10 },
  insulinCard: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderRadius: 12,
    borderLeftWidth: 4,
    padding: 14,
    shadowColor: COLORS.shadow,
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 1,
  },
  insulinType:      { fontSize: 11, color: COLORS.subtext, marginBottom: 4 },
  insulinUnits:     { fontSize: 20, fontWeight: '700', color: COLORS.text },
  insulinUnitLabel: { fontSize: 12, fontWeight: '400', color: COLORS.subtext },
});