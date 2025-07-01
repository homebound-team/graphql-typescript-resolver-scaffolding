import { SubscriptionResolvers } from "src/generated/graphql-types";
import { bookSaved } from "src/resolvers/books/bookSavedSubscription";
import { authorSaved } from "src/resolvers/subscriptions/authorSavedSubscription";

// This file is auto-generated

export const subscriptionResolvers: SubscriptionResolvers = { ...authorSaved, ...bookSaved };
