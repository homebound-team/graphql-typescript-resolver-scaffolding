
import { Context } from "./entities";
import { GraphQLResolveInfo } from "graphql";

export interface Resolvers {
  Mutation: MutationResolvers;
  Query: QueryResolvers;
  SaveBookResult?: SaveBookResultResolvers;
  Author?: AuthorResolvers;
  Book?: BookResolvers;
  SaveAuthorResult?: SaveAuthorResultResolvers;
}

export interface MutationResolvers {
  saveAuthor: Resolver<{}, MutationSaveAuthorArgs, SaveAuthorResult>;
  saveBook: Resolver<{}, MutationSaveBookArgs, SaveBookResult>;
}

export interface QueryResolvers {
  authors: Resolver<{}, QueryAuthorsArgs, Author[]>;
}

export interface SaveBookResultResolvers {
  author: Resolver<SaveBookResult, {}, Author>;
}

export interface AuthorResolvers {
  name: Resolver<Author, {}, string>;
}

export interface BookResolvers {
  name: Resolver<Book, {}, string>;
}

export interface SaveAuthorResultResolvers {
  author: Resolver<SaveAuthorResult, {}, Author>;
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
  author: Author;
}

export interface Author {
  name: string;
}

export interface Book {
  name: string;
}

export interface SaveAuthorResult {
  author: Author;
}

export interface BookInput {
  name?: string | null | undefined;
}

export interface AuthorInput {
  name?: string | null | undefined;
}
