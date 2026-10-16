import { router } from 'expo-router';
import { View } from 'react-native';
import Feather from '@expo/vector-icons/Feather';
import { brand } from '@/config/app';
import { useTheme } from '@/theme/ThemeProvider';
import { Button, Card, Screen, Text } from '@/components/ui';
import { RecentNotes } from '@/modules/notes';
export function HomeScreen() {
  const { colors } = useTheme();
  return (
    <Screen title="Your space" description="Small thoughts. Fresh possibilities.">
      <Card
        style={{ backgroundColor: colors.tint, borderColor: colors.tint, padding: 32, gap: 24 }}
      >
        <View
          style={{
            width: 52,
            height: 52,
            borderRadius: 16,
            backgroundColor: colors.surface,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Feather
            aria-hidden={true}
            name="sun"
            size={26}
            color={colors.accent}
            accessible={false}
          />
        </View>
        <Text variant="title" style={{ maxWidth: 560 }}>
          {brand.welcome}
        </Text>
        <Text style={{ maxWidth: 540 }}>{brand.subtitle}</Text>
        <View style={{ alignSelf: 'flex-start' }}>
          <Button label="Capture a thought" onPress={() => router.push('/note/new')} />
        </View>
      </Card>
      <View
        style={{
          flexDirection: 'row',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
        }}
      >
        <Text variant="heading" accessibilityRole="header">
          Recently saved
        </Text>
        <Button label="View all notes" variant="secondary" onPress={() => router.push('/notes')} />
      </View>
      <RecentNotes limit={3} />
    </Screen>
  );
}
