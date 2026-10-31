import Image from "next/image";

type Picture = { url: string; altText?: string | null };

const WOOL_CARE = [
  "Hand wash cold or use a wool cycle",
  "Dry flat, away from direct heat",
  "Do not tumble dry",
  "Steam to refresh between wears",
];

/**
 * What the garments are made of, as a board of unlike tiles. The copy restates the catalogue:
 * fabric weights, descriptions and care steps from seed/catalog/products.ts.
 */
export function Mosaic({ pictures }: { pictures: readonly [Picture, Picture] }) {
  const [large, wide] = pictures;

  return (
    <section
      aria-labelledby="mosaic-title"
      className="mt-section grid grid-cols-2 gap-1.5 px-gutter lg:grid-cols-12 lg:grid-rows-[repeat(8,6rem)] lg:gap-2"
    >
      <h2
        id="mosaic-title"
        className="rise col-span-2 bg-surface p-6 text-head font-medium lg:col-span-6 lg:col-start-7 lg:row-span-3 lg:row-start-1"
      >
        Made for years, not a season
      </h2>

      <Tile className="col-span-2 aspect-[4/5] bg-oatmeal lg:col-span-6 lg:col-start-1 lg:row-span-5 lg:row-start-1 lg:aspect-auto">
        <Image
          src={large.url}
          alt={large.altText ?? ""}
          fill
          sizes="(min-width: 1024px) 50vw, 100vw"
          className="object-cover mix-blend-multiply"
        />
      </Tile>

      <Tile className="aspect-square bg-ink p-6 text-ground lg:col-span-3 lg:col-start-7 lg:row-span-2 lg:row-start-4 lg:aspect-auto">
        <p className="text-head font-medium tabular-nums">460 g/m²</p>
        <p className="mt-2 text-small">
          The fleece of our Heavyweight Oversized Hoodie, the heaviest fabric we use.
        </p>
      </Tile>

      <Tile className="aspect-square bg-sage p-6 lg:col-span-3 lg:col-start-10 lg:row-span-2 lg:row-start-4 lg:aspect-auto">
        <p className="md:text-lead">Pre-washed jersey that keeps its shape and size.</p>
      </Tile>

      <Tile className="col-span-2 bg-ecru p-6 md:col-span-1 lg:col-span-3 lg:col-start-1 lg:row-span-3 lg:row-start-6">
        <p className="text-lead">Hoodies in soft fleece and French terry, with no logos.</p>
      </Tile>

      <Tile className="col-span-2 bg-surface p-6 md:col-span-1 lg:col-span-3 lg:col-start-4 lg:row-span-3 lg:row-start-6">
        <h3 className="font-medium">Caring for wool</h3>
        <ul className="mt-2">
          {WOOL_CARE.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ul>
      </Tile>

      <Tile className="col-span-2 aspect-[16/10] bg-stone lg:col-span-6 lg:col-start-7 lg:row-span-3 lg:row-start-6 lg:aspect-auto">
        <Image
          src={wide.url}
          alt={wide.altText ?? ""}
          fill
          sizes="(min-width: 1024px) 50vw, 100vw"
          className="object-cover object-[50%_35%] mix-blend-multiply"
        />
      </Tile>
    </section>
  );
}

function Tile({ className, children }: { className: string; children: React.ReactNode }) {
  return <div className={`rise relative overflow-hidden ${className}`}>{children}</div>;
}
