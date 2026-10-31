import type { Color } from "../src/catalog/types.ts";

const palette: Color[] = [
  { name: "White", code: "WHT", hex: "#F5F4F0" },
  { name: "Black", code: "BLK", hex: "#1C1C1C" },
  { name: "Heather Grey", code: "HGR", hex: "#B5B5B2" },
  { name: "Ecru", code: "ECR", hex: "#E9E1D1" },
  { name: "Washed Black", code: "WBK", hex: "#3A3A3A" },
  { name: "Navy", code: "NVY", hex: "#1F2A44" },
  { name: "Off-White", code: "OWH", hex: "#EFEBE3" },
  { name: "Olive", code: "OLV", hex: "#6B6B47" },
  { name: "Sand", code: "SND", hex: "#D8C7A8" },
  { name: "Sage", code: "SGE", hex: "#A3B09A" },
  { name: "Charcoal", code: "CHR", hex: "#3F4246" },
  { name: "Forest", code: "FRS", hex: "#2F4A3A" },
  { name: "Oatmeal", code: "OAT", hex: "#D9CFBF" },
  { name: "Stone", code: "STN", hex: "#BEB6A8" },
  { name: "Dusty Blue", code: "DBL", hex: "#8A9DB0" },
  { name: "Camel", code: "CML", hex: "#B98A5A" },
  { name: "Cream", code: "CRM", hex: "#F1E8D6" },
  { name: "Moss", code: "MOS", hex: "#5E6B43" },
  { name: "Chocolate", code: "CHO", hex: "#5A3E2E" },
];

export const colors: ReadonlyMap<string, Color> = new Map(palette.map((c) => [c.name, c]));
