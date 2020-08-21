import { SubscriptionResolvers } from "src/generated/graphql-types";
import { authorSaved } from "src/resolvers/subscriptions/authorSavedResolver";
import { bookSaved } from "src/resolvers/subscriptions/books/bookSavedResolver";

// This file is auto-generated

export const subscriptionResolvers: SubscriptionResolvers = {
  ...authorSaved,
  ...bookSaved,
};
