import type { PropsWithChildren } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
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
  const { colors, dark } = useTheme();
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
        <View
          role="main"
          style={{ width: '100%', maxWidth: tokens.width.content, gap: tokens.space.lg }}
        >
          <View style={{ gap: 8 }}>
            <Text variant="title" role="heading" aria-level={1}>
              {title}
            </Text>
            {description ? <Text muted>{description}</Text> : null}
          </View>
          {children}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
