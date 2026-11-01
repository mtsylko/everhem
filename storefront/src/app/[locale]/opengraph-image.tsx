import { SHARE_IMAGE_SIZE, shareImage } from "@/components/share/share-image";
import { dictionaryFor } from "@/i18n/dictionaries";
import { formatPlural } from "@/i18n/format";
import { DEFAULT_LOCALE, hasLocale } from "@/i18n/locales";
import { ALL_COLLECTION, getCollectionPreview } from "@/lib/shopify/catalog";

// The home page's shared image, and the one every page without its own falls back to.

export function generateImageMetadata({ params }: { params: { locale: string } }) {
  const { meta } = dictionaryFor(hasLocale(params.locale) ? params.locale : DEFAULT_LOCALE);
  return [{ id: "card", alt: meta.title, size: SHARE_IMAGE_SIZE, contentType: "image/png" }];
}

export default async function Image({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!hasLocale(locale)) return new Response(null, { status: 404 });
  const { home } = dictionaryFor(locale);
  const products = (await getCollectionPreview(ALL_COLLECTION, locale))?.products.nodes ?? [];
  return shareImage({
    title: home.heroTitle,
    caption: formatPlural(locale, home.catalogueTitle, products.length),
    products,
  });
}
