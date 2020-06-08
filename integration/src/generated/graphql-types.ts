
import { Context, Id } from "@src/context";
import { GraphQLResolveInfo } from "graphql";

export interface Resolvers {
  Mutation: MutationResolvers;
  Query: QueryResolvers;
  Author: AuthorResolvers;
  SaveBookResult?: SaveBookResultResolvers;
  Book?: BookResolvers;
  SaveAuthorResult?: SaveAuthorResultResolvers;
}

export interface MutationResolvers {
  noInputMutation: Resolver<{}, {}, Boolean | null | undefined>;
  saveAuthor: Resolver<{}, MutationSaveAuthorArgs, SaveAuthorResult>;
  saveBook: Resolver<{}, MutationSaveBookArgs, SaveBookResult>;
}

export interface QueryResolvers {
  authors: Resolver<{}, QueryAuthorsArgs, Id[]>;
  books: Resolver<{}, {}, Book[]>;
}

export interface AuthorResolvers {
  name: Resolver<Id, {}, string>;
}

export interface SaveBookResultResolvers {
  author: Resolver<SaveBookResult, {}, Id>;
}

export interface BookResolvers {
  name: Resolver<Book, {}, string>;
}

export interface SaveAuthorResultResolvers {
  author: Resolver<SaveAuthorResult, {}, Id>;
}

type Resolver<R, A, T> = (root: R, args: A, ctx: Context, info: GraphQLResolveInfo) => T | Promise<T>;

export interface MutationSaveAuthorArgs {
  input: AuthorInput;
}
export interface MutationSaveBookArgs {
  input: BookInput;
}
export interface QueryAuthorsArgs {
  id: string | null | undefined;
}
export interface SaveBookResult {
  author: Id;
}

export interface Book {
  name: string;
}

export interface SaveAuthorResult {
  author: Id;
}

export interface BookInput {
  name?: string | null | undefined;
}

export interface AuthorInput {
  name?: string | null | undefined;
}
