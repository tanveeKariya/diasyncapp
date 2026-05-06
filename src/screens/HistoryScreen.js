// History — tabbed view with day/week/month/all time filters, swipeable cards
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { format, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';

import {
  fetchGlucose,
  fetchInsulin,
  fetchFood,
  fetchGlucoseByRange,
  fetchInsulinByRange,
  fetchFoodByRange,
  deleteGlucose,
  deleteInsulin,
  deleteFood,
} from '../database/db';
import { COLORS, SPACING, RADIUS, getGlucoseStatus } from '../constants/themes';

const DATA_TABS = ['Glucose', 'Insulin', 'Food'];
const TIME_TABS = ['Day', 'Week', 'Month', 'All'];

export default function HistoryScreen() {
  const [activeTab, setActiveTab] = useState('Glucose');
  const [timeRange, setTimeRange] = useState('All');
  const [glucose, setGlucose]     = useState([]);
  const [insulin, setInsulin]     = useState([]);
  const [food, setFood]           = useState([]);

  const getTimeRange = () => {
    const now = new Date();
    switch (timeRange) {
      case 'Day':   return { start: startOfDay(now).toISOString(), end: endOfDay(now).toISOString() };
      case 'Week':  return { start: startOfWeek(now, { weekStartsOn: 1 }).toISOString(), end: endOfWeek(now, { weekStartsOn: 1 }).toISOString() };
      case 'Month': return { start: startOfMonth(now).toISOString(), end: endOfMonth(now).toISOString() };
      default:      return null;
    }
  };

  const loadAll = useCallback(async () => {
    const range = getTimeRange();
    let g, i, f;
    if (range) {
      [g, i, f] = await Promise.all([
        fetchGlucoseByRange(range.start, range.end),
        fetchInsulinByRange(range.start, range.end),
        fetchFoodByRange(range.start, range.end),
      ]);
      g = [...g].reverse();
      i = [...i].reverse();
      f = [...f].reverse();
    } else {
      [g, i, f] = await Promise.all([fetchGlucose(), fetchInsulin(), fetchFood()]);
    }
    setGlucose(g);
    setInsulin(i);
    setFood(f);
  }, [timeRange]);

  useFocusEffect(useCallback(() => { loadAll(); }, [loadAll]));

  const confirmDelete = (type, id) => {
    Alert.alert('Delete Entry', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          if (type === 'glucose') await deleteGlucose(id);
          if (type === 'insulin') await deleteInsulin(id);
          if (type === 'food')    await deleteFood(id);
          await loadAll();
        },
      },
    ]);
  };

  const renderGlucose = ({ item }) => {
    const s = getGlucoseStatus(item.value);
    return (
      <View style={styles.card}>
        <View style={[styles.accentBar, { backgroundColor: s.color }]} />
        <View style={styles.cardBody}>
          <View style={styles.cardRow}>
            <Text style={[styles.cardValue, { color: s.color }]}>{item.value} <Text style={styles.cardUnit}>mg/dL</Text></Text>
            <View style={[styles.badge, { backgroundColor: s.bg }]}>
              <Text style={[styles.badgeText, { color: s.color }]}>{s.label}</Text>
            </View>
          </View>
          <Text style={styles.cardTime}>{format(new Date(item.timestamp), 'EEE d MMM · HH:mm')}</Text>
          {!!item.note && <Text style={styles.cardNote}>{item.note}</Text>}
          }
        </View>
        <TouchableOpacity onPress={() => confirmDelete('glucose', item.id)} style={styles.delBtn}>
          <Text style={styles.delBtnText}>X</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderInsulin = ({ item }) => (
    <View style={styles.card}>
      <View style={[styles.accentBar, { backgroundColor: COLORS.accent }]} />
      <View style={styles.cardBody}>
        <View style={styles.cardRow}>
          <Text style={styles.cardValue}>{item.units} <Text style={styles.cardUnit}>units</Text></Text>
          <View style={[styles.badge, { backgroundColor: COLORS.accentLight }]}>
            <Text style={[styles.badgeText, { color: COLORS.accent }]}>{item.type}-Acting</Text>
          </View>
        </View>
        <Text style={styles.cardTime}>{format(new Date(item.timestamp), 'EEE d MMM · HH:mm')}</Text>
        {!!item.note && <Text style={styles.cardNote}>{item.note}</Text>}
        }
      </View>
      <TouchableOpacity onPress={() => confirmDelete('insulin', item.id)} style={styles.delBtn}>
        <Text style={styles.delBtnText}>X</Text>
      </TouchableOpacity>
    </View>
  );

  const renderFood = ({ item }) => (
    <View style={styles.card}>
      <View style={[styles.accentBar, { backgroundColor: COLORS.food }]} />
      <View style={styles.cardBody}>
        <View style={styles.cardRow}>
          <Text style={[styles.cardValue, { fontSize: 15 }]} numberOfLines={1}>{item.name}</Text>
          {item.carbs > 0 && (
            <View style={[styles.badge, { backgroundColor: COLORS.foodLight }]}>
              <Text style={[styles.badgeText, { color: COLORS.food }]}>{item.carbs}g</Text>
            </View>
          )}
        </View>
        <Text style={styles.cardTime}>{format(new Date(item.timestamp), 'EEE d MMM · HH:mm')}</Text>
        {!!item.note && <Text style={styles.cardNote}>{item.note}</Text>}
        }
      </View>
      <TouchableOpacity onPress={() => confirmDelete('food', item.id)} style={styles.delBtn}>
        <Text style={styles.delBtnText}>X</Text>
      </TouchableOpacity>
    </View>
  );

  const dataMap   = { Glucose: glucose, Insulin: insulin, Food: food };
  const renderMap = { Glucose: renderGlucose, Insulin: renderInsulin, Food: renderFood };
  const emptyMap  = {
    Glucose: 'No glucose readings for this period.',
    Insulin: 'No insulin doses for this period.',
    Food:    'No food entries for this period.',
  };

  return (
    <View style={styles.container}>

      {/* ─── Data Type Tabs ─── */}
      <View style={styles.tabBar}>
        {DATA_TABS.map(tab => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>{tab}</Text>
            <View style={[styles.tabCount, activeTab === tab && styles.tabCountActive]}>
              <Text style={[styles.tabCountText, activeTab === tab && styles.tabCountTextActive]}>
                {dataMap[tab].length}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* ─── Time Range ─── */}
      <View style={styles.timeBar}>
        {TIME_TABS.map(t => (
          <TouchableOpacity
            key={t}
            style={[styles.timePill, timeRange === t && styles.timePillActive]}
            onPress={() => setTimeRange(t)}
          >
            <Text style={[styles.timePillText, timeRange === t && styles.timePillTextActive]}>{t}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ─── List ─── */}
      <FlatList
        data={dataMap[activeTab]}
        keyExtractor={item => `${activeTab}-${item.id}`}
        renderItem={renderMap[activeTab]}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>{emptyMap[activeTab]}</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },

  tabBar: { flexDirection: 'row', backgroundColor: COLORS.surface, paddingHorizontal: SPACING.lg, paddingTop: SPACING.md },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: SPACING.md,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    gap: 6,
  },
  tabActive: { borderBottomColor: COLORS.primary },
  tabText:       { fontSize: 14, fontWeight: '500', color: COLORS.subtext },
  tabTextActive: { color: COLORS.primary, fontWeight: '700' },
  tabCount:      { backgroundColor: COLORS.surfaceAlt, borderRadius: RADIUS.full, paddingHorizontal: 8, paddingVertical: 2 },
  tabCountActive:{ backgroundColor: COLORS.primaryLight },
  tabCountText:      { fontSize: 11, color: COLORS.subtext, fontWeight: '600' },
  tabCountTextActive:{ color: COLORS.primary },

  timeBar: { flexDirection: 'row', backgroundColor: COLORS.surface, paddingHorizontal: SPACING.lg, paddingVertical: SPACING.sm, borderBottomWidth: 1, borderBottomColor: COLORS.divider, gap: 6 },
  timePill: { flex: 1, alignItems: 'center', paddingVertical: 6, borderRadius: RADIUS.sm, backgroundColor: COLORS.surfaceAlt },
  timePillActive: { backgroundColor: COLORS.secondary },
  timePillText:       { fontSize: 12, color: COLORS.subtext, fontWeight: '600' },
  timePillTextActive: { color: COLORS.white, fontWeight: '700' },

  listContent: { padding: SPACING.lg, paddingBottom: 30 },

  card: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    marginBottom: 8,
    overflow: 'hidden',
    shadowColor: COLORS.shadow,
    shadowOpacity: 1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  accentBar: { width: 4 },
  cardBody:  { flex: 1, padding: SPACING.md },
  cardRow:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  cardValue: { fontSize: 17, fontWeight: '800', color: COLORS.text },
  cardUnit:  { fontSize: 12, fontWeight: '500', color: COLORS.subtext },
  badge:     { borderRadius: RADIUS.full, paddingHorizontal: 10, paddingVertical: 3 },
  badgeText: { fontSize: 11, fontWeight: '700' },
  cardTime:  { fontSize: 12, color: COLORS.subtext },
  cardNote:  { fontSize: 12, color: COLORS.placeholder, marginTop: 4, fontStyle: 'italic' },
  delBtn:    { padding: SPACING.md, justifyContent: 'center', alignItems: 'center' },
  delBtnText:{ fontSize: 13, color: COLORS.muted, fontWeight: '700' },

  empty: { paddingTop: 60, alignItems: 'center' },
  emptyText: { color: COLORS.placeholder, fontSize: 14 },
});
