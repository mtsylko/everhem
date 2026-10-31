/* eslint-disable eslint-comments/disable-enable-pair */
/* eslint-disable eslint-comments/no-unlimited-disable */
/* eslint-disable */
import type * as AdminTypes from './admin.types.js';

export type CollectionByHandleQueryVariables = AdminTypes.Exact<{
  handle: AdminTypes.Scalars['String']['input'];
  namespace: AdminTypes.Scalars['String']['input'];
  key: AdminTypes.Scalars['String']['input'];
}>;


export type CollectionByHandleQuery = { collectionByIdentifier?: AdminTypes.Maybe<(
    Pick<AdminTypes.Collection, 'id'>
    & { seedChecksum?: AdminTypes.Maybe<Pick<AdminTypes.Metafield, 'value'>>, resourcePublicationsV2: { nodes: Array<{ publication: Pick<AdminTypes.Publication, 'id'> }> } }
  )> };

export type CreateCollectionMutationVariables = AdminTypes.Exact<{
  collection: AdminTypes.CollectionCreateInput;
}>;


export type CreateCollectionMutation = { collectionCreate?: AdminTypes.Maybe<{ collection?: AdminTypes.Maybe<Pick<AdminTypes.Collection, 'id'>>, userErrors: Array<Pick<AdminTypes.UserError, 'field' | 'message'>> }> };

export type UpdateCollectionMutationVariables = AdminTypes.Exact<{
  collection: AdminTypes.CollectionUpdateInput;
}>;


export type UpdateCollectionMutation = { collectionUpdate?: AdminTypes.Maybe<{ collection?: AdminTypes.Maybe<Pick<AdminTypes.Collection, 'id'>>, userErrors: Array<Pick<AdminTypes.UserError, 'field' | 'message'>> }> };

export type ProductMetafieldDefinitionsQueryVariables = AdminTypes.Exact<{
  namespace: AdminTypes.Scalars['String']['input'];
}>;


export type ProductMetafieldDefinitionsQuery = { metafieldDefinitions: { nodes: Array<(
      Pick<AdminTypes.MetafieldDefinition, 'id' | 'key'>
      & { type: Pick<AdminTypes.MetafieldDefinitionType, 'name'> }
    )> } };

export type CreateMetafieldDefinitionMutationVariables = AdminTypes.Exact<{
  definition: AdminTypes.MetafieldDefinitionInput;
}>;


export type CreateMetafieldDefinitionMutation = { metafieldDefinitionCreate?: AdminTypes.Maybe<{ createdDefinition?: AdminTypes.Maybe<Pick<AdminTypes.MetafieldDefinition, 'id'>>, userErrors: Array<Pick<AdminTypes.MetafieldDefinitionCreateUserError, 'field' | 'message' | 'code'>> }> };

export type PreflightQueryVariables = AdminTypes.Exact<{ [key: string]: never; }>;


export type PreflightQuery = { shop: Pick<AdminTypes.Shop, 'name' | 'myshopifyDomain' | 'currencyCode'>, currentAppInstallation: { accessScopes: Array<Pick<AdminTypes.AccessScope, 'handle'>> }, locations: { nodes: Array<Pick<AdminTypes.Location, 'id' | 'name' | 'isActive' | 'fulfillsOnlineOrders'>> }, publications: { nodes: Array<(
      Pick<AdminTypes.Publication, 'id'>
      & { catalog?: AdminTypes.Maybe<(
        Pick<AdminTypes.AppCatalog, 'title'>
        & { apps: { nodes: Array<Pick<AdminTypes.App, 'title'>> } }
      ) | Pick<AdminTypes.CompanyLocationCatalog, 'title'> | Pick<AdminTypes.MarketCatalog, 'title'>> }
    )> } };

export type ProductByHandleQueryVariables = AdminTypes.Exact<{
  handle: AdminTypes.Scalars['String']['input'];
  namespace: AdminTypes.Scalars['String']['input'];
  key: AdminTypes.Scalars['String']['input'];
}>;


export type ProductByHandleQuery = { productByIdentifier?: AdminTypes.Maybe<(
    Pick<AdminTypes.Product, 'id' | 'tags'>
    & { seedChecksum?: AdminTypes.Maybe<Pick<AdminTypes.Metafield, 'value'>>, variants: { nodes: Array<(
        Pick<AdminTypes.ProductVariant, 'id'>
        & { selectedOptions: Array<Pick<AdminTypes.SelectedOption, 'name' | 'value'>> }
      )> }, resourcePublicationsV2: { nodes: Array<{ publication: Pick<AdminTypes.Publication, 'id'> }> } }
  )> };

export type ProductSetMutationVariables = AdminTypes.Exact<{
  identifier: AdminTypes.ProductSetIdentifiers;
  input: AdminTypes.ProductSetInput;
}>;


export type ProductSetMutation = { productSet?: AdminTypes.Maybe<{ product?: AdminTypes.Maybe<Pick<AdminTypes.Product, 'id'>>, userErrors: Array<Pick<AdminTypes.ProductSetUserError, 'field' | 'message' | 'code'>> }> };

export type PublishMutationVariables = AdminTypes.Exact<{
  id: AdminTypes.Scalars['ID']['input'];
  input: Array<AdminTypes.PublicationInput> | AdminTypes.PublicationInput;
}>;


export type PublishMutation = { publishablePublish?: AdminTypes.Maybe<{ userErrors: Array<Pick<AdminTypes.UserError, 'field' | 'message'>> }> };

export type StagedUploadsMutationVariables = AdminTypes.Exact<{
  input: Array<AdminTypes.StagedUploadInput> | AdminTypes.StagedUploadInput;
}>;


export type StagedUploadsMutation = { stagedUploadsCreate?: AdminTypes.Maybe<{ stagedTargets?: AdminTypes.Maybe<Array<(
      Pick<AdminTypes.StagedMediaUploadTarget, 'url' | 'resourceUrl'>
      & { parameters: Array<Pick<AdminTypes.StagedUploadParameter, 'name' | 'value'>> }
    )>>, userErrors: Array<Pick<AdminTypes.UserError, 'field' | 'message'>> }> };

export type SeededProductsQueryVariables = AdminTypes.Exact<{
  query: AdminTypes.Scalars['String']['input'];
  after?: AdminTypes.InputMaybe<AdminTypes.Scalars['String']['input']>;
  namespace: AdminTypes.Scalars['String']['input'];
  key: AdminTypes.Scalars['String']['input'];
}>;


export type SeededProductsQuery = { products: { nodes: Array<(
      Pick<AdminTypes.Product, 'id' | 'handle' | 'tags'>
      & { seedChecksum?: AdminTypes.Maybe<Pick<AdminTypes.Metafield, 'value'>> }
    )>, pageInfo: Pick<AdminTypes.PageInfo, 'hasNextPage' | 'endCursor'> } };

export type DeleteProductMutationVariables = AdminTypes.Exact<{
  id: AdminTypes.Scalars['ID']['input'];
}>;


export type DeleteProductMutation = { productDelete?: AdminTypes.Maybe<(
    Pick<AdminTypes.ProductDeletePayload, 'deletedProductId'>
    & { userErrors: Array<Pick<AdminTypes.UserError, 'field' | 'message'>> }
  )> };

export type DeleteCollectionMutationVariables = AdminTypes.Exact<{
  id: AdminTypes.Scalars['ID']['input'];
}>;


export type DeleteCollectionMutation = { collectionDelete?: AdminTypes.Maybe<(
    Pick<AdminTypes.CollectionDeletePayload, 'deletedCollectionId'>
    & { userErrors: Array<Pick<AdminTypes.UserError, 'field' | 'message'>> }
  )> };

export type DeleteMetafieldDefinitionMutationVariables = AdminTypes.Exact<{
  identifier: AdminTypes.MetafieldDefinitionIdentifierInput;
}>;


export type DeleteMetafieldDefinitionMutation = { metafieldDefinitionDelete?: AdminTypes.Maybe<(
    Pick<AdminTypes.MetafieldDefinitionDeletePayload, 'deletedDefinitionId'>
    & { userErrors: Array<Pick<AdminTypes.MetafieldDefinitionDeleteUserError, 'field' | 'message' | 'code'>> }
  )> };

interface GeneratedQueryTypes {
  "#graphql\n  query CollectionByHandle($handle: String!, $namespace: String!, $key: String!) {\n    collectionByIdentifier(identifier: { handle: $handle }) {\n      id\n      seedChecksum: metafield(namespace: $namespace, key: $key) {\n        value\n      }\n      resourcePublicationsV2(first: 25) {\n        nodes {\n          publication {\n            id\n          }\n        }\n      }\n    }\n  }\n": {return: CollectionByHandleQuery, variables: CollectionByHandleQueryVariables},
  "#graphql\n  query ProductMetafieldDefinitions($namespace: String!) {\n    metafieldDefinitions(first: 50, ownerType: PRODUCT, namespace: $namespace) {\n      nodes {\n        id\n        key\n        type {\n          name\n        }\n      }\n    }\n  }\n": {return: ProductMetafieldDefinitionsQuery, variables: ProductMetafieldDefinitionsQueryVariables},
  "#graphql\n  query Preflight {\n    shop {\n      name\n      myshopifyDomain\n      currencyCode\n    }\n    currentAppInstallation {\n      accessScopes {\n        handle\n      }\n    }\n    locations(first: 25) {\n      nodes {\n        id\n        name\n        isActive\n        fulfillsOnlineOrders\n      }\n    }\n    publications(first: 25) {\n      nodes {\n        id\n        catalog {\n          title\n          ... on AppCatalog {\n            apps(first: 1) {\n              nodes {\n                title\n              }\n            }\n          }\n        }\n      }\n    }\n  }\n": {return: PreflightQuery, variables: PreflightQueryVariables},
  "#graphql\n  query ProductByHandle($handle: String!, $namespace: String!, $key: String!) {\n    productByIdentifier(identifier: { handle: $handle }) {\n      id\n      tags\n      seedChecksum: metafield(namespace: $namespace, key: $key) {\n        value\n      }\n      variants(first: 100) {\n        nodes {\n          id\n          selectedOptions {\n            name\n            value\n          }\n        }\n      }\n      resourcePublicationsV2(first: 25) {\n        nodes {\n          publication {\n            id\n          }\n        }\n      }\n    }\n  }\n": {return: ProductByHandleQuery, variables: ProductByHandleQueryVariables},
  "#graphql\n  query SeededProducts($query: String!, $after: String, $namespace: String!, $key: String!) {\n    products(first: 50, after: $after, query: $query) {\n      nodes {\n        id\n        handle\n        tags\n        seedChecksum: metafield(namespace: $namespace, key: $key) {\n          value\n        }\n      }\n      pageInfo {\n        hasNextPage\n        endCursor\n      }\n    }\n  }\n": {return: SeededProductsQuery, variables: SeededProductsQueryVariables},
}

interface GeneratedMutationTypes {
  "#graphql\n  mutation CreateCollection($collection: CollectionCreateInput!) {\n    collectionCreate(collection: $collection) {\n      collection {\n        id\n      }\n      userErrors {\n        field\n        message\n      }\n    }\n  }\n": {return: CreateCollectionMutation, variables: CreateCollectionMutationVariables},
  "#graphql\n  mutation UpdateCollection($collection: CollectionUpdateInput!) {\n    collectionUpdate(collection: $collection) {\n      collection {\n        id\n      }\n      userErrors {\n        field\n        message\n      }\n    }\n  }\n": {return: UpdateCollectionMutation, variables: UpdateCollectionMutationVariables},
  "#graphql\n  mutation CreateMetafieldDefinition($definition: MetafieldDefinitionInput!) {\n    metafieldDefinitionCreate(definition: $definition) {\n      createdDefinition {\n        id\n      }\n      userErrors {\n        field\n        message\n        code\n      }\n    }\n  }\n": {return: CreateMetafieldDefinitionMutation, variables: CreateMetafieldDefinitionMutationVariables},
  "#graphql\n  mutation ProductSet($identifier: ProductSetIdentifiers!, $input: ProductSetInput!) {\n    productSet(identifier: $identifier, input: $input, synchronous: true) {\n      product {\n        id\n      }\n      userErrors {\n        field\n        message\n        code\n      }\n    }\n  }\n": {return: ProductSetMutation, variables: ProductSetMutationVariables},
  "#graphql\n  mutation Publish($id: ID!, $input: [PublicationInput!]!) {\n    publishablePublish(id: $id, input: $input) {\n      userErrors {\n        field\n        message\n      }\n    }\n  }\n": {return: PublishMutation, variables: PublishMutationVariables},
  "#graphql\n  mutation StagedUploads($input: [StagedUploadInput!]!) {\n    stagedUploadsCreate(input: $input) {\n      stagedTargets {\n        url\n        resourceUrl\n        parameters {\n          name\n          value\n        }\n      }\n      userErrors {\n        field\n        message\n      }\n    }\n  }\n": {return: StagedUploadsMutation, variables: StagedUploadsMutationVariables},
  "#graphql\n  mutation DeleteProduct($id: ID!) {\n    productDelete(input: { id: $id }, synchronous: true) {\n      deletedProductId\n      userErrors {\n        field\n        message\n      }\n    }\n  }\n": {return: DeleteProductMutation, variables: DeleteProductMutationVariables},
  "#graphql\n  mutation DeleteCollection($id: ID!) {\n    collectionDelete(input: { id: $id }) {\n      deletedCollectionId\n      userErrors {\n        field\n        message\n      }\n    }\n  }\n": {return: DeleteCollectionMutation, variables: DeleteCollectionMutationVariables},
  "#graphql\n  mutation DeleteMetafieldDefinition($identifier: MetafieldDefinitionIdentifierInput!) {\n    metafieldDefinitionDelete(identifier: $identifier, deleteAllAssociatedMetafields: true) {\n      deletedDefinitionId\n      userErrors {\n        field\n        message\n        code\n      }\n    }\n  }\n": {return: DeleteMetafieldDefinitionMutation, variables: DeleteMetafieldDefinitionMutationVariables},
}
declare module '@shopify/admin-api-client' {
  type InputMaybe<T> = AdminTypes.InputMaybe<T>;
  interface AdminQueries extends GeneratedQueryTypes {}
  interface AdminMutations extends GeneratedMutationTypes {}
}
