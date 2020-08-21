import { Resolvers } from "@src/generated/graphql-types";
import { mutationResolvers } from "@src/resolvers/mutations";
import { objectResolvers } from "@src/resolvers/objects";
import { queryResolvers } from "@src/resolvers/queries";
import { subscriptionResolvers } from "@src/resolvers/subscriptions";

const resolvers: Resolvers = {
  Mutation: mutationResolvers,
  Query: queryResolvers,
  Subscription: subscriptionResolvers,
  ...objectResolvers,
  // Example of scaffold-ignored type.
  AuthorEnumDetail: undefined!,
};
