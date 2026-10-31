import type { Metadata } from "next";
import { CartProvider } from "@/components/cart/cart-context";
import { CartDrawer } from "@/components/cart/cart-drawer";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { getCart } from "@/lib/cart/get-cart";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Everhem: everyday basics in natural fibres", template: "%s · Everhem" },
  description:
    "Tees, hoodies and knitwear in organic cotton, linen, merino and cashmere. A demo store built on the Shopify Storefront API.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://api.fontshare.com" />
        <link rel="preconnect" href="https://cdn.fontshare.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://api.fontshare.com/v2/css?f[]=roundo@400,500,600&display=swap"
        />
      </head>
      <body>
        {/* Not awaited: the cart streams in wherever it is read, and the rest stays static. */}
        <CartProvider cartPromise={getCart()}>
          <a
            href="#main"
            className="sr-only bg-ink px-4 py-2 text-ground focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50"
          >
            Skip to content
          </a>
          <Header />
          <main id="main">{children}</main>
          <Footer />
          <CartDrawer />
        </CartProvider>
      </body>
    </html>
  );
}
