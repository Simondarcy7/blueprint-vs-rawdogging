import { useEffect, useRef, type ReactNode } from 'react';
import { Animated } from 'react-native';

/** Content is mounted immediately; animation never controls data readiness or interaction. */
export function ContentTransition({ children, reducedMotion = true, transitionKey }: {
  children: ReactNode; reducedMotion?: boolean; transitionKey: string;
}) {
  const opacity = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    opacity.stopAnimation();
    if (reducedMotion) { opacity.setValue(1); return; }
    opacity.setValue(0.8);
    const animation = Animated.timing(opacity, { toValue: 1, duration: 140, useNativeDriver: true });
    animation.start();
    return () => { animation.stop(); opacity.setValue(1); };
  }, [opacity, reducedMotion, transitionKey]);
  return <Animated.View style={{ opacity }}>{children}</Animated.View>;
}
