import { getDictionary } from "@/i18n/server";
import { formatMoney, isOnSale, type Money } from "@/lib/money";

interface PriceProps {
  price: Money;
  compareAt?: Money | null;
  className?: string;
}

export async function Price({ price, compareAt, className }: PriceProps) {
  if (!isOnSale(price, compareAt)) return <p className={className}>{formatMoney(price)}</p>;

  const { product } = await getDictionary();
  return (
    <p className={className}>
      <span className="sr-only">{product.salePrice} </span>
      {formatMoney(price)}{" "}
      <del className="text-muted">
        <span className="sr-only">{product.was} </span>
        {formatMoney(compareAt)}
      </del>
    </p>
  );
}
