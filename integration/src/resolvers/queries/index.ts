import { QueryResolvers } from "src/generated/graphql-types";
import { authors } from "src/resolvers/queries/authorsResolver";
import { books } from "src/resolvers/queries/books/booksResolver";

// This file is auto-generated

export const queryResolvers: QueryResolvers = { ...authors, ...books };
