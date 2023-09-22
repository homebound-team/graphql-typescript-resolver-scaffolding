import { MutationResolvers } from "src/generated/graphql-types";
import { saveBook } from "src/resolvers/mutations/books/saveBookResolver";
import { noInputMutation } from "src/resolvers/mutations/noInputMutationResolver";
import { saveAuthor } from "src/resolvers/mutations/saveAuthorResolver";

// This file is auto-generated

export const mutationResolvers: MutationResolvers = { ...noInputMutation, ...saveAuthor, ...saveBook };
