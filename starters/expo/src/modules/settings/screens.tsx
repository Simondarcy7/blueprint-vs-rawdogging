import { SettingsSection, ChoiceGroup } from '@/foundation/blueprint-shell/components/product-ui';
import { Link } from 'expo-router';
import { Pressable } from 'react-native';
import { Notice, Presence, Screen, Text } from '@/components/ui';
import { useTheme } from '@/theme/ThemeProvider';
import { brand, appVersion } from '@/config/app';
export function SettingsScreen() {
  const theme = useTheme();
  return (
    <Screen title="Settings" description="Make this space feel like yours.">
      <SettingsSection title="Appearance">
        <Text muted>Follow your device, or choose your own look.</Text>
        <ChoiceGroup
          label="Appearance"
          value={theme.preference}
          options={[
            { value: 'system', label: 'System' },
            { value: 'light', label: 'Light' },
            { value: 'dark', label: 'Dark' },
          ]}
          disabled={!theme.writable || theme.pending}
          onChange={(value) => {
            if (value === 'system' || value === 'light' || value === 'dark')
              void theme.setPreference(value);
          }}
        />
        <Presence visible={!!theme.error} reducedMotion={theme.reducedMotion}>
          <Notice
            error
            title="Preference unavailable"
            message={theme.error ?? 'Please retry your preference change.'}
            action={!theme.writable ? 'Retry loading preferences' : undefined}
            onAction={() => {
              void theme.retryLoad();
            }}
          />
        </Presence>
      </SettingsSection>
      <SettingsSection title="Motion">
        <Text muted>
          Follow your device or reduce motion further. Your device’s reduced-motion setting always
          takes priority.
        </Text>
        <ChoiceGroup
          label="Motion"
          value={theme.motion}
          options={[
            { value: 'system', label: 'Follow device' },
            { value: 'reduced', label: 'Reduce motion' },
          ]}
          disabled={!theme.writable || theme.pending}
          onChange={(value) => {
            if (value === 'system' || value === 'reduced') void theme.setMotion(value);
          }}
        />
      </SettingsSection>
      <SettingsSection title="Your data">
        <Text muted>
          Notes stay on this device or browser. There is no account or cloud backup. Clearing app or
          browser storage removes them.
        </Text>
        <Text muted>This starter sends no product analytics or crash reports.</Text>
      </SettingsSection>
      <SettingsSection title={`About ${brand.name}`}>
        <Link href="/support" asChild>
          <Pressable accessibilityRole="link" style={{ minHeight: 48, justifyContent: 'center' }}>
            <Text>Help & information →</Text>
          </Pressable>
        </Link>
        <Text variant="small" muted>
          Version {appVersion}
        </Text>
      </SettingsSection>
    </Screen>
  );
}
