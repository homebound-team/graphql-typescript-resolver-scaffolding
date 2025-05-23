import { Context } from "src/context";
import { SubscriptionBookSavedArgs } from "src/generated/graphql-types";
import { bookSaved } from "src/resolvers/subscriptions/books/bookSavedResolver";
import { run } from "src/resolvers/testUtils";

describe("bookSaved", () => {
  it("handles this business case", () => {
    fail();
  });
});

function runBookSaved(ctx: Context, argsFn: () => SubscriptionBookSavedArgs) {
  return run(ctx, (ctx) => bookSaved.bookSaved.subscribe(undefined, argsFn(), ctx, undefined!));
}
