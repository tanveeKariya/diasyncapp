// Hourly reminder notifications — gracefully handles Expo Go limitations
import { Platform } from 'react-native';

let notificationsAvailable = false;
let Notifications = null;

// Try to import expo-notifications — it may not be available in Expo Go
try {
  Notifications = require('expo-notifications');
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
  notificationsAvailable = true;
} catch {
  notificationsAvailable = false;
}

export const isNotificationsAvailable = () => notificationsAvailable;

export const requestPermissions = async () => {
  if (!notificationsAvailable) return false;
  try {
    const { status } = await Notifications.requestPermissionsAsync();
    return status === 'granted';
  } catch {
    return false;
  }
};

export const cancelAllReminders = async () => {
  if (!notificationsAvailable) return;
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch {}
};

// Schedule a repeating hourly notification
export const scheduleHourlyReminders = async (title, body) => {
  if (!notificationsAvailable) return;
  try {
    await Notifications.scheduleNotificationAsync({
      content: { title, body, sound: true },
      trigger: {
        seconds: 3600,
        repeats: true,
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      },
    });
  } catch {}
};

// Main setup — hourly reminders to log glucose, insulin, food
export const scheduleReminders = async () => {
  if (Platform.OS === 'web') return;

  const granted = await requestPermissions();
  if (!granted) return;

  await cancelAllReminders();

  await scheduleHourlyReminders(
    'Time to log your readings',
    'Record your glucose, insulin, and food to stay on track.'
  );
};
