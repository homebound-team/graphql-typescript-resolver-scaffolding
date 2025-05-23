import { Context } from "src/context";
import { authorSaved } from "src/resolvers/subscriptions/authorSavedResolver";
import { run } from "src/resolvers/testUtils";

describe("authorSaved", () => {
  it("handles this business case", () => {
    fail();
  });
});

function runAuthorSaved(ctx: Context, argsFn: () => {}) {
  return run(ctx, (ctx) => authorSaved.authorSaved.subscribe(undefined, argsFn(), ctx, undefined!));
}
