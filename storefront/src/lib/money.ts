export interface Money {
  amount: string;
  currencyCode: string;
}

/** 79 zł, or 79,50 zł when there are cents. Polish formatting, since the store sells in PLN. */
export function formatMoney({ amount, currencyCode }: Money): string {
  const value = Number(amount);
  return new Intl.NumberFormat("pl-PL", {
    style: "currency",
    currency: currencyCode,
    minimumFractionDigits: Number.isInteger(value) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(value);
}

/** A compare-at price only means a sale when it is higher than the price. */
export function isOnSale(price: Money, compareAt: Money | null | undefined): compareAt is Money {
  return !!compareAt && Number(compareAt.amount) > Number(price.amount);
}

/** The lowest of several prices, for "from 79 zł". Assumes one currency, as the store has. */
export function lowestPrice(prices: readonly Money[]): Money | undefined {
  return prices.reduce<Money | undefined>(
    (lowest, price) => (!lowest || Number(price.amount) < Number(lowest.amount) ? price : lowest),
    undefined,
  );
}
