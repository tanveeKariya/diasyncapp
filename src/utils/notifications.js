// PHASE 7 BONUS: Daily reminder notifications for glucose checks and insulin
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// Request notification permissions from the OS
export const requestPermissions = async () => {
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
};

// Cancel all previously scheduled notifications (to avoid duplicates on re-setup)
export const cancelAllReminders = async () => {
  await Notifications.cancelAllScheduledNotificationsAsync();
};

// Schedule recurring daily reminders at specific hours
// hours: array of 24h values, e.g. [8, 14, 20]
export const scheduleDailyReminders = async (hours, title, body) => {
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
};

// Main setup — called once on app launch
export const scheduleReminders = async () => {
  const granted = await requestPermissions();
  if (!granted) return;

  await cancelAllReminders();

  // Glucose check reminders: 8am, 2pm, 8pm
  await scheduleDailyReminders(
    [8, 14, 20],
    'Time to check your blood glucose',
    'Log your reading to keep your data accurate.'
  );

  // Long-acting insulin reminder: 10pm
  await scheduleDailyReminders(
    [22],
    'Long-acting insulin reminder',
    "Don't forget your evening basal dose."
  );
};
