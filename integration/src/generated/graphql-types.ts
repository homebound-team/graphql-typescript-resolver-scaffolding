import { GraphQLResolveInfo } from "graphql";
import { Context, Id } from "src/context";

export interface Resolvers {
  Author: AuthorResolvers;
  AuthorEnumDetail: AuthorEnumDetailResolvers;
  Book: BookResolvers;
  Mutation: MutationResolvers;
  Query: QueryResolvers;
  SaveAuthorResult?: SaveAuthorResultResolvers;
  SaveBookResult?: SaveBookResultResolvers;
  Subscription?: SubscriptionResolvers;
}

export type UnionResolvers = {};

export interface AuthorResolvers {
  books: Resolver<Id, {}, readonly Id[]>;
  name: Resolver<Id, {}, string>;
  numberOfNumbers: Resolver<Id, {}, number | null | undefined>;
}

export interface AuthorEnumDetailResolvers {
  name: Resolver<Id, {}, string>;
}

export interface BookResolvers {
  name: Resolver<Id, {}, string>;
}

export interface MutationResolvers {
  noInputMutation: Resolver<{}, {}, boolean | null | undefined>;
  saveAuthor: Resolver<{}, MutationSaveAuthorArgs, SaveAuthorResult>;
  saveBook: Resolver<{}, MutationSaveBookArgs, SaveBookResult>;
}

export interface QueryResolvers {
  authors: Resolver<{}, QueryAuthorsArgs, readonly Id[]>;
  books: Resolver<{}, {}, readonly Id[]>;
}

export interface SaveAuthorResultResolvers {
  author: Resolver<SaveAuthorResult, {}, Id>;
}

export interface SaveBookResultResolvers {
  author: Resolver<SaveBookResult, {}, Id>;
}

export interface SubscriptionResolvers {
  authorSaved: SubscriptionResolver<Subscription, {}, Id>;
  bookSaved: SubscriptionResolver<Subscription, SubscriptionBookSavedArgs, Id | null | undefined>;
}

type MaybePromise<T> = T | Promise<T>;
export type Resolver<R, A, T> = (root: R, args: A, ctx: Context, info: GraphQLResolveInfo) => MaybePromise<T>;

export type SubscriptionResolverFilter<R, A, T> = (
  root: R | undefined,
  args: A,
  ctx: Context,
  info: GraphQLResolveInfo,
) => boolean | Promise<boolean>;
export type SubscriptionResolver<R, A, T> = {
  subscribe: (root: R | undefined, args: A, ctx: Context, info: GraphQLResolveInfo) => AsyncIterator<T>;
};

export interface MutationSaveAuthorArgs {
  input: AuthorInput;
}
export interface MutationSaveBookArgs {
  input: BookInput;
}
export interface QueryAuthorsArgs {
  id?: string | null | undefined;
}
export interface SubscriptionBookSavedArgs {
  startsWith?: string | null | undefined;
}
export interface SaveAuthorResult {
  author: Id;
}

export interface SaveBookResult {
  author: Id;
}

export interface Subscription {
  authorSaved: Id;
  bookSaved: Id | null | undefined;
}

export interface AuthorInput {
  name?: string | null | undefined;
}

export interface BookInput {
  name?: string | null | undefined;
}
