import { SubscriptionResolvers } from "src/generated/graphql-types";

export const AuthorSavedEvent = "AuthorSavedEvent";

export const authorSaved: Pick<SubscriptionResolvers, "authorSaved"> = {
  authorSaved: {
    subscribe: () => {
      // likely can import pubsub implementation and uncomment next line
      // return pubsub.asyncIterator(AuthorSavedEvent);
      throw new Error("not implemented");
    },
  },
};
