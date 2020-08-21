import { Context } from "src/context";
import { SubscriptionBookSavedArgs } from "src/generated/graphql-types";
import { run } from "src/resolvers/testUtils";
import { bookSaved } from "src/resolvers/subscriptions/books/bookSavedResolver";

describe("bookSaved", () => {
  it("handles this business case", () => {
    fail();
  });
});

async function runBookSaved(ctx: Context, argsFn: () => SubscriptionBookSavedArgs) {
  return await run(ctx, async () => {
    return bookSaved.bookSaved.subscribe(undefined, argsFn(), ctx, undefined!);
  });
}
