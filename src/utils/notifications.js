import { Platform } from 'react-native';

let notificationsAvailable = false;
let Notifications = null;

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

const scheduleRepeatingNotification = async (title, body, intervalSeconds) => {
  if (!notificationsAvailable) return;
  try {
    await Notifications.scheduleNotificationAsync({
      content: { title, body, sound: true },
      trigger: {
        seconds: intervalSeconds,
        repeats: true,
      },
    });
  } catch (e) {
    console.warn('Notification schedule error:', e?.message || e);
  }
};

export const scheduleReminders = async () => {
  if (Platform.OS === 'web') return;

  const granted = await requestPermissions();
  if (!granted) return;

  await cancelAllReminders();

  // Every 2 hours (7200 seconds) — reminder to log glucose and insulin
  await scheduleRepeatingNotification(
    'Time to log your readings',
    'Record your glucose and insulin to stay on track.',
    7200
  );
};
