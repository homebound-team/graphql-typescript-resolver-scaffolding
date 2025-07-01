import { QueryResolvers } from "src/generated/graphql-types";
import { books } from "src/resolvers/books/booksQuery";
import { authors } from "src/resolvers/queries/authorsQuery";

// This file is auto-generated

export const queryResolvers: QueryResolvers = { ...authors, ...books };
