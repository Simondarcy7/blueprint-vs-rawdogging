import { router } from 'expo-router';
import { Screen, Notice } from '@/components/ui';
export default function NotFound() {
  return (
    <Screen title="Page not found">
      <Notice
        title="Let’s get you back"
        message="This address doesn’t lead to a page."
        action="Go home"
        onAction={() => router.replace('/')}
      />
    </Screen>
  );
}
