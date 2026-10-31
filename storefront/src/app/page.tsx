import { Catalogue } from "@/components/catalogue";
import { ColourFinder } from "@/components/home/colour-finder";
import { Hero } from "@/components/home/hero";
import { Mosaic } from "@/components/home/mosaic";
import { groupByColour } from "@/lib/product/colours";
import { getColourIndex, getCollections, getProducts } from "@/lib/shopify/catalog";

const COLOURS_SHOWN = 6;

export default async function Home() {
  const [products, collections, colourIndex] = await Promise.all([
    getProducts(),
    getCollections(),
    getColourIndex(),
  ]);

  const images = products.flatMap((product) => product.images.nodes);
  const backViews = images.filter((image) => image.altText?.endsWith("back view"));
  const mosaicPictures = [backViews[0] ?? images[0], backViews[1] ?? images[1]] as const;

  return (
    <>
      <Hero images={images} collections={collections} />

      <section id="catalogue" aria-labelledby="catalogue-title" className="px-gutter pt-section">
        <div className="mb-10 grid gap-4 lg:grid-cols-12 lg:gap-2">
          <h2 id="catalogue-title" className="rise text-head font-medium lg:col-span-6">
            All {products.length} basics
          </h2>
          <p className="rise max-w-[40ch] self-end lg:col-span-4 lg:col-start-9">
            Tees, hoodies and knits in sizes XS to XL. Each one is shown in its first colour; the
            others are on its page.
          </p>
        </div>
        <Catalogue products={products} />
      </section>

      <ColourFinder colours={groupByColour(colourIndex).slice(0, COLOURS_SHOWN)} />

      {mosaicPictures[0] && mosaicPictures[1] && (
        <Mosaic pictures={[mosaicPictures[0], mosaicPictures[1]]} />
      )}
    </>
  );
}
