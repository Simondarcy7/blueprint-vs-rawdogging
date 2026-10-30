import { useEffect, useSyncExternalStore, type ReactNode } from "react";
import { StyleSheet, Switch, View } from "react-native";
import {
  ActionButton,
  AsyncContent,
  ProductText,
  SettingsSection,
  useProductUITheme,
} from "../../components/product-ui";
import type {
  createNotificationPreferencesController,
  PreferenceSnapshot,
} from "../../services/notification-preferences/notificationPreferences";

export type NotificationPreferencesController<P extends object> = ReturnType<
  typeof createNotificationPreferencesController<P>
>;
export type NotificationPreferenceField<P extends object> = {
  id: string;
  title: string;
  description?: string;
  selected(value: Readonly<P>): boolean;
  change(value: Readonly<P>, enabled: boolean): P;
};
export type NotificationPreferencesPanelProps<P extends object> = {
  /** Host owns scope, foreground/background lifecycle and disposal. Mounting only reconciles. */
  controller: NotificationPreferencesController<P>;
  fields: readonly NotificationPreferenceField<P>[];
  title?: string;
  description?: string;
  onOpenSettings?: () => void | Promise<unknown>;
  /** For platform-specific schedule editors; use controller.update for their commit. */
  children?: ReactNode;
};

export function NotificationPreferencesPanel<P extends object>({
  controller,
  fields,
  title = "Notifications",
  description,
  onOpenSettings,
  children,
}: NotificationPreferencesPanelProps<P>) {
  const theme = useProductUITheme();
  const state = useSyncExternalStore(
    controller.subscribe,
    controller.getSnapshot,
    controller.getSnapshot,
  );
  useEffect(() => {
    void controller.reconcile();
  }, [controller]);
  const unavailable =
    state.status === "disposed" ||
    state.error === "owner-changed" ||
    state.error === "inactive";
  const disabled = state.busy || unavailable || state.status !== "ready";
  const message = preferenceMessage(state);
  return (
    <SettingsSection title={title} description={description}>
      {!state.value ? (
        <AsyncContent
          status={state.busy ? "loading" : "error"}
          loadingLabel="Loading notification preferences"
          errorMessage={
            unavailable
              ? "Notification preferences are unavailable for this session."
              : (message ?? "Could not load notification preferences.")
          }
          onRetry={unavailable ? undefined : controller.reconcile}
        />
      ) : (
        <>
          {fields.map((field) => (
            <View key={field.id} style={styles.row}>
              <View style={styles.copy}>
                <ProductText>{field.title}</ProductText>
                {field.description ? (
                  <ProductText variant="caption" tone="muted">
                    {field.description}
                  </ProductText>
                ) : null}
              </View>
              <Switch
                accessibilityLabel={field.title}
                accessibilityHint={field.description}
                accessibilityState={{
                  checked: field.selected(state.value!),
                  disabled,
                }}
                disabled={disabled}
                value={field.selected(state.value!)}
                onValueChange={(value) => {
                  if (!disabled && state.value)
                    void controller.update(field.change(state.value, value));
                }}
                trackColor={{
                  false: theme.colors.border,
                  true: theme.colors.accent,
                }}
              />
            </View>
          ))}
          <ProductText variant="caption" tone="muted">
            {permissionMessage(state.permission)}
          </ProductText>
          {state.busy ? (
            <ProductText accessibilityLiveRegion="polite">
              {busyMessage(state.status)}
            </ProductText>
          ) : null}
          {message ? (
            <View accessibilityLiveRegion="polite">
              <ProductText tone="danger">{message}</ProductText>
            </View>
          ) : null}
          {!state.busy &&
          !unavailable &&
          (state.error || state.device === "pending") ? (
            <ActionButton
              label="Refresh notification preferences"
              onPress={controller.reconcile}
              tone="secondary"
            />
          ) : null}
          {state.permission === "denied" && onOpenSettings ? (
            <ActionButton
              label="Open device settings"
              onPress={onOpenSettings}
              tone="secondary"
            />
          ) : null}
          {children}
        </>
      )}
    </SettingsSection>
  );
}
function permissionMessage(
  permission: PreferenceSnapshot<unknown>["permission"],
) {
  if (permission === "granted")
    return "Notifications are allowed on this device.";
  if (permission === "denied")
    return "Notifications are blocked in device settings.";
  if (permission === "unavailable")
    return "Device notifications are unavailable here.";
  return "Turning on a reminder may ask for device permission.";
}
function busyMessage(status: PreferenceSnapshot<unknown>["status"]) {
  if (status === "rolling-back") return "Restoring your previous preferences…";
  if (status === "saving") return "Saving notification preferences…";
  if (status === "applying") return "Updating device reminders…";
  return "Checking notification preferences…";
}
function preferenceMessage(state: PreferenceSnapshot<unknown>): string | null {
  switch (state.error) {
    case "unknown-write":
      return "The save result is not confirmed. Refresh before making another change.";
    case "conflict":
      return "Preferences changed elsewhere. Refresh to see the current choices.";
    case "read":
      return "Could not load notification preferences. Please try again.";
    case "save":
      return "Your changes were not saved. Please try again.";
    case "invalid":
      return "These preferences could not be accepted.";
    case "permission":
      return "Check device notification permissions before enabling reminders.";
    case "rollback":
      return "Your preferences were saved, but device reminders still need updating.";
    case "device":
      return state.device === "applied"
        ? "The change could not be applied. Previous preferences were restored."
        : "Saved preferences and device reminders still need to be reconciled.";
    case "inactive":
    case "owner-changed":
      return "Notification preferences are unavailable for this session.";
    default:
      return null;
  }
}
const styles = StyleSheet.create({
  row: {
    minHeight: 64,
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    paddingVertical: 8,
  },
  copy: { flex: 1, minWidth: 0, gap: 4 },
});
