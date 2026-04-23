import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FrigoIngredient } from '../hooks/useFrigo';

// ─── Constants ────────────────────────────────────────────────────────────────

const NOTIFICATIONS_ENABLED_KEY = '@frigo_notifications_enabled';
const DAILY_NOTIFICATION_ID = 'frigo-daily-expiring';

// ─── Setup ────────────────────────────────────────────────────────────────────

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// ─── Permissions ──────────────────────────────────────────────────────────────

export async function requestNotificationPermission(): Promise<boolean> {
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;

  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

// ─── Enabled flag (AsyncStorage) ─────────────────────────────────────────────

export async function getNotificationsEnabled(): Promise<boolean> {
  try {
    const raw = await AsyncStorage.getItem(NOTIFICATIONS_ENABLED_KEY);
    // Default to true on first launch
    return raw === null ? true : raw === 'true';
  } catch {
    return true;
  }
}

export async function setNotificationsEnabled(enabled: boolean): Promise<void> {
  try {
    await AsyncStorage.setItem(NOTIFICATIONS_ENABLED_KEY, String(enabled));
  } catch {
    // silently ignore
  }
}

// ─── Schedule / cancel ────────────────────────────────────────────────────────

export async function scheduleDailyNotification(expiringIngredients: FrigoIngredient[]): Promise<void> {
  // Cancel any existing daily notification first
  await Notifications.cancelScheduledNotificationAsync(DAILY_NOTIFICATION_ID).catch(() => {});

  if (expiringIngredients.length === 0) return;

  const names = expiringIngredients.map((i) => i.name).join(', ');
  const body =
    expiringIngredients.length === 1
      ? `${names} est dans ton frigo depuis plus d'une semaine. Utilise-le vite !`
      : `${names} sont dans ton frigo depuis plus d'une semaine. Utilise-les vite !`;

  await Notifications.scheduleNotificationAsync({
    identifier: DAILY_NOTIFICATION_ID,
    content: {
      title: 'FrigoAI 🥦',
      body,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: 18,
      minute: 0,
    },
  });
}

export async function cancelDailyNotification(): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(DAILY_NOTIFICATION_ID).catch(() => {});
}

// ─── Main init call (called from HomeScreen) ──────────────────────────────────

export async function initNotifications(expiringIngredients: FrigoIngredient[]): Promise<void> {
  const enabled = await getNotificationsEnabled();
  if (!enabled) {
    await cancelDailyNotification();
    return;
  }

  const granted = await requestNotificationPermission();
  if (!granted) return;

  await scheduleDailyNotification(expiringIngredients);
}
