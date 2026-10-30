import { useEffect, useState, useSyncExternalStore } from "react";
import { View } from "react-native";
import {
  ActionButton,
  AsyncContent,
  ChoiceGroup,
  ProductText,
  SettingsSection,
} from "../../components/product-ui/index";
import {
  createSettingsWorkflow,
  type SettingsAdapter,
  type SettingsField,
} from "./settingsWorkflowController";

export type SettingsWorkflowProps = {
  /** Change when the owning account or adapter contract changes. Never reuse across owners. */
  scopeKey: string;
  title: string;
  description?: string;
  fields: readonly SettingsField[];
  adapter: SettingsAdapter;
  savedMessage?: string;
};

/** Explicit save keeps failure/reconciliation visible. Host owns durable storage and conflict handling. */
export function SettingsWorkflow(props: SettingsWorkflowProps) {
  return <SettingsWorkflowSession key={props.scopeKey} {...props} />;
}

function SettingsWorkflowSession({
  title,
  description,
  fields,
  adapter,
  savedMessage = "Settings saved.",
}: SettingsWorkflowProps) {
  // Configuration is fixed for this scope. Remount with a new scopeKey when changing its contract.
  const [controller] = useState(() =>
    createSettingsWorkflow({ fields, adapter }),
  );
  const state = useSyncExternalStore(
    controller.subscribe,
    controller.getSnapshot,
    controller.getSnapshot,
  );
  useEffect(() => {
    void controller.reload();
    return () => controller.cancel();
  }, [controller]);
  const blocked = state.status !== "ready";
  const uncertain = state.status === "uncertain";
  return (
    <SettingsSection title={title} description={description}>
      <AsyncContent
        status={
          state.status === "idle" || state.status === "loading"
            ? "loading"
            : state.status === "error"
              ? "error"
              : "ready"
        }
        loadingLabel="Loading saved settings"
        errorMessage="Saved settings could not be loaded. Your changes have been kept here."
        onRetry={() => controller.reload()}
      >
        {state.draft && (
          <View style={{ gap: 16 }}>
            {fields.map((field) => (
              <View key={field.id} style={{ gap: 4 }}>
                <ChoiceGroup
                  label={field.label}
                  options={field.options}
                  value={state.draft?.[field.id] ?? ""}
                  onChange={(value) => {
                    controller.edit(field.id, value);
                  }}
                  disabled={blocked}
                />
                {field.description && (
                  <ProductText variant="caption" tone="muted">
                    {field.description}
                  </ProductText>
                )}
              </View>
            ))}
            {state.error === "save" && (
              <ProductText accessibilityRole="alert" tone="danger">
                Settings were not saved. Your choices are still here; retry when
                ready.
              </ProductText>
            )}
            {uncertain && (
              <ProductText accessibilityRole="alert" tone="danger">
                The save outcome is unknown. Reload saved settings before making
                another change; your choices will be kept for comparison.
              </ProductText>
            )}
            {state.saved && (
              <ProductText accessibilityLiveRegion="polite">
                {savedMessage}
              </ProductText>
            )}
            {uncertain ? (
              <ActionButton
                label="Reload saved settings"
                onPress={() => controller.reload()}
              />
            ) : (
              <>
                <ActionButton
                  label={
                    state.error === "save"
                      ? "Retry saving settings"
                      : "Save settings"
                  }
                  onPress={() => controller.save()}
                  disabled={!state.dirty || blocked}
                  busy={state.status === "saving"}
                />
                {state.dirty && (
                  <ActionButton
                    label="Reset changes"
                    tone="secondary"
                    onPress={() => {
                      controller.reset();
                    }}
                    disabled={blocked}
                  />
                )}
              </>
            )}
          </View>
        )}
      </AsyncContent>
    </SettingsSection>
  );
}
