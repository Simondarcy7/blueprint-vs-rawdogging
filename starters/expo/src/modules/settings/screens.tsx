import { Link } from 'expo-router';
import { Pressable } from 'react-native';
import { ChoiceGroup, Card, Notice, Screen, Text } from '@/components/ui';
import { useTheme } from '@/theme/ThemeProvider';
import { brand, appVersion } from '@/config/app';
export function SettingsScreen() {
  const theme = useTheme();
  return (
    <Screen title="Settings" description="Make this space feel like yours.">
      <Card>
        <Text variant="heading" accessibilityRole="header">
          Appearance
        </Text>
        <Text muted>Follow your device, or choose your own look.</Text>
        <ChoiceGroup
          label="Appearance"
          value={theme.preference}
          options={[
            { value: 'system', label: 'System' },
            { value: 'light', label: 'Light' },
            { value: 'dark', label: 'Dark' },
          ]}
          disabled={!theme.ready || theme.pending}
          onChange={(value) => {
            void theme.setPreference(value);
          }}
        />
        {theme.error ? <Notice error title="Preference not saved" message={theme.error} /> : null}
      </Card>
      <Card>
        <Text variant="heading" accessibilityRole="header">
          Your data
        </Text>
        <Text muted>
          Notes stay on this device or browser. There is no account or cloud backup. Clearing app or
          browser storage removes them.
        </Text>
        <Text muted>This starter sends no product analytics or crash reports.</Text>
      </Card>
      <Card>
        <Text variant="heading" accessibilityRole="header">
          About {brand.name}
        </Text>
        <Link href="/support" asChild>
          <Pressable accessibilityRole="link" style={{ minHeight: 48, justifyContent: 'center' }}>
            <Text>Help & information →</Text>
          </Pressable>
        </Link>
        <Text variant="small" muted>
          Version {appVersion}
        </Text>
      </Card>
    </Screen>
  );
}
