import { Context } from "src/context";
import { authorSaved } from "src/resolvers/subscriptions/authorSavedResolver";
import { run } from "src/resolvers/testUtils";

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
