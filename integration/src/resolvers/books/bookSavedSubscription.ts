import { withFilter } from "graphql-subscriptions";
import { SubscriptionBookSavedArgs, SubscriptionResolvers } from "src/generated/graphql-types";

export const BookSavedEvent = "BookSavedEvent";

export const bookSaved: Pick<SubscriptionResolvers, "bookSaved"> = {
  bookSaved: {
    subscribe: withFilter(() => {
      // likely can import pubsub implementation and uncomment next line
      // return pubsub.asyncIterator(BookSavedEvent);
      throw new Error("not implemented");
    }, (payload, args: SubscriptionBookSavedArgs) => {
      // return true if payload / args should result in notification
      throw new Error("not implemented");
    }),
  },
};
