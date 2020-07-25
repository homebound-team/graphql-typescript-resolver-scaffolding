import { MutationResolvers } from "src/generated/graphql-types";
import { noInputMutation } from "src/resolvers/mutations/noInputMutationResolver";
import { saveAuthor } from "src/resolvers/mutations/saveAuthorResolver";
import { saveBook } from "src/resolvers/mutations/books/saveBookResolver";

// This file is auto-generated

export const mutationResolvers: MutationResolvers = {
  ...noInputMutation,
  ...saveAuthor,
  ...saveBook,
};
