/* eslint-disable eslint-comments/disable-enable-pair */
/* eslint-disable eslint-comments/no-unlimited-disable */
/* eslint-disable */
import type * as StorefrontTypes from "./storefront.types.js";

export type CartQueryVariables = StorefrontTypes.Exact<{
  cartId: StorefrontTypes.Scalars["ID"]["input"];
}>;

export type CartQuery = {
  cart?: StorefrontTypes.Maybe<
    Pick<StorefrontTypes.Cart, "id" | "checkoutUrl" | "totalQuantity"> & {
      cost: { subtotalAmount: Pick<StorefrontTypes.MoneyV2, "amount" | "currencyCode"> };
      lines: {
        nodes: Array<
          | (Pick<StorefrontTypes.CartLine, "id" | "quantity"> & {
              cost: { totalAmount: Pick<StorefrontTypes.MoneyV2, "amount" | "currencyCode"> };
              merchandise: Pick<StorefrontTypes.ProductVariant, "id" | "availableForSale"> & {
                selectedOptions: Array<Pick<StorefrontTypes.SelectedOption, "name" | "value">>;
                image?: StorefrontTypes.Maybe<
                  Pick<StorefrontTypes.Image, "url" | "altText" | "width" | "height">
                >;
                product: Pick<StorefrontTypes.Product, "handle" | "title">;
              };
            })
          | (Pick<StorefrontTypes.ComponentizableCartLine, "id" | "quantity"> & {
              cost: { totalAmount: Pick<StorefrontTypes.MoneyV2, "amount" | "currencyCode"> };
              merchandise: Pick<StorefrontTypes.ProductVariant, "id" | "availableForSale"> & {
                selectedOptions: Array<Pick<StorefrontTypes.SelectedOption, "name" | "value">>;
                image?: StorefrontTypes.Maybe<
                  Pick<StorefrontTypes.Image, "url" | "altText" | "width" | "height">
                >;
                product: Pick<StorefrontTypes.Product, "handle" | "title">;
              };
            })
        >;
      };
    }
  >;
};

export type CartCreateMutationVariables = StorefrontTypes.Exact<{
  lines: Array<StorefrontTypes.CartLineInput> | StorefrontTypes.CartLineInput;
}>;

export type CartCreateMutation = {
  cartCreate?: StorefrontTypes.Maybe<{
    cart?: StorefrontTypes.Maybe<
      Pick<StorefrontTypes.Cart, "id" | "checkoutUrl" | "totalQuantity"> & {
        cost: { subtotalAmount: Pick<StorefrontTypes.MoneyV2, "amount" | "currencyCode"> };
        lines: {
          nodes: Array<
            | (Pick<StorefrontTypes.CartLine, "id" | "quantity"> & {
                cost: { totalAmount: Pick<StorefrontTypes.MoneyV2, "amount" | "currencyCode"> };
                merchandise: Pick<StorefrontTypes.ProductVariant, "id" | "availableForSale"> & {
                  selectedOptions: Array<Pick<StorefrontTypes.SelectedOption, "name" | "value">>;
                  image?: StorefrontTypes.Maybe<
                    Pick<StorefrontTypes.Image, "url" | "altText" | "width" | "height">
                  >;
                  product: Pick<StorefrontTypes.Product, "handle" | "title">;
                };
              })
            | (Pick<StorefrontTypes.ComponentizableCartLine, "id" | "quantity"> & {
                cost: { totalAmount: Pick<StorefrontTypes.MoneyV2, "amount" | "currencyCode"> };
                merchandise: Pick<StorefrontTypes.ProductVariant, "id" | "availableForSale"> & {
                  selectedOptions: Array<Pick<StorefrontTypes.SelectedOption, "name" | "value">>;
                  image?: StorefrontTypes.Maybe<
                    Pick<StorefrontTypes.Image, "url" | "altText" | "width" | "height">
                  >;
                  product: Pick<StorefrontTypes.Product, "handle" | "title">;
                };
              })
          >;
        };
      }
    >;
    userErrors: Array<Pick<StorefrontTypes.CartUserError, "message">>;
    warnings: Array<Pick<StorefrontTypes.CartWarning, "message">>;
  }>;
};

export type CartLinesAddMutationVariables = StorefrontTypes.Exact<{
  cartId: StorefrontTypes.Scalars["ID"]["input"];
  lines: Array<StorefrontTypes.CartLineInput> | StorefrontTypes.CartLineInput;
}>;

export type CartLinesAddMutation = {
  cartLinesAdd?: StorefrontTypes.Maybe<{
    cart?: StorefrontTypes.Maybe<
      Pick<StorefrontTypes.Cart, "id" | "checkoutUrl" | "totalQuantity"> & {
        cost: { subtotalAmount: Pick<StorefrontTypes.MoneyV2, "amount" | "currencyCode"> };
        lines: {
          nodes: Array<
            | (Pick<StorefrontTypes.CartLine, "id" | "quantity"> & {
                cost: { totalAmount: Pick<StorefrontTypes.MoneyV2, "amount" | "currencyCode"> };
                merchandise: Pick<StorefrontTypes.ProductVariant, "id" | "availableForSale"> & {
                  selectedOptions: Array<Pick<StorefrontTypes.SelectedOption, "name" | "value">>;
                  image?: StorefrontTypes.Maybe<
                    Pick<StorefrontTypes.Image, "url" | "altText" | "width" | "height">
                  >;
                  product: Pick<StorefrontTypes.Product, "handle" | "title">;
                };
              })
            | (Pick<StorefrontTypes.ComponentizableCartLine, "id" | "quantity"> & {
                cost: { totalAmount: Pick<StorefrontTypes.MoneyV2, "amount" | "currencyCode"> };
                merchandise: Pick<StorefrontTypes.ProductVariant, "id" | "availableForSale"> & {
                  selectedOptions: Array<Pick<StorefrontTypes.SelectedOption, "name" | "value">>;
                  image?: StorefrontTypes.Maybe<
                    Pick<StorefrontTypes.Image, "url" | "altText" | "width" | "height">
                  >;
                  product: Pick<StorefrontTypes.Product, "handle" | "title">;
                };
              })
          >;
        };
      }
    >;
    userErrors: Array<Pick<StorefrontTypes.CartUserError, "message">>;
    warnings: Array<Pick<StorefrontTypes.CartWarning, "message">>;
  }>;
};

export type CartLinesUpdateMutationVariables = StorefrontTypes.Exact<{
  cartId: StorefrontTypes.Scalars["ID"]["input"];
  lines: Array<StorefrontTypes.CartLineUpdateInput> | StorefrontTypes.CartLineUpdateInput;
}>;

export type CartLinesUpdateMutation = {
  cartLinesUpdate?: StorefrontTypes.Maybe<{
    cart?: StorefrontTypes.Maybe<
      Pick<StorefrontTypes.Cart, "id" | "checkoutUrl" | "totalQuantity"> & {
        cost: { subtotalAmount: Pick<StorefrontTypes.MoneyV2, "amount" | "currencyCode"> };
        lines: {
          nodes: Array<
            | (Pick<StorefrontTypes.CartLine, "id" | "quantity"> & {
                cost: { totalAmount: Pick<StorefrontTypes.MoneyV2, "amount" | "currencyCode"> };
                merchandise: Pick<StorefrontTypes.ProductVariant, "id" | "availableForSale"> & {
                  selectedOptions: Array<Pick<StorefrontTypes.SelectedOption, "name" | "value">>;
                  image?: StorefrontTypes.Maybe<
                    Pick<StorefrontTypes.Image, "url" | "altText" | "width" | "height">
                  >;
                  product: Pick<StorefrontTypes.Product, "handle" | "title">;
                };
              })
            | (Pick<StorefrontTypes.ComponentizableCartLine, "id" | "quantity"> & {
                cost: { totalAmount: Pick<StorefrontTypes.MoneyV2, "amount" | "currencyCode"> };
                merchandise: Pick<StorefrontTypes.ProductVariant, "id" | "availableForSale"> & {
                  selectedOptions: Array<Pick<StorefrontTypes.SelectedOption, "name" | "value">>;
                  image?: StorefrontTypes.Maybe<
                    Pick<StorefrontTypes.Image, "url" | "altText" | "width" | "height">
                  >;
                  product: Pick<StorefrontTypes.Product, "handle" | "title">;
                };
              })
          >;
        };
      }
    >;
    userErrors: Array<Pick<StorefrontTypes.CartUserError, "message">>;
    warnings: Array<Pick<StorefrontTypes.CartWarning, "message">>;
  }>;
};

export type CartLinesRemoveMutationVariables = StorefrontTypes.Exact<{
  cartId: StorefrontTypes.Scalars["ID"]["input"];
  lineIds: Array<StorefrontTypes.Scalars["ID"]["input"]> | StorefrontTypes.Scalars["ID"]["input"];
}>;

export type CartLinesRemoveMutation = {
  cartLinesRemove?: StorefrontTypes.Maybe<{
    cart?: StorefrontTypes.Maybe<
      Pick<StorefrontTypes.Cart, "id" | "checkoutUrl" | "totalQuantity"> & {
        cost: { subtotalAmount: Pick<StorefrontTypes.MoneyV2, "amount" | "currencyCode"> };
        lines: {
          nodes: Array<
            | (Pick<StorefrontTypes.CartLine, "id" | "quantity"> & {
                cost: { totalAmount: Pick<StorefrontTypes.MoneyV2, "amount" | "currencyCode"> };
                merchandise: Pick<StorefrontTypes.ProductVariant, "id" | "availableForSale"> & {
                  selectedOptions: Array<Pick<StorefrontTypes.SelectedOption, "name" | "value">>;
                  image?: StorefrontTypes.Maybe<
                    Pick<StorefrontTypes.Image, "url" | "altText" | "width" | "height">
                  >;
                  product: Pick<StorefrontTypes.Product, "handle" | "title">;
                };
              })
            | (Pick<StorefrontTypes.ComponentizableCartLine, "id" | "quantity"> & {
                cost: { totalAmount: Pick<StorefrontTypes.MoneyV2, "amount" | "currencyCode"> };
                merchandise: Pick<StorefrontTypes.ProductVariant, "id" | "availableForSale"> & {
                  selectedOptions: Array<Pick<StorefrontTypes.SelectedOption, "name" | "value">>;
                  image?: StorefrontTypes.Maybe<
                    Pick<StorefrontTypes.Image, "url" | "altText" | "width" | "height">
                  >;
                  product: Pick<StorefrontTypes.Product, "handle" | "title">;
                };
              })
          >;
        };
      }
    >;
    userErrors: Array<Pick<StorefrontTypes.CartUserError, "message">>;
    warnings: Array<Pick<StorefrontTypes.CartWarning, "message">>;
  }>;
};

export type CollectionsQueryVariables = StorefrontTypes.Exact<{ [key: string]: never }>;

export type CollectionsQuery = {
  collections: {
    nodes: Array<
      Pick<StorefrontTypes.Collection, "handle" | "title" | "description"> & {
        products: {
          nodes: Array<{
            featuredImage?: StorefrontTypes.Maybe<
              Pick<StorefrontTypes.Image, "url" | "altText" | "width" | "height">
            >;
            priceRange: {
              minVariantPrice: Pick<StorefrontTypes.MoneyV2, "amount" | "currencyCode">;
            };
          }>;
        };
      }
    >;
  };
};

export type ProductsQueryVariables = StorefrontTypes.Exact<{
  first: StorefrontTypes.Scalars["Int"]["input"];
  sortKey?: StorefrontTypes.InputMaybe<StorefrontTypes.ProductSortKeys>;
}>;

export type ProductsQuery = {
  products: {
    nodes: Array<
      Pick<StorefrontTypes.Product, "id" | "handle" | "title" | "availableForSale"> & {
        images: {
          nodes: Array<Pick<StorefrontTypes.Image, "url" | "altText" | "width" | "height">>;
        };
        priceRange: { minVariantPrice: Pick<StorefrontTypes.MoneyV2, "amount" | "currencyCode"> };
        compareAtPriceRange: {
          maxVariantPrice: Pick<StorefrontTypes.MoneyV2, "amount" | "currencyCode">;
        };
        options: Array<
          Pick<StorefrontTypes.ProductOption, "name"> & {
            optionValues: Array<Pick<StorefrontTypes.ProductOptionValue, "name">>;
          }
        >;
        fabric?: StorefrontTypes.Maybe<Pick<StorefrontTypes.Metafield, "value">>;
        featured?: StorefrontTypes.Maybe<Pick<StorefrontTypes.Metafield, "value">>;
      }
    >;
  };
};

export type CollectionQueryVariables = StorefrontTypes.Exact<{
  handle: StorefrontTypes.Scalars["String"]["input"];
}>;

export type CollectionQuery = {
  collection?: StorefrontTypes.Maybe<
    Pick<StorefrontTypes.Collection, "handle" | "title" | "description" | "descriptionHtml"> & {
      seo: Pick<StorefrontTypes.Seo, "title" | "description">;
      products: {
        nodes: Array<
          Pick<StorefrontTypes.Product, "id" | "handle" | "title" | "availableForSale"> & {
            images: {
              nodes: Array<Pick<StorefrontTypes.Image, "url" | "altText" | "width" | "height">>;
            };
            priceRange: {
              minVariantPrice: Pick<StorefrontTypes.MoneyV2, "amount" | "currencyCode">;
            };
            compareAtPriceRange: {
              maxVariantPrice: Pick<StorefrontTypes.MoneyV2, "amount" | "currencyCode">;
            };
            options: Array<
              Pick<StorefrontTypes.ProductOption, "name"> & {
                optionValues: Array<Pick<StorefrontTypes.ProductOptionValue, "name">>;
              }
            >;
            fabric?: StorefrontTypes.Maybe<Pick<StorefrontTypes.Metafield, "value">>;
            featured?: StorefrontTypes.Maybe<Pick<StorefrontTypes.Metafield, "value">>;
          }
        >;
      };
    }
  >;
};

export type ProductQueryVariables = StorefrontTypes.Exact<{
  handle: StorefrontTypes.Scalars["String"]["input"];
}>;

export type ProductQuery = {
  product?: StorefrontTypes.Maybe<
    Pick<
      StorefrontTypes.Product,
      "id" | "handle" | "title" | "description" | "descriptionHtml" | "availableForSale"
    > & {
      seo: Pick<StorefrontTypes.Seo, "title" | "description">;
      images: { nodes: Array<Pick<StorefrontTypes.Image, "url" | "altText" | "width" | "height">> };
      priceRange: { minVariantPrice: Pick<StorefrontTypes.MoneyV2, "amount" | "currencyCode"> };
      compareAtPriceRange: {
        maxVariantPrice: Pick<StorefrontTypes.MoneyV2, "amount" | "currencyCode">;
      };
      options: Array<
        Pick<StorefrontTypes.ProductOption, "name"> & {
          optionValues: Array<
            Pick<StorefrontTypes.ProductOptionValue, "name"> & {
              swatch?: StorefrontTypes.Maybe<
                Pick<StorefrontTypes.ProductOptionValueSwatch, "color">
              >;
            }
          >;
        }
      >;
      variants: {
        nodes: Array<
          Pick<StorefrontTypes.ProductVariant, "id" | "sku" | "availableForSale"> & {
            selectedOptions: Array<Pick<StorefrontTypes.SelectedOption, "name" | "value">>;
            image?: StorefrontTypes.Maybe<
              Pick<StorefrontTypes.Image, "url" | "altText" | "width" | "height">
            >;
            price: Pick<StorefrontTypes.MoneyV2, "amount" | "currencyCode">;
            compareAtPrice?: StorefrontTypes.Maybe<
              Pick<StorefrontTypes.MoneyV2, "amount" | "currencyCode">
            >;
          }
        >;
      };
      fabric?: StorefrontTypes.Maybe<Pick<StorefrontTypes.Metafield, "value">>;
      care?: StorefrontTypes.Maybe<Pick<StorefrontTypes.Metafield, "value">>;
      collections: { nodes: Array<Pick<StorefrontTypes.Collection, "handle" | "title">> };
    }
  >;
};

export type ColourIndexQueryVariables = StorefrontTypes.Exact<{ [key: string]: never }>;

export type ColourIndexQuery = {
  products: {
    nodes: Array<
      Pick<StorefrontTypes.Product, "handle" | "title"> & {
        variants: {
          nodes: Array<
            Pick<StorefrontTypes.ProductVariant, "availableForSale"> & {
              selectedOptions: Array<Pick<StorefrontTypes.SelectedOption, "name" | "value">>;
              image?: StorefrontTypes.Maybe<
                Pick<StorefrontTypes.Image, "url" | "altText" | "width" | "height">
              >;
            }
          >;
        };
      }
    >;
  };
};

export type ProductHandlesQueryVariables = StorefrontTypes.Exact<{ [key: string]: never }>;

export type ProductHandlesQuery = {
  products: { nodes: Array<Pick<StorefrontTypes.Product, "handle" | "updatedAt">> };
};

export type ImageFragment = Pick<StorefrontTypes.Image, "url" | "altText" | "width" | "height">;

export type MoneyFragment = Pick<StorefrontTypes.MoneyV2, "amount" | "currencyCode">;

export type ProductCardFragment = Pick<
  StorefrontTypes.Product,
  "id" | "handle" | "title" | "availableForSale"
> & {
  images: { nodes: Array<Pick<StorefrontTypes.Image, "url" | "altText" | "width" | "height">> };
  priceRange: { minVariantPrice: Pick<StorefrontTypes.MoneyV2, "amount" | "currencyCode"> };
  compareAtPriceRange: {
    maxVariantPrice: Pick<StorefrontTypes.MoneyV2, "amount" | "currencyCode">;
  };
  options: Array<
    Pick<StorefrontTypes.ProductOption, "name"> & {
      optionValues: Array<Pick<StorefrontTypes.ProductOptionValue, "name">>;
    }
  >;
  fabric?: StorefrontTypes.Maybe<Pick<StorefrontTypes.Metafield, "value">>;
  featured?: StorefrontTypes.Maybe<Pick<StorefrontTypes.Metafield, "value">>;
};

export type CartFragment = Pick<StorefrontTypes.Cart, "id" | "checkoutUrl" | "totalQuantity"> & {
  cost: { subtotalAmount: Pick<StorefrontTypes.MoneyV2, "amount" | "currencyCode"> };
  lines: {
    nodes: Array<
      | (Pick<StorefrontTypes.CartLine, "id" | "quantity"> & {
          cost: { totalAmount: Pick<StorefrontTypes.MoneyV2, "amount" | "currencyCode"> };
          merchandise: Pick<StorefrontTypes.ProductVariant, "id" | "availableForSale"> & {
            selectedOptions: Array<Pick<StorefrontTypes.SelectedOption, "name" | "value">>;
            image?: StorefrontTypes.Maybe<
              Pick<StorefrontTypes.Image, "url" | "altText" | "width" | "height">
            >;
            product: Pick<StorefrontTypes.Product, "handle" | "title">;
          };
        })
      | (Pick<StorefrontTypes.ComponentizableCartLine, "id" | "quantity"> & {
          cost: { totalAmount: Pick<StorefrontTypes.MoneyV2, "amount" | "currencyCode"> };
          merchandise: Pick<StorefrontTypes.ProductVariant, "id" | "availableForSale"> & {
            selectedOptions: Array<Pick<StorefrontTypes.SelectedOption, "name" | "value">>;
            image?: StorefrontTypes.Maybe<
              Pick<StorefrontTypes.Image, "url" | "altText" | "width" | "height">
            >;
            product: Pick<StorefrontTypes.Product, "handle" | "title">;
          };
        })
    >;
  };
};

interface GeneratedQueryTypes {
  "#graphql\n  query Cart($cartId: ID!) {\n    cart(id: $cartId) {\n      ...Cart\n    }\n  }\n  #graphql\n  fragment Cart on Cart {\n    id\n    checkoutUrl\n    totalQuantity\n    cost {\n      subtotalAmount {\n        ...Money\n      }\n    }\n    lines(first: 100) {\n      nodes {\n        id\n        quantity\n        cost {\n          totalAmount {\n            ...Money\n          }\n        }\n        merchandise {\n          ... on ProductVariant {\n            id\n            availableForSale\n            selectedOptions {\n              name\n              value\n            }\n            image {\n              ...Image\n            }\n            product {\n              handle\n              title\n            }\n          }\n        }\n      }\n    }\n  }\n\n  #graphql\n  fragment Image on Image {\n    url\n    altText\n    width\n    height\n  }\n\n  #graphql\n  fragment Money on MoneyV2 {\n    amount\n    currencyCode\n  }\n\n": {
    return: CartQuery;
    variables: CartQueryVariables;
  };
  "#graphql\n  query Collections {\n    collections(first: 20, sortKey: ID) {\n      nodes {\n        handle\n        title\n        description\n        products(first: 50) {\n          nodes {\n            featuredImage {\n              ...Image\n            }\n            priceRange {\n              minVariantPrice {\n                ...Money\n              }\n            }\n          }\n        }\n      }\n    }\n  }\n  #graphql\n  fragment Image on Image {\n    url\n    altText\n    width\n    height\n  }\n\n  #graphql\n  fragment Money on MoneyV2 {\n    amount\n    currencyCode\n  }\n\n": {
    return: CollectionsQuery;
    variables: CollectionsQueryVariables;
  };
  '#graphql\n  query Products($first: Int!, $sortKey: ProductSortKeys) {\n    products(first: $first, sortKey: $sortKey) {\n      nodes {\n        ...ProductCard\n      }\n    }\n  }\n  #graphql\n  fragment ProductCard on Product {\n    id\n    handle\n    title\n    availableForSale\n    images(first: 3) {\n      nodes {\n        ...Image\n      }\n    }\n    priceRange {\n      minVariantPrice {\n        ...Money\n      }\n    }\n    compareAtPriceRange {\n      maxVariantPrice {\n        ...Money\n      }\n    }\n    options {\n      name\n      optionValues {\n        name\n      }\n    }\n    fabric: metafield(namespace: "everhem", key: "fabric") {\n      value\n    }\n    featured: metafield(namespace: "everhem", key: "featured") {\n      value\n    }\n  }\n\n  #graphql\n  fragment Image on Image {\n    url\n    altText\n    width\n    height\n  }\n\n  #graphql\n  fragment Money on MoneyV2 {\n    amount\n    currencyCode\n  }\n\n': {
    return: ProductsQuery;
    variables: ProductsQueryVariables;
  };
  '#graphql\n  query Collection($handle: String!) {\n    collection(handle: $handle) {\n      handle\n      title\n      description\n      descriptionHtml\n      seo {\n        title\n        description\n      }\n      products(first: 100, sortKey: COLLECTION_DEFAULT) {\n        nodes {\n          ...ProductCard\n        }\n      }\n    }\n  }\n  #graphql\n  fragment ProductCard on Product {\n    id\n    handle\n    title\n    availableForSale\n    images(first: 3) {\n      nodes {\n        ...Image\n      }\n    }\n    priceRange {\n      minVariantPrice {\n        ...Money\n      }\n    }\n    compareAtPriceRange {\n      maxVariantPrice {\n        ...Money\n      }\n    }\n    options {\n      name\n      optionValues {\n        name\n      }\n    }\n    fabric: metafield(namespace: "everhem", key: "fabric") {\n      value\n    }\n    featured: metafield(namespace: "everhem", key: "featured") {\n      value\n    }\n  }\n\n  #graphql\n  fragment Image on Image {\n    url\n    altText\n    width\n    height\n  }\n\n  #graphql\n  fragment Money on MoneyV2 {\n    amount\n    currencyCode\n  }\n\n': {
    return: CollectionQuery;
    variables: CollectionQueryVariables;
  };
  '#graphql\n  query Product($handle: String!) {\n    product(handle: $handle) {\n      id\n      handle\n      title\n      description\n      descriptionHtml\n      availableForSale\n      seo {\n        title\n        description\n      }\n      images(first: 20) {\n        nodes {\n          ...Image\n        }\n      }\n      priceRange {\n        minVariantPrice {\n          ...Money\n        }\n      }\n      compareAtPriceRange {\n        maxVariantPrice {\n          ...Money\n        }\n      }\n      options {\n        name\n        optionValues {\n          name\n          swatch {\n            color\n          }\n        }\n      }\n      variants(first: 100) {\n        nodes {\n          id\n          sku\n          availableForSale\n          selectedOptions {\n            name\n            value\n          }\n          image {\n            ...Image\n          }\n          price {\n            ...Money\n          }\n          compareAtPrice {\n            ...Money\n          }\n        }\n      }\n      fabric: metafield(namespace: "everhem", key: "fabric") {\n        value\n      }\n      care: metafield(namespace: "everhem", key: "care") {\n        value\n      }\n      collections(first: 5) {\n        nodes {\n          handle\n          title\n        }\n      }\n    }\n  }\n  #graphql\n  fragment Image on Image {\n    url\n    altText\n    width\n    height\n  }\n\n  #graphql\n  fragment Money on MoneyV2 {\n    amount\n    currencyCode\n  }\n\n': {
    return: ProductQuery;
    variables: ProductQueryVariables;
  };
  "#graphql\n  query ColourIndex {\n    products(first: 50, sortKey: BEST_SELLING) {\n      nodes {\n        handle\n        title\n        variants(first: 100) {\n          nodes {\n            availableForSale\n            selectedOptions {\n              name\n              value\n            }\n            image {\n              ...Image\n            }\n          }\n        }\n      }\n    }\n  }\n  #graphql\n  fragment Image on Image {\n    url\n    altText\n    width\n    height\n  }\n\n": {
    return: ColourIndexQuery;
    variables: ColourIndexQueryVariables;
  };
  "#graphql\n  query ProductHandles {\n    products(first: 250) {\n      nodes {\n        handle\n        updatedAt\n      }\n    }\n  }\n": {
    return: ProductHandlesQuery;
    variables: ProductHandlesQueryVariables;
  };
}

interface GeneratedMutationTypes {
  "#graphql\n  mutation CartCreate($lines: [CartLineInput!]!) {\n    cartCreate(input: { lines: $lines }) {\n      cart {\n        ...Cart\n      }\n      userErrors {\n        message\n      }\n      warnings {\n        message\n      }\n    }\n  }\n  #graphql\n  fragment Cart on Cart {\n    id\n    checkoutUrl\n    totalQuantity\n    cost {\n      subtotalAmount {\n        ...Money\n      }\n    }\n    lines(first: 100) {\n      nodes {\n        id\n        quantity\n        cost {\n          totalAmount {\n            ...Money\n          }\n        }\n        merchandise {\n          ... on ProductVariant {\n            id\n            availableForSale\n            selectedOptions {\n              name\n              value\n            }\n            image {\n              ...Image\n            }\n            product {\n              handle\n              title\n            }\n          }\n        }\n      }\n    }\n  }\n\n  #graphql\n  fragment Image on Image {\n    url\n    altText\n    width\n    height\n  }\n\n  #graphql\n  fragment Money on MoneyV2 {\n    amount\n    currencyCode\n  }\n\n": {
    return: CartCreateMutation;
    variables: CartCreateMutationVariables;
  };
  "#graphql\n  mutation CartLinesAdd($cartId: ID!, $lines: [CartLineInput!]!) {\n    cartLinesAdd(cartId: $cartId, lines: $lines) {\n      cart {\n        ...Cart\n      }\n      userErrors {\n        message\n      }\n      warnings {\n        message\n      }\n    }\n  }\n  #graphql\n  fragment Cart on Cart {\n    id\n    checkoutUrl\n    totalQuantity\n    cost {\n      subtotalAmount {\n        ...Money\n      }\n    }\n    lines(first: 100) {\n      nodes {\n        id\n        quantity\n        cost {\n          totalAmount {\n            ...Money\n          }\n        }\n        merchandise {\n          ... on ProductVariant {\n            id\n            availableForSale\n            selectedOptions {\n              name\n              value\n            }\n            image {\n              ...Image\n            }\n            product {\n              handle\n              title\n            }\n          }\n        }\n      }\n    }\n  }\n\n  #graphql\n  fragment Image on Image {\n    url\n    altText\n    width\n    height\n  }\n\n  #graphql\n  fragment Money on MoneyV2 {\n    amount\n    currencyCode\n  }\n\n": {
    return: CartLinesAddMutation;
    variables: CartLinesAddMutationVariables;
  };
  "#graphql\n  mutation CartLinesUpdate($cartId: ID!, $lines: [CartLineUpdateInput!]!) {\n    cartLinesUpdate(cartId: $cartId, lines: $lines) {\n      cart {\n        ...Cart\n      }\n      userErrors {\n        message\n      }\n      warnings {\n        message\n      }\n    }\n  }\n  #graphql\n  fragment Cart on Cart {\n    id\n    checkoutUrl\n    totalQuantity\n    cost {\n      subtotalAmount {\n        ...Money\n      }\n    }\n    lines(first: 100) {\n      nodes {\n        id\n        quantity\n        cost {\n          totalAmount {\n            ...Money\n          }\n        }\n        merchandise {\n          ... on ProductVariant {\n            id\n            availableForSale\n            selectedOptions {\n              name\n              value\n            }\n            image {\n              ...Image\n            }\n            product {\n              handle\n              title\n            }\n          }\n        }\n      }\n    }\n  }\n\n  #graphql\n  fragment Image on Image {\n    url\n    altText\n    width\n    height\n  }\n\n  #graphql\n  fragment Money on MoneyV2 {\n    amount\n    currencyCode\n  }\n\n": {
    return: CartLinesUpdateMutation;
    variables: CartLinesUpdateMutationVariables;
  };
  "#graphql\n  mutation CartLinesRemove($cartId: ID!, $lineIds: [ID!]!) {\n    cartLinesRemove(cartId: $cartId, lineIds: $lineIds) {\n      cart {\n        ...Cart\n      }\n      userErrors {\n        message\n      }\n      warnings {\n        message\n      }\n    }\n  }\n  #graphql\n  fragment Cart on Cart {\n    id\n    checkoutUrl\n    totalQuantity\n    cost {\n      subtotalAmount {\n        ...Money\n      }\n    }\n    lines(first: 100) {\n      nodes {\n        id\n        quantity\n        cost {\n          totalAmount {\n            ...Money\n          }\n        }\n        merchandise {\n          ... on ProductVariant {\n            id\n            availableForSale\n            selectedOptions {\n              name\n              value\n            }\n            image {\n              ...Image\n            }\n            product {\n              handle\n              title\n            }\n          }\n        }\n      }\n    }\n  }\n\n  #graphql\n  fragment Image on Image {\n    url\n    altText\n    width\n    height\n  }\n\n  #graphql\n  fragment Money on MoneyV2 {\n    amount\n    currencyCode\n  }\n\n": {
    return: CartLinesRemoveMutation;
    variables: CartLinesRemoveMutationVariables;
  };
}
declare module "@shopify/storefront-api-client" {
  type InputMaybe<T> = StorefrontTypes.InputMaybe<T>;
  interface StorefrontQueries extends GeneratedQueryTypes {}
  interface StorefrontMutations extends GeneratedMutationTypes {}
}
