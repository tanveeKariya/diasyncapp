// Settings — export, notifications, glucose targets, about
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { COLORS, SPACING, RADIUS } from '../constants/themes';
import { exportAllData } from '../utils/exportCSV';
import { scheduleReminders, cancelAllReminders, isNotificationsAvailable } from '../utils/notifications';

export default function SettingsScreen() {
  const [exporting, setExporting]     = useState(false);
  const [notifStatus, setNotifStatus] = useState('');

  const handleExport = async () => {
    setExporting(true);
    try {
      const path = await exportAllData();
      Alert.alert(
        'Export Complete',
        Platform.OS === 'web'
          ? 'Your CSV file has been downloaded.'
          : 'Your data has been exported and the share dialog opened.'
      );
    } catch (e) {
      Alert.alert('Export Failed', 'Could not export data.\n' + (e.message || ''));
    } finally {
      setExporting(false);
    }
  };

  const handleEnableReminders = async () => {
    if (Platform.OS === 'web') {
      Alert.alert('Not Supported', 'Notifications are not available in web preview.');
      return;
    }
    if (!isNotificationsAvailable()) {
      Alert.alert('Not Available in Expo Go', 'Notifications require a development build. Build the APK with EAS to use them on your device.');
      return;
    }
    try {
      await scheduleReminders();
      setNotifStatus('enabled');
      Alert.alert('Hourly Reminders Enabled', 'You will receive a reminder every hour to log your glucose.');
    } catch (e) {
      Alert.alert('Error', e.message || 'Could not enable reminders.');
    }
  };

  const handleDisableReminders = async () => {
    if (Platform.OS === 'web') return;
    try {
      await cancelAllReminders();
      setNotifStatus('disabled');
      Alert.alert('Reminders Disabled', 'All scheduled reminders cancelled.');
    } catch (e) {
      Alert.alert('Error', e.message || 'Could not disable reminders.');
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.inner}>

        <Text style={styles.heading}>Settings</Text>

        {/* ─── Data ─── */}
        <SectionTitle title="Data Management" />
        <ActionCard
          title="Export Data as CSV"
          desc="Download all glucose, insulin, and food logs as a CSV file."
          onPress={handleExport}
          loading={exporting}
          color={COLORS.primary}
          label="Export"
        />

        {/* ─── Notifications ─── */}
        <SectionTitle title="Notifications" />
        <ActionCard
          title="Enable Hourly Reminders"
          desc="Get a reminder every hour to log your glucose, insulin, and food."
          onPress={handleEnableReminders}
          color={COLORS.secondary}
          label="Enable"
        />
        <ActionCard
          title="Disable All Reminders"
          desc="Cancel all scheduled notifications."
          onPress={handleDisableReminders}
          color={COLORS.high}
          label="Disable"
        />
        {notifStatus !== '' && (
          <Text style={[styles.statusLine, { color: notifStatus === 'enabled' ? COLORS.safe : COLORS.high }]}>
            Reminders {notifStatus}
          </Text>
        )}

        {/* ─── Targets ─── */}
        <SectionTitle title="Glucose Targets" />
        <View style={styles.infoCard}>
          <InfoRow label="Low alert below"  value="70 mg/dL"   color={COLORS.low} />
          <InfoRow label="High alert above" value="180 mg/dL"  color={COLORS.high} />
          <InfoRow label="Target range"      value="70 - 180"  color={COLORS.safe} />
          <Text style={styles.note}>Standard T1D targets. Consult your endocrinologist for personalised ranges.</Text>
        </View>

        {/* ─── About ─── */}
        <SectionTitle title="About" />
        <View style={styles.infoCard}>
          <InfoRow label="App Name"   value="DiabetesManager" />
          <InfoRow label="Version"    value="1.0.0" />
          <InfoRow label="Built With" value="React Native + Expo" />
          <InfoRow label="Storage"    value="Local SQLite (offline)" />
          <Text style={styles.note}>This app is a personal health tracking tool and is not a medical device. Always consult your healthcare team.</Text>
        </View>

        <View style={{ height: 40 }} />
      </View>
    </ScrollView>
  );
}

function SectionTitle({ title }) {
  return <Text style={styles.sectionTitle}>{title}</Text>;
}

function ActionCard({ title, desc, onPress, loading, color, label }) {
  return (
    <View style={styles.actionCard}>
      <View style={styles.actionText}>
        <Text style={styles.actionTitle}>{title}</Text>
        <Text style={styles.actionDesc}>{desc}</Text>
      </View>
      <TouchableOpacity style={[styles.actionBtn, { backgroundColor: color }]} onPress={onPress} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.actionBtnLabel}>{label}</Text>}
        }
      </TouchableOpacity>
    </View>
  );
}

function InfoRow({ label, value, color }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={[styles.infoValue, color && { color }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  inner: { padding: SPACING.xl },

  heading: { fontSize: 24, fontWeight: '800', color: COLORS.text, marginBottom: SPACING.xxl },

  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.subtext,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
    marginTop: 8,
  },

  actionCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    padding: SPACING.lg,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: COLORS.shadow,
    shadowOpacity: 1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  actionText:  { flex: 1, marginRight: 12 },
  actionTitle: { fontSize: 14, fontWeight: '700', color: COLORS.text, marginBottom: 3 },
  actionDesc:  { fontSize: 12, color: COLORS.subtext, lineHeight: 17 },
  actionBtn:   { borderRadius: RADIUS.sm, paddingHorizontal: 16, paddingVertical: 10, minWidth: 72, alignItems: 'center' },
  actionBtnLabel: { color: COLORS.white, fontSize: 13, fontWeight: '700' },

  statusLine: { fontSize: 13, fontWeight: '600', marginBottom: 10 },

  infoCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    shadowColor: COLORS.shadow,
    shadowOpacity: 1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 7, borderBottomWidth: 1, borderBottomColor: COLORS.divider },
  infoLabel: { fontSize: 13, color: COLORS.subtext },
  infoValue: { fontSize: 13, fontWeight: '700', color: COLORS.text },
  note: { fontSize: 11, color: COLORS.placeholder, marginTop: 10, lineHeight: 16 },
});
