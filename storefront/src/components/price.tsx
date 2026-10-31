import { formatMoney, isOnSale, type Money } from "@/lib/money";

interface PriceProps {
  price: Money;
  compareAt?: Money | null;
  className?: string;
}

export function Price({ price, compareAt, className }: PriceProps) {
  if (!isOnSale(price, compareAt)) return <p className={className}>{formatMoney(price)}</p>;

  return (
    <p className={className}>
      <span className="sr-only">Sale price </span>
      {formatMoney(price)}{" "}
      <del className="text-muted">
        <span className="sr-only">was </span>
        {formatMoney(compareAt)}
      </del>
    </p>
  );
}
