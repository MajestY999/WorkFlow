import { helpArticles, helpCategories } from "../../shared/data/public-content";

export default defineEventHandler((event) => {
  const config = useRuntimeConfig(event);
  const requestUrl = getRequestURL(event);
  const siteUrl = String(config.public.siteUrl || requestUrl.origin).replace(
    /\/$/,
    "",
  );
  const paths = [
    "/",
    "/faq",
    "/help",
    "/articles",
    ...helpCategories.map((category) => `/help/${category.slug}`),
    ...helpArticles.map((article) => `/articles/${article.slug}`),
  ];
  const urls = paths
    .map((path) => `  <url><loc>${siteUrl}${path}</loc></url>`)
    .join("\n");
  setResponseHeader(event, "Content-Type", "application/xml; charset=utf-8");
  setResponseHeader(event, "Cache-Control", "public, max-age=3600");
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;
});
