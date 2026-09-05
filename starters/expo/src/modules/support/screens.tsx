import { Linking } from 'react-native';
import { brand } from '@/config/app';
import { Button, Card, Screen, Text } from '@/components/ui';
export function SupportScreen() {
  return (
    <Screen title="Help & information" description={brand.description} publicPath="/support">
      <Card>
        <Text variant="heading">About your space</Text>
        <Text>
          You can create, edit and find notes without an account or internet connection once the app
          is loaded. Notes are stored on this device only.
        </Text>
        <Text>
          To remove a note, open it and choose Delete note. Clearing the app’s storage removes all
          local notes and settings.
        </Text>
        <Text>
          Keep an independent copy of important information. Web pages need a connection to load
          again; this shell does not install an offline service worker.
        </Text>
        {brand.supportEmail ? (
          <Button
            label="Contact support"
            onPress={() => {
              void Linking.openURL(`mailto:${brand.supportEmail}`);
            }}
          />
        ) : null}
      </Card>
    </Screen>
  );
}
