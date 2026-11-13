export default defineEventHandler((event) => {
  const config = useRuntimeConfig(event);
  const requestUrl = getRequestURL(event);
  const siteUrl = String(config.public.siteUrl || requestUrl.origin).replace(
    /\/$/,
    "",
  );
  setResponseHeader(event, "Content-Type", "text/plain; charset=utf-8");
  setResponseHeader(event, "Cache-Control", "public, max-age=3600");
  return `User-agent: *
Allow: /
Disallow: /admin
Disallow: /dashboard
Disallow: /profile
Disallow: /login
Disallow: /register
Disallow: /requests
Disallow: /api/
Sitemap: ${siteUrl}/sitemap.xml
`;
});
