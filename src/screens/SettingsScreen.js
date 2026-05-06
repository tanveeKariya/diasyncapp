// Settings — export data, notification preferences, app info
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
import { COLORS } from '../constants/themes';
import { exportAllData } from '../utils/exportCSV';
import { scheduleReminders, cancelAllReminders, isNotificationsAvailable } from '../utils/notifications';

export default function SettingsScreen() {
  const [exporting, setExporting]         = useState(false);
  const [notifStatus, setNotifStatus]     = useState('');

  const handleExport = async () => {
    setExporting(true);
    try {
      await exportAllData();
      Alert.alert('Export Complete', 'Your data has been exported successfully.');
    } catch (e) {
      Alert.alert('Export Failed', 'Could not export data. Please try again.\n' + (e.message || ''));
    } finally {
      setExporting(false);
    }
  };

  const handleEnableReminders = async () => {
    if (Platform.OS === 'web') {
      Alert.alert('Not Supported', 'Notifications are not available in web preview. They will work on your Android/iOS device.');
      return;
    }
    if (!isNotificationsAvailable()) {
      Alert.alert(
        'Not Available in Expo Go',
        'Notifications require a development build. To use them, build the app with EAS Build and install the APK on your device.'
      );
      return;
    }
    try {
      await scheduleReminders();
      setNotifStatus('enabled');
      Alert.alert('Hourly Reminders Enabled', 'You will receive a reminder every hour to check your blood glucose.');
    } catch (e) {
      Alert.alert('Error', 'Could not enable reminders: ' + e.message);
    }
  };

  const handleDisableReminders = async () => {
    if (Platform.OS === 'web') return;
    try {
      await cancelAllReminders();
      setNotifStatus('disabled');
      Alert.alert('Reminders Disabled', 'All scheduled reminders have been cancelled.');
    } catch (e) {
      Alert.alert('Error', 'Could not disable reminders: ' + e.message);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.inner}>

        <Text style={styles.heading}>Settings</Text>

        {/* ─── Data Management ─── */}
        <SectionHeader title="Data Management" />

        <SettingCard
          title="Export Data as CSV"
          desc="Download all glucose, insulin, and food logs as a CSV file you can open in Excel or Google Sheets."
          onPress={handleExport}
          loading={exporting}
          color={COLORS.primary}
          btnLabel="Export"
        />

        {/* ─── Notifications ─── */}
        <SectionHeader title="Notifications" />

        <SettingCard
          title="Enable Hourly Reminders"
          desc="Get a reminder every hour to check your blood glucose. Requires a development build (not Expo Go)."
          onPress={handleEnableReminders}
          color={COLORS.secondary}
          btnLabel="Enable"
        />
        <SettingCard
          title="Disable All Reminders"
          desc="Cancel all scheduled reminder notifications."
          onPress={handleDisableReminders}
          color={COLORS.high}
          btnLabel="Disable"
        />

        {notifStatus !== '' && (
          <Text style={[styles.statusMsg, { color: notifStatus === 'enabled' ? COLORS.safe : COLORS.high }]}>
            Reminders {notifStatus}.
          </Text>
        )}

        {/* ─── Target Ranges ─── */}
        <SectionHeader title="Glucose Targets" />
        <View style={styles.infoCard}>
          <RangeRow label="Low alert below"     value="70 mg/dL"  color={COLORS.low}  />
          <RangeRow label="High alert above"    value="180 mg/dL" color={COLORS.high} />
          <RangeRow label="Target range"        value="70 - 180 mg/dL" color={COLORS.safe} />
          <Text style={styles.rangeNote}>These are the standard T1D targets. Consult your endocrinologist for personalised ranges.</Text>
        </View>

        {/* ─── About ─── */}
        <SectionHeader title="About" />
        <View style={styles.infoCard}>
          <InfoRow label="App Name"    value="DiabetesManager" />
          <InfoRow label="Version"     value="1.0.0" />
          <InfoRow label="Built With"  value="React Native + Expo" />
          <InfoRow label="Storage"     value="Local SQLite (offline-first)" />
          <Text style={styles.disclaimer}>
            This app is a personal health tracking tool and is not a medical device.
            Always consult your healthcare team for medical decisions.
          </Text>
        </View>

        <View style={{ height: 40 }} />
      </View>
    </ScrollView>
  );
}

function SectionHeader({ title }) {
  return <Text style={styles.sectionHeader}>{title}</Text>;
}

function SettingCard({ title, desc, onPress, loading, color, btnLabel }) {
  return (
    <View style={styles.settingCard}>
      <View style={styles.settingText}>
        <Text style={styles.settingTitle}>{title}</Text>
        <Text style={styles.settingDesc}>{desc}</Text>
      </View>
      <TouchableOpacity style={[styles.settingBtn, { backgroundColor: color }]} onPress={onPress} disabled={loading}>
        {loading
          ? <ActivityIndicator color="#fff" size="small" />
          : <Text style={styles.settingBtnText}>{btnLabel}</Text>
        }
      </TouchableOpacity>
    </View>
  );
}

function RangeRow({ label, value, color }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={[styles.infoValue, { color }]}>{value}</Text>
    </View>
  );
}

function InfoRow({ label, value }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  inner:     { padding: 20 },

  heading: { fontSize: 24, fontWeight: '700', color: COLORS.text, marginBottom: 24 },

  sectionHeader: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.subtext,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 10,
    marginTop: 8,
  },

  settingCard: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: COLORS.shadow,
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 1,
  },
  settingText:  { flex: 1, marginRight: 12 },
  settingTitle: { fontSize: 14, fontWeight: '700', color: COLORS.text, marginBottom: 4 },
  settingDesc:  { fontSize: 12, color: COLORS.subtext, lineHeight: 18 },
  settingBtn:   { borderRadius: 10, paddingHorizontal: 14, paddingVertical: 9, minWidth: 72, alignItems: 'center' },
  settingBtnText: { color: COLORS.white, fontSize: 13, fontWeight: '700' },

  statusMsg: { fontSize: 13, marginTop: -4, marginBottom: 12, fontWeight: '600' },

  infoCard: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    shadowColor: COLORS.shadow,
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 1,
  },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 7, borderBottomWidth: 1, borderBottomColor: COLORS.divider },
  infoLabel: { fontSize: 13, color: COLORS.subtext },
  infoValue: { fontSize: 13, fontWeight: '600', color: COLORS.text },
  rangeNote: { fontSize: 11, color: COLORS.placeholder, marginTop: 10, lineHeight: 16 },
  disclaimer: { fontSize: 11, color: COLORS.placeholder, marginTop: 10, lineHeight: 16, fontStyle: 'italic' },
});
