// PHASE 7 BONUS: Reminder notifications — gracefully handles Expo Go limitations
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

let notificationsAvailable = false;

// Configure how notifications appear when received
try {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
  notificationsAvailable = true;
} catch {
  // expo-notifications not fully available in this environment (e.g. Expo Go)
  notificationsAvailable = false;
}

// Request notification permissions from the OS
export const requestPermissions = async () => {
  if (!notificationsAvailable) return false;
  try {
    const { status } = await Notifications.requestPermissionsAsync();
    return status === 'granted';
  } catch {
    return false;
  }
};

// Cancel all previously scheduled notifications
export const cancelAllReminders = async () => {
  if (!notificationsAvailable) return;
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch {
    // Silently fail in Expo Go
  }
};

// Schedule a repeating hourly notification
export const scheduleHourlyReminders = async (title, body) => {
  if (!notificationsAvailable) return;
  try {
    await Notifications.scheduleNotificationAsync({
      content: { title, body, sound: true },
      trigger: {
        seconds: 3600, // 1 hour
        repeats: true,
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      },
    });
  } catch {
    // Silently fail in Expo Go
  }
};

// Schedule recurring daily reminders at specific hours
export const scheduleDailyReminders = async (hours, title, body) => {
  if (!notificationsAvailable) return;
  try {
    for (const hour of hours) {
      await Notifications.scheduleNotificationAsync({
        content: { title, body, sound: true },
        trigger: {
          hour,
          minute: 0,
          repeats: true,
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
        },
      });
    }
  } catch {
    // Silently fail in Expo Go
  }
};

// Check if notifications are available in the current environment
export const isNotificationsAvailable = () => notificationsAvailable;

// Main setup — called once on app launch
// Sets up hourly glucose check reminders
export const scheduleReminders = async () => {
  if (Platform.OS === 'web') return;

  const granted = await requestPermissions();
  if (!granted) return;

  await cancelAllReminders();

  // Hourly glucose check reminder
  await scheduleHourlyReminders(
    'Check your blood glucose',
    'Time for your hourly glucose check. Stay on top of your levels!'
  );
};
