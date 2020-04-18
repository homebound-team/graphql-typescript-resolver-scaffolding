
import { Context } from "./entities";
import { GraphQLResolveInfo } from "graphql";

export interface Resolvers {
  Query: QueryResolvers;
  Mutation: MutationResolvers;
  Author?: AuthorResolvers;
  SaveAuthorResult?: SaveAuthorResultResolvers;
  Book?: BookResolvers;
}

export interface QueryResolvers {
  authors: Resolver<{}, QueryAuthorsArgs, Author[]>;
}

export interface MutationResolvers {
  saveAuthor: Resolver<{}, MutationSaveAuthorArgs, SaveAuthorResult>;
}

export interface AuthorResolvers {
  name: Resolver<Author, {}, string>;
}

export interface SaveAuthorResultResolvers {
  author: Resolver<SaveAuthorResult, {}, Author>;
}

export interface BookResolvers {
  name: Resolver<Book, {}, string>;
}

type Resolver<R, A, T> = (root: R, args: A, ctx: Context, info: GraphQLResolveInfo) => T | Promise<T>;

export interface QueryAuthorsArgs {
  id: string | null | undefined;
}
export interface MutationSaveAuthorArgs {
  input: AuthorInput;
}
export interface Author {
  name: string;
}

export interface SaveAuthorResult {
  author: Author;
}

export interface Book {
  name: string;
}

export interface AuthorInput {
  name?: string | null | undefined;
}
