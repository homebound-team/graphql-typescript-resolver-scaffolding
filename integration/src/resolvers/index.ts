import { Resolvers } from "@src/generated/graphql-types";
import { mutationResolvers } from "@src/resolvers/mutations";
import { objectResolvers } from "@src/resolvers/objects";
import { queryResolvers } from "@src/resolvers/queries";

const resolvers: Resolvers = {
  Mutation: mutationResolvers,
  Query: queryResolvers,
  ...objectResolvers,
  // Example of scaffold-ignored type.
  AuthorEnumDetail: undefined!,
};
