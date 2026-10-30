import { useEffect, useState, useSyncExternalStore } from "react";
import { View } from "react-native";
import {
  ActionButton,
  AsyncContent,
  ChoiceGroup,
  FormField,
  ProductText,
  SettingsSection,
} from "../../components/product-ui/index";
import type { createAccountRecovery } from "../../services/account-recovery/accountRecovery";

export type AccountRecoveryController = ReturnType<
  typeof createAccountRecovery
>;
export type AccountRecoveryPanelProps = {
  /** Bind a controller to one owner/session. A new scope must receive a new controller. */
  scopeKey: string;
  controller: AccountRecoveryController | null;
  title?: string;
  unavailableMessage?: string;
  destinationLabel?: string;
  proofLabel?: string;
};

/** Challenge-based account settings. Email-link providers should retain their own callback flow. */
export function AccountRecoveryPanel(props: AccountRecoveryPanelProps) {
  if (!props.controller)
    return (
      <SettingsSection title={props.title ?? "Account recovery"}>
        <ProductText>
          {props.unavailableMessage ??
            "Account recovery is not available in this app yet."}
        </ProductText>
      </SettingsSection>
    );
  return (
    <RecoverySession
      key={props.scopeKey}
      {...props}
      controller={props.controller}
    />
  );
}

function RecoverySession({
  controller,
  title = "Account recovery",
  destinationLabel = "Recovery destination",
  proofLabel = "Verification code",
}: AccountRecoveryPanelProps & { controller: AccountRecoveryController }) {
  const state = useSyncExternalStore(
    controller.subscribe,
    controller.getSnapshot,
    controller.getSnapshot,
  );
  const [destination, setDestination] = useState("");
  const [proof, setProof] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const [resultMessage, setResultMessage] = useState("");
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    void controller.refresh();
    return () => {
      controller.cancel();
    };
  }, [controller]);
  useEffect(() => {
    const tick = () => {
      const current = Date.now();
      setNow(current);
      if (current >= state.retryAt) clearInterval(timer);
    };
    // Refresh an externally changed cooldown on the next timer turn, then stop at expiry.
    const immediate = setTimeout(tick, 0);
    const timer = setInterval(tick, 1000);
    return () => {
      clearTimeout(immediate);
      clearInterval(timer);
    };
  }, [state.retryAt]);
  const choices = state.account?.destinations ?? [];
  const chosen = choices.some((choice) => choice.id === selectedId)
    ? selectedId
    : (choices[0]?.id ?? "");
  const ready = state.status === "ready" && !state.busy;
  const cooldown = Math.max(0, Math.ceil((state.retryAt - now) / 1000));
  async function request() {
    setResultMessage("");
    const result = await controller.request(destination.trim());
    if (result.current) setNow(Date.now());
    if (result.current && result.status !== "accepted")
      setResultMessage(
        result.status === "cooldown"
          ? "Please wait before requesting another code."
          : "The request was not accepted. Check the destination or refresh recovery status.",
      );
  }
  async function verify() {
    const submitted = proof;
    setProof("");
    setResultMessage("");
    const result = await controller.verify(chosen, submitted);
    if (result.current && result.status !== "accepted")
      setResultMessage(
        result.status === "expired"
          ? "This code has expired. Request a new code."
          : "Verification was not accepted. Check the code or refresh recovery status.",
      );
  }
  return (
    <SettingsSection
      title={title}
      description="Manage the recovery methods supported by your account provider."
    >
      <AsyncContent
        status={
          state.status === "idle" || state.status === "loading"
            ? "loading"
            : "ready"
        }
        loadingLabel="Loading account recovery"
      >
        <View style={{ gap: 16 }}>
          {state.acknowledged && (
            <ProductText accessibilityLiveRegion="polite">
              {state.acknowledged === "request"
                ? "The provider accepted your recovery request."
                : "The provider accepted verification."}
            </ProductText>
          )}
          {state.error && (
            <ProductText accessibilityRole="alert" tone="danger">
              {state.error === "unknown"
                ? "The provider outcome is unknown. Refresh status before retrying."
                : state.error === "owner-changed"
                  ? "The account changed. Reopen recovery for the current account."
                  : state.error === "read"
                    ? "Recovery status could not be refreshed. An accepted request may still have completed."
                    : "The provider did not accept that action."}
            </ProductText>
          )}
          {resultMessage && (
            <ProductText accessibilityRole="alert" tone="danger">
              {resultMessage}
            </ProductText>
          )}
          <FormField
            label={destinationLabel}
            value={destination}
            onChangeText={setDestination}
            autoCapitalize="none"
            autoCorrect={false}
            maxLength={320}
            editable={ready}
          />
          <ActionButton
            label={
              cooldown
                ? `Request another code in ${cooldown}s`
                : "Request recovery code"
            }
            onPress={request}
            disabled={!ready || !destination.trim() || cooldown > 0}
            busy={state.status === "requesting"}
          />
          {state.account?.pending && choices.length > 0 && (
            <>
              <ChoiceGroup
                label="Recovery method"
                options={choices.map((choice) => ({
                  value: choice.id,
                  label: choice.label,
                }))}
                value={chosen}
                onChange={setSelectedId}
                disabled={!ready}
              />
              <FormField
                label={proofLabel}
                value={proof}
                onChangeText={setProof}
                autoCapitalize="none"
                autoCorrect={false}
                secureTextEntry
                maxLength={2048}
                editable={ready}
              />
              <ActionButton
                label="Verify recovery code"
                onPress={verify}
                disabled={!ready || !chosen || !proof.trim()}
                busy={state.status === "verifying"}
              />
            </>
          )}
          <ActionButton
            label="Refresh recovery status"
            tone="secondary"
            onPress={() => controller.refresh()}
            disabled={
              state.busy ||
              state.status === "stale" ||
              state.status === "disposed"
            }
          />
        </View>
      </AsyncContent>
    </SettingsSection>
  );
}
