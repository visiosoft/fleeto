// Home-screen shortcuts (long-press the app icon on Android, 3D/haptic touch
// or long-press on iOS): "New Invoice" and "New Expense" jump straight into
// the relevant form. Uses expo-quick-actions, which needs a dev/production
// build — it is a no-op in plain Expo Go.
import { createNavigationContainerRef } from '@react-navigation/native';
import * as QuickActions from 'expo-quick-actions';

export const navigationRef = createNavigationContainerRef();

const ACTIONS = [
  {
    id: 'new-invoice',
    title: 'New Invoice',
    subtitle: 'Create an invoice',
    icon: 'compose', // Android: SF-symbol-style names map to a bundled icon set
    params: { screen: 'InvoiceForm' as const },
  },
  {
    id: 'new-expense',
    title: 'New Expense',
    subtitle: 'Log an expense',
    icon: 'add',
    params: { screen: 'CostForm' as const },
  },
];

/** Registers the two shortcuts. Call once, after the app finishes loading. */
export const registerQuickActions = () => {
  try {
    QuickActions.setItems(
      ACTIONS.map((a) => ({ id: a.id, title: a.title, subtitle: a.subtitle, icon: a.icon }))
    );
  } catch (err) {
    console.log('Quick actions unavailable (needs a dev/production build):', err);
  }
};

const openShortcutScreen = (actionId: string) => {
  const action = ACTIONS.find((a) => a.id === actionId);
  if (!action || !navigationRef.isReady()) return;
  // Both forms live in the Dashboard tab's stack, reached through the drawer.
  (navigationRef.navigate as any)('Tabs', {
    screen: 'Dashboard',
    params: { screen: action.params.screen },
  });
};

/** Handles a shortcut tapped while the app was already running. */
export const listenForQuickActions = () => {
  const sub = QuickActions.addListener((action) => {
    if (action?.id) openShortcutScreen(action.id);
  });
  return () => sub?.remove?.();
};

/** Handles a shortcut that launched the app cold. */
export const consumeInitialQuickAction = async () => {
  try {
    const initial = await QuickActions.initial;
    if (initial?.id) openShortcutScreen(initial.id);
  } catch {
    // Not available in this runtime (e.g. Expo Go) — ignore.
  }
};
