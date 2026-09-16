export type PublicPage = Readonly<{ path: string; title: string; description: string }>;
export type SeoPolicy = Readonly<{ productionOrigin: string; environment: 'production' | 'preview' | 'development'; pages: readonly PublicPage[] }>;

function canonical(origin: string, path: string) {
  const base = new URL(origin);
  if (base.protocol !== 'https:' || base.username || base.password || base.pathname !== '/' || base.search || base.hash) {
    throw new Error('SEO requires a credential-free HTTPS production origin');
  }
  // Allow plain, canonical route paths only; no queries, tokens, traversal or encoded separators.
  if (!/^\/(?:[a-zA-Z0-9_-]+\/?)*$/.test(path)) throw new Error('Invalid canonical path');
  return new URL(path, base).href;
}
export function pageMetadata(policy: SeoPolicy, path: string) {
  const page = policy.pages.find(item => item.path === path);
  if (!page || policy.environment !== 'production') return { robots: 'noindex, nofollow' as const };
  if (!page.title.trim() || !page.description.trim()) throw new Error('Public pages need title and description');
  return { ...page, canonical: canonical(policy.productionOrigin, path), robots: 'index, follow' as const };
}
export function sitemapUrls(policy: SeoPolicy): string[] {
  if (policy.environment !== 'production') return [];
  return [...new Set(policy.pages.map(page => canonical(policy.productionOrigin, page.path)))];
}
