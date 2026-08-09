import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

// Local reminders for scheduled maintenance:
//   • one reminder N days before the due date (default 3)
//   • one on the due date itself
//   • then a daily nag until the job is marked done
//
// Notifications are local (no server push needed) and are rescheduled from the
// current record list every time the maintenance screen loads.

const DAILY_NAG_DAYS = 14; // how far past the due date we keep reminding

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export const requestNotificationPermission = async (): Promise<boolean> => {
  if (Platform.OS === 'web') return false;
  try {
    const { status: existing } = await Notifications.getPermissionsAsync();
    if (existing === 'granted') return true;
    const { status } = await Notifications.requestPermissionsAsync();
    return status === 'granted';
  } catch {
    return false;
  }
};

const atNineAm = (date: Date) => {
  const d = new Date(date);
  d.setHours(9, 0, 0, 0);
  return d;
};

/**
 * Clears previously scheduled maintenance reminders and schedules fresh ones
 * for every record that is still open (not completed/cancelled).
 */
export const syncMaintenanceReminders = async (records: any[]) => {
  if (Platform.OS === 'web') return;
  const granted = await requestNotificationPermission();
  if (!granted) return;

  try {
    // Remove our previously scheduled reminders so we never double-book
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    await Promise.all(
      scheduled
        .filter((n) => (n.content?.data as any)?.kind === 'maintenance')
        .map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier))
    );

    const now = new Date();
    const open = records.filter((r: any) => ['Scheduled', 'Pending', 'In Progress'].includes(r.status));

    for (const record of open) {
      const due = new Date(record.date);
      if (isNaN(due.getTime())) continue;

      const leadDays = Number(record.remindDaysBefore ?? 3);
      const title = `${record.service} due — ${record.vehicleName}`;
      const fireDates: Array<{ when: Date; body: string }> = [];

      // Reminder N days before
      const early = atNineAm(new Date(due));
      early.setDate(early.getDate() - leadDays);
      if (early > now) {
        fireDates.push({ when: early, body: `Due in ${leadDays} days (${due.toLocaleDateString('en-GB')}).` });
      }

      // On the due date
      const onDay = atNineAm(due);
      if (onDay > now) {
        fireDates.push({ when: onDay, body: 'Due today. Tap to mark it done once completed.' });
      }

      // Daily nag until it is marked done
      for (let i = 1; i <= DAILY_NAG_DAYS; i++) {
        const nag = atNineAm(new Date(due));
        nag.setDate(nag.getDate() + i);
        if (nag > now) {
          fireDates.push({ when: nag, body: `Still pending — overdue by ${i} day${i !== 1 ? 's' : ''}.` });
        }
      }

      for (const f of fireDates) {
        await Notifications.scheduleNotificationAsync({
          content: {
            title,
            body: f.body,
            data: { kind: 'maintenance', recordId: String(record._id) },
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DATE,
            date: f.when,
          },
        });
      }
    }
  } catch (err) {
    console.log('Could not schedule maintenance reminders:', err);
  }
};

/** Cancels every reminder belonging to one maintenance record (after marking done). */
export const cancelRemindersFor = async (recordId: string) => {
  if (Platform.OS === 'web') return;
  try {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    await Promise.all(
      scheduled
        .filter((n) => {
          const data = n.content?.data as any;
          return data?.kind === 'maintenance' && String(data?.recordId) === String(recordId);
        })
        .map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier))
    );
  } catch (err) {
    console.log('Could not cancel reminders:', err);
  }
};
