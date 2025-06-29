import { MutationResolvers } from "src/generated/graphql-types";
import { saveBook } from "src/resolvers/books/saveBookMutation";
import { noInputMutation } from "src/resolvers/mutations/noInputMutationMutation";
import { saveAuthor } from "src/resolvers/mutations/saveAuthorMutation";

// This file is auto-generated

export const mutationResolvers: MutationResolvers = { ...noInputMutation, ...saveAuthor, ...saveBook };
