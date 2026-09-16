import type { PropsWithChildren } from 'react';
import { View } from 'react-native';
export function RouteAccessibility({ children, focused }: PropsWithChildren<{ focused: boolean }>) {
  return <View style={{ flex: 1 }} accessibilityElementsHidden={!focused} importantForAccessibility={focused ? 'auto' : 'no-hide-descendants'}>{children}</View>;
}
