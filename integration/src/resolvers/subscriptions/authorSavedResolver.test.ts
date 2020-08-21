import { Context } from "src/context";
import { run } from "src/resolvers/testUtils";
import { authorSaved } from "src/resolvers/subscriptions/authorSavedResolver";

describe("authorSaved", () => {
  it("handles this business case", () => {
    fail();
  });
});

async function runAuthorSaved(ctx: Context, argsFn: () => {}) {
  return await run(ctx, async () => {
    return authorSaved.authorSaved.subscribe(undefined, argsFn(), ctx, undefined!);
  });
}
