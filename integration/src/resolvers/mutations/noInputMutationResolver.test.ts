import { Context } from "src/context";
import { run } from "src/resolvers/testUtils";
import { noInputMutation } from "src/resolvers/mutations/noInputMutationResolver";

describe("noInputMutation", () => {
  it("handles this business case", () => {
    fail();
  });
});

async function runNoInputMutation(ctx: Context, inputFn: () => void) {
  return await run(ctx, async (ctx) => {
    return noInputMutation.noInputMutation(
      {},
      { input: inputFn() },
      ctx,
      undefined!,
    );
  });
}
