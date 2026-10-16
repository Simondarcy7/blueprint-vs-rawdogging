import { useEffect, useRef, useState, type PropsWithChildren } from 'react';
import { Animated, KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Head from 'expo-router/head';
import { brand } from '@/config/app';
import { env } from '@/config/env';
import { useTheme } from '@/theme/ThemeProvider';
import { tokens } from '@/theme/tokens';
import { Text } from './Text';
export function Screen({
  children,
  title,
  description,
  publicPath,
}: PropsWithChildren<{ title: string; description?: string; publicPath?: string }>) {
  const { colors, dark, reducedMotion } = useTheme();
  const [opacity] = useState(() => new Animated.Value(1));
  const previousTitle = useRef<string | null>(null);
  useEffect(() => {
    opacity.stopAnimation();
    const changed = previousTitle.current !== title;
    previousTitle.current = title;
    opacity.setValue(reducedMotion || !changed ? 1 : 0.88);
    if (!reducedMotion && changed)
      Animated.timing(opacity, {
        toValue: 1,
        duration: 140,
        useNativeDriver: Platform.OS !== 'web',
      }).start();
    return () => opacity.stopAnimation();
  }, [title, reducedMotion, opacity]);
  const insets = useSafeAreaInsets();
  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={88}
    >
      <Head>
        <title>
          {title} · {brand.name}
        </title>
        <meta name="description" content={description ?? brand.description} />
        <meta
          name="robots"
          content={
            publicPath && env.name === 'production' && env.siteUrl
              ? 'index,follow'
              : 'noindex,nofollow'
          }
        />
        {publicPath && env.siteUrl ? (
          <link rel="canonical" href={`${env.siteUrl}${publicPath}`} />
        ) : null}
        <meta name="theme-color" content={dark ? brand.dark.background : brand.light.background} />
      </Head>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          padding: tokens.space.lg,
          paddingBottom: Math.max(insets.bottom, tokens.space.lg) + 24,
          alignItems: 'center',
          flexGrow: 1,
        }}
      >
        <Animated.View
          role="main"
          style={{ width: '100%', maxWidth: tokens.width.content, gap: tokens.space.lg, opacity }}
        >
          <View style={{ gap: 8 }}>
            <Text variant="title" role="heading" aria-level={1}>
              {title}
            </Text>
            {description ? <Text muted>{description}</Text> : null}
          </View>
          {children}
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
