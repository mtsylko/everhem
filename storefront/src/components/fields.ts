/** The flat colours specimens sit on, in the order they rotate through a grid. */
const FIELDS = ["bg-ecru", "bg-oatmeal", "bg-stone", "bg-sage"] as const;

export function fieldFor(index: number): string {
  return FIELDS[index % FIELDS.length]!;
}
