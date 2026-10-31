import type { Color } from "../src/catalog/types.ts";

const palette: Color[] = [
  { name: "White", code: "WHT", hex: "#F5F4F0", translations: { pl: "Biały" } },
  { name: "Black", code: "BLK", hex: "#1C1C1C", translations: { pl: "Czarny" } },
  { name: "Heather Grey", code: "HGR", hex: "#B5B5B2", translations: { pl: "Szary melanż" } },
  { name: "Ecru", code: "ECR", hex: "#E9E1D1", translations: { pl: "Ecru" } },
  { name: "Washed Black", code: "WBK", hex: "#3A3A3A", translations: { pl: "Sprany czarny" } },
  { name: "Navy", code: "NVY", hex: "#1F2A44", translations: { pl: "Granatowy" } },
  { name: "Off-White", code: "OWH", hex: "#EFEBE3", translations: { pl: "Złamana biel" } },
  { name: "Olive", code: "OLV", hex: "#6B6B47", translations: { pl: "Oliwkowy" } },
  { name: "Sand", code: "SND", hex: "#D8C7A8", translations: { pl: "Piaskowy" } },
  { name: "Sage", code: "SGE", hex: "#A3B09A", translations: { pl: "Szałwiowy" } },
  { name: "Charcoal", code: "CHR", hex: "#3F4246", translations: { pl: "Grafitowy" } },
  { name: "Forest", code: "FRS", hex: "#2F4A3A", translations: { pl: "Leśna zieleń" } },
  { name: "Oatmeal", code: "OAT", hex: "#D9CFBF", translations: { pl: "Owsiany" } },
  { name: "Stone", code: "STN", hex: "#BEB6A8", translations: { pl: "Kamienny" } },
  { name: "Dusty Blue", code: "DBL", hex: "#8A9DB0", translations: { pl: "Pudrowy błękit" } },
  { name: "Camel", code: "CML", hex: "#B98A5A", translations: { pl: "Karmelowy" } },
  { name: "Cream", code: "CRM", hex: "#F1E8D6", translations: { pl: "Kremowy" } },
  { name: "Moss", code: "MOS", hex: "#5E6B43", translations: { pl: "Zieleń mchu" } },
  { name: "Chocolate", code: "CHO", hex: "#5A3E2E", translations: { pl: "Czekoladowy" } },
];

export const colors: ReadonlyMap<string, Color> = new Map(palette.map((c) => [c.name, c]));
