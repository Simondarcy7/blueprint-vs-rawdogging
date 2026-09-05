const name = process.env.EXPO_PUBLIC_APP_ENV ?? 'development';
if (!['development', 'preview', 'production'].includes(name))
  throw new Error('Invalid EXPO_PUBLIC_APP_ENV.');
const rawUrl = process.env.EXPO_PUBLIC_SITE_URL;
if (
  rawUrl &&
  (new URL(rawUrl).protocol !== 'https:' ||
    new URL(rawUrl).username ||
    new URL(rawUrl).password ||
    new URL(rawUrl).pathname !== '/' ||
    new URL(rawUrl).search ||
    new URL(rawUrl).hash)
) {
  throw new Error(
    'EXPO_PUBLIC_SITE_URL must be an HTTPS origin without credentials, paths or queries.',
  );
}
export const env = { name, siteUrl: rawUrl ? new URL(rawUrl).origin : undefined };

export const showGallery = process.env.EXPO_PUBLIC_SHOW_GALLERY === 'true';
