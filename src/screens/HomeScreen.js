// Dashboard — real-time glucose stats, daily graph, insulin/food summary
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
import { LineChart } from 'react-native-chart-kit';
import { format, startOfDay, endOfDay, subDays, startOfMonth, endOfMonth } from 'date-fns';

import {
  fetchGlucose,
  fetchInsulinByRange,
  fetchGlucoseByRange,
  fetchFoodByRange,
  fetchGlucoseStats,
} from '../database/db';
import { COLORS, SPACING, RADIUS, getGlucoseStatus } from '../constants/themes';

const SCREEN_W = Dimensions.get('window').width;
const CHART_W   = SCREEN_W - 40;
const RANGES    = ['Today', '7 Days', '30 Days'];

export default function HomeScreen() {
  const [range, setRange]         = useState('Today');
  const [stats, setStats]         = useState({ avg: null, min: null, max: null, count: 0, inRange: 0 });
  const [latest, setLatest]       = useState(null);
  const [chartLabels, setLabels]  = useState([]);
  const [chartValues, setValues]  = useState([]);
  const [insulinSummary, setInsulinSummary] = useState({ rapid: 0, long: 0 });
  const [totalCarbs, setCarbs]    = useState(0);

  const getRangeISO = () => {
    const now = new Date();
    switch (range) {
      case '7 Days':  return { start: startOfDay(subDays(now, 6)).toISOString(), end: now.toISOString() };
      case '30 Days': return { start: startOfMonth(now).toISOString(), end: endOfMonth(now).toISOString() };
      default:        return { start: startOfDay(now).toISOString(), end: endOfDay(now).toISOString() };
    }
  };

  const loadData = useCallback(async () => {
    const { start, end } = getRangeISO();

    const s = await fetchGlucoseStats(start, end);
    setStats(s);

    const all = await fetchGlucose();
    setLatest(all[0] ?? null);

    const rows = await fetchGlucoseByRange(start, end);
    let sampled;
    if (rows.length <= 12) {
      sampled = rows;
    } else {
      const step = Math.max(1, Math.floor(rows.length / 12));
      sampled = rows.filter((_, i) => i % step === 0).slice(-12);
    }
    const labelFmt = range === 'Today' ? 'HH:mm' : range === '7 Days' ? 'EEE' : 'd MMM';
    setLabels(sampled.map(r => format(new Date(r.timestamp), labelFmt)));
    setValues(sampled.map(r => r.value));

    const insulin = await fetchInsulinByRange(start, end);
    setInsulinSummary({
      rapid: Math.round(insulin.filter(i => i.type === 'Rapid').reduce((a, b) => a + b.units, 0) * 10) / 10,
      long:  Math.round(insulin.filter(i => i.type === 'Long').reduce((a, b) => a + b.units, 0) * 10) / 10,
    });

    const food = await fetchFoodByRange(start, end);
    setCarbs(Math.round(food.reduce((a, b) => a + (b.carbs || 0), 0)));
  }, [range]);

  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

  const latestStatus = latest ? getGlucoseStatus(latest.value) : null;
  const inRangePct   = stats.count > 0 ? Math.round((stats.inRange / stats.count) * 100) : 0;

  const chartConfig = {
    backgroundGradientFrom: COLORS.surface,
    backgroundGradientTo:   COLORS.surface,
    color: (opacity = 1) => `rgba(14,165,233,${opacity})`,
    labelColor: () => COLORS.subtext,
    decimalPlaces: 0,
    propsForDots: { r: '5', strokeWidth: '2', stroke: COLORS.primaryDark, fill: COLORS.white },
    propsForBackgroundLines: { stroke: COLORS.divider, strokeDasharray: '' },
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>

      {/* ─── Header ─── */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Good {getGreeting()}</Text>
          <Text style={styles.dateText}>{format(new Date(), 'EEEE, d MMMM yyyy')}</Text>
        </View>
      </View>

      {/* ─── Latest Reading Hero Card ─── */}
      {latest && latestStatus ? (
        <View style={[styles.heroCard, { borderLeftColor: latestStatus.color }]}>
          <View style={styles.heroLeft}>
            <Text style={styles.heroLabel}>Latest Reading</Text>
            <Text style={styles.heroTime}>{format(new Date(latest.timestamp), 'HH:mm · d MMM')}</Text>
            {latest.note ? <Text style={styles.heroNote} numberOfLines={1}>{latest.note}</Text> : null}
            }
          </View>
          <View style={styles.heroRight}>
            <Text style={[styles.heroValue, { color: latestStatus.color }]}>{latest.value}</Text>
            <Text style={styles.heroUnit}>mg/dL</Text>
            <View style={[styles.statusPill, { backgroundColor: latestStatus.bg }]}>
              <Text style={[styles.statusPillText, { color: latestStatus.color }]}>{latestStatus.label}</Text>
            </View>
          </View>
        </View>
      ) : (
        <View style={styles.heroEmpty}>
          <Text style={styles.heroEmptyText}>No readings yet. Tap Glucose to log your first.</Text>
        </View>
      )}

      {/* ─── Range Selector ─── */}
      <View style={styles.pillRow}>
        {RANGES.map(r => (
          <TouchableOpacity
            key={r}
            style={[styles.pill, range === r && styles.pillActive]}
            onPress={() => setRange(r)}
          >
            <Text style={[styles.pillText, range === r && styles.pillTextActive]}>{r}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ─── Stats Grid ─── */}
      <View style={styles.statsRow}>
        <StatBox label="Average"  value={stats.avg !== null ? String(stats.avg) : '--'} unit="mg/dL" color={COLORS.primary} />
        <StatBox label="Lowest"   value={stats.min !== null ? String(stats.min) : '--'} unit="mg/dL" color={COLORS.safe} />
        <StatBox label="Highest"  value={stats.max !== null ? String(stats.max) : '--'} unit="mg/dL" color={COLORS.high} />
        <StatBox label="In Range" value={stats.count > 0 ? `${inRangePct}%` : '--'}  unit={`${stats.inRange}/${stats.count}`} color={COLORS.secondary} />
      </View>

      {/* ─── Time-in-Range Bar ─── */}
      {stats.count > 0 && (
        <View style={styles.tirContainer}>
          <View style={styles.tirLabels}>
            <Text style={styles.tirLabel}>Time in Range</Text>
            <Text style={[styles.tirPct, { color: COLORS.safe }]}>{inRangePct}%</Text>
          </View>
          <View style={styles.tirBar}>
            <View style={[styles.tirFill, { width: `${inRangePct}%`, backgroundColor: COLORS.safe }]} />
          </View>
          <View style={styles.tirLegend}>
            <LegendDot color={COLORS.low}  label="Low" />
            <LegendDot color={COLORS.safe} label="In Range" />
            <LegendDot color={COLORS.high} label="High" />
          </View>
        </View>
      )}

      {/* ─── Glucose Trend Chart ─── */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Glucose Trend</Text>
        {chartValues.length >= 1 ? (
          <View style={styles.chartCard}>
            <LineChart
              data={{
                labels: chartValues.length === 1 ? ['', ...chartLabels] : chartLabels,
                datasets: [{ data: chartValues.length === 1 ? [0, ...chartValues] : chartValues }],
              }}
              width={CHART_W}
              height={200}
              chartConfig={chartConfig}
              bezier
              style={styles.chart}
              withShadow={false}
              fromZero={false}
            />
          </View>
        ) : (
          <View style={styles.emptyChart}>
            <Text style={styles.emptyChartText}>Add a reading to see your trend</Text>
          </View>
        )}
      </View>

      {/* ─── Insulin + Carbs Summary ─── */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Insulin & Carbs</Text>
        <View style={styles.summaryRow}>
          <SummaryCard label="Rapid-Acting" value={insulinSummary.rapid} unit="units" color={COLORS.accent} />
          <SummaryCard label="Long-Acting"  value={insulinSummary.long}  unit="units" color={COLORS.accentDark} />
          <SummaryCard label="Total Carbs"  value={totalCarbs}           unit="g"     color={COLORS.food} />
        </View>
      </View>

      <View style={{ height: 30 }} />
    </ScrollView>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Morning';
  if (h < 17) return 'Afternoon';
  return 'Evening';
}

function StatBox({ label, value, unit, color }) {
  return (
    <View style={styles.statBox}>
      <View style={[styles.statDot, { backgroundColor: color }]} />
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statUnit}>{unit}</Text>
    </View>
  );
}

function SummaryCard({ label, value, unit, color }) {
  return (
    <View style={[styles.summaryCard, { borderTopColor: color }]}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={styles.summaryValue}>{value} <Text style={styles.summaryUnit}>{unit}</Text></Text>
    </View>
  );
}

function LegendDot({ color, label }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendDot, { backgroundColor: color }]} />
      <Text style={styles.legendText}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },

  header: { paddingHorizontal: SPACING.xl, paddingTop: SPACING.xxl, paddingBottom: SPACING.md },
  greeting:  { fontSize: 26, fontWeight: '800', color: COLORS.text, letterSpacing: -0.5 },
  dateText:   { fontSize: 13, color: COLORS.subtext, marginTop: 2 },

  heroCard: {
    marginHorizontal: SPACING.xl,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    borderLeftWidth: 5,
    padding: SPACING.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: COLORS.shadow,
    shadowOpacity: 1,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  heroLeft: { flex: 1 },
  heroLabel: { fontSize: 12, fontWeight: '600', color: COLORS.subtext, textTransform: 'uppercase', letterSpacing: 0.8 },
  heroTime:  { fontSize: 12, color: COLORS.placeholder, marginTop: 2 },
  heroNote:  { fontSize: 11, color: COLORS.muted, marginTop: 4, fontStyle: 'italic' },
  heroRight: { alignItems: 'flex-end' },
  heroValue: { fontSize: 40, fontWeight: '800', lineHeight: 44 },
  heroUnit:  { fontSize: 12, color: COLORS.subtext, marginTop: -2 },
  statusPill:     { borderRadius: RADIUS.full, paddingHorizontal: 12, paddingVertical: 4, marginTop: 6 },
  statusPillText: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },

  heroEmpty: {
    marginHorizontal: SPACING.xl,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.xxl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderStyle: 'dashed',
  },
  heroEmptyText: { color: COLORS.placeholder, fontSize: 14, textAlign: 'center' },

  pillRow: { flexDirection: 'row', marginHorizontal: SPACING.xl, marginTop: SPACING.lg, marginBottom: SPACING.lg, backgroundColor: COLORS.surfaceAlt, borderRadius: RADIUS.md, padding: 3 },
  pill:     { flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: RADIUS.sm },
  pillActive: { backgroundColor: COLORS.primary, shadowColor: COLORS.primary, shadowOpacity: 0.3, shadowRadius: 4, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  pillText:       { fontSize: 13, color: COLORS.subtext, fontWeight: '500' },
  pillTextActive: { color: COLORS.white, fontWeight: '700' },

  statsRow: { flexDirection: 'row', marginHorizontal: SPACING.xl, marginBottom: SPACING.lg, gap: 8 },
  statBox: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    alignItems: 'center',
    shadowColor: COLORS.shadow,
    shadowOpacity: 1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  statDot:   { width: 6, height: 6, borderRadius: 3, marginBottom: 6 },
  statLabel: { fontSize: 10, color: COLORS.subtext, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  statValue: { fontSize: 20, fontWeight: '800' },
  statUnit:  { fontSize: 10, color: COLORS.placeholder, marginTop: 2 },

  tirContainer: { marginHorizontal: SPACING.xl, marginBottom: SPACING.lg, backgroundColor: COLORS.surface, borderRadius: RADIUS.md, padding: SPACING.lg },
  tirLabels: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  tirLabel:  { fontSize: 12, fontWeight: '600', color: COLORS.textMed },
  tirPct:    { fontSize: 14, fontWeight: '800' },
  tirBar:    { height: 8, backgroundColor: COLORS.surfaceAlt, borderRadius: 4, overflow: 'hidden' },
  tirFill:   { height: '100%', borderRadius: 4 },
  tirLegend: { flexDirection: 'row', justifyContent: 'center', gap: 16, marginTop: 8 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendDot:  { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 11, color: COLORS.subtext },

  section:     { marginHorizontal: SPACING.xl, marginBottom: SPACING.lg },
  sectionTitle:{ fontSize: 15, fontWeight: '700', color: COLORS.text, marginBottom: 10 },

  chartCard: { backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, paddingTop: 10, paddingRight: 10, shadowColor: COLORS.shadow, shadowOpacity: 1, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  chart:     { borderRadius: RADIUS.md, marginLeft: -10 },

  emptyChart:     { height: 100, backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: COLORS.border, borderStyle: 'dashed' },
  emptyChartText: { color: COLORS.placeholder, fontSize: 13 },

  summaryRow: { flexDirection: 'row', gap: 8 },
  summaryCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    borderTopWidth: 3,
    padding: SPACING.md,
    shadowColor: COLORS.shadow,
    shadowOpacity: 1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  summaryLabel: { fontSize: 11, color: COLORS.subtext, fontWeight: '600', marginBottom: 4 },
  summaryValue: { fontSize: 18, fontWeight: '800', color: COLORS.text },
  summaryUnit:  { fontSize: 11, fontWeight: '500', color: COLORS.subtext },
});
