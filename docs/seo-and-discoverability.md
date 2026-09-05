# SEO and discoverability

Decide what belongs in search before choosing rendering and routing. SEO applies to public web content; a private app may need only public product/support pages. Native app-store discovery is a separate concern.

## Record the route policy

| Surface | Default decision | Acceptance check |
| --- | --- | --- |
| Public content | Indexable, useful content at a stable URL | Direct request returns the intended content and metadata |
| Account, personal data, token-bearing links | Exclude from sitemap; use auth where data is private, plus noindex as appropriate | Unauthorized requests expose no private data; inspect robots response |
| Preview/staging | Authentication or environment-wide noindex | Preview response cannot inherit production indexing policy |
| Removed/unknown URL | Appropriate redirect, 404, or 410 | Hosting does not silently serve a 200 app shell for every URL |

`robots.txt` controls crawling, not access or reliable exclusion from search. Crawlers must be able to fetch a page to see its `noindex`. Never treat metadata as a privacy boundary.

## Implementation choices

- Put production origin and public-route policy in central configuration. Generate sitemap and canonical URLs from the same policy.
- Prefer server-rendered or statically generated public content when search acquisition matters. Use the framework's metadata API when available; document a separate public site if a private/native app shell cannot meet the content needs.
- Give public pages a descriptive title, description, one intended canonical, language, and useful heading structure. Provide social preview metadata and an accessible, publicly fetchable share image in a format supported by target consumers.
- Use structured data only when it accurately describes visible content and the page qualifies. Do not invent ratings or guarantee rich results.
- Include only canonical, indexable public URLs in the sitemap. Use `lastmod` only when a meaningful content-change date is known; a deploy timestamp alone is not evidence of changed content.

## Verify after building and deploying

- Inspect a direct HTTP response for each route class, not just client navigation. Check content, metadata, status codes, redirects, canonical host, robots headers and sitemap agreement.
- Detect duplicate canonicals, placeholder domains, private URLs in the sitemap, and production accidentally inheriting preview noindex.
- Check the rendered page and social preview assets as well as the raw response. Use search-console tooling after launch when applicable.
- On framework or host migration, rerun this matrix against the new deployment. A verifier left in a retired client protects nothing in the active build.

References: [Google JavaScript SEO](https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics), [canonical URLs](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls), and [SEO fundamentals](https://developers.google.com/search/docs/fundamentals/get-started?hl=en). Recheck current framework documentation when implementing.
