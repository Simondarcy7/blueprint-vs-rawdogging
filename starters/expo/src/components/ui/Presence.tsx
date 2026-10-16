import { useEffect, useState, type PropsWithChildren } from 'react';
import { Animated, Platform, type StyleProp, type ViewStyle } from 'react-native';

export function Presence({
  visible,
  reducedMotion = true,
  children,
  style,
}: PropsWithChildren<{
  visible: boolean;
  reducedMotion?: boolean;
  style?: StyleProp<ViewStyle>;
}>) {
  const [present, setPresent] = useState(visible);
  const [progress] = useState(() => new Animated.Value(visible ? 1 : 0));
  if (visible && !present) setPresent(true);
  useEffect(() => {
    let active = true;
    progress.stopAnimation();
    const finish = () => {
      if (active && !visible) setPresent(false);
    };
    if (reducedMotion) {
      progress.setValue(visible ? 1 : 0);
      queueMicrotask(finish);
    } else {
      Animated.timing(progress, {
        toValue: visible ? 1 : 0,
        duration: visible ? 140 : 100,
        useNativeDriver: Platform.OS !== 'web',
      }).start(({ finished }) => {
        if (finished) finish();
      });
    }
    return () => {
      active = false;
      progress.stopAnimation();
    };
  }, [visible, reducedMotion, progress]);
  if (!visible && !present) return null;
  return (
    <Animated.View
      {...(Platform.OS === 'web' ? { inert: !visible } : {})}
      pointerEvents={visible ? 'auto' : 'none'}
      aria-hidden={!visible}
      accessibilityElementsHidden={!visible}
      importantForAccessibility={visible ? 'auto' : 'no-hide-descendants'}
      style={[style, { opacity: progress }]}
    >
      {children}
    </Animated.View>
  );
}
