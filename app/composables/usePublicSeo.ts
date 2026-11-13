export function usePublicSeo(title: string, description: string, noindex = false) {
  const config = useRuntimeConfig();
  const requestUrl = useRequestURL();
  const origin = String(config.public.siteUrl || requestUrl.origin).replace(
    /\/$/,
    "",
  );
  const canonical = `${origin}${requestUrl.pathname}`;

  useSeoMeta({
    title,
    description,
    ogTitle: title,
    ogDescription: description,
    ogType: "website",
    ogUrl: canonical,
    robots: noindex ? "noindex, nofollow" : "index, follow",
  });
  useHead({ link: [{ rel: "canonical", href: canonical }] });
}
