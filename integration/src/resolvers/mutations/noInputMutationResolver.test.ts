import { Context } from "src/context";
import { noInputMutation } from "src/resolvers/mutations/noInputMutationResolver";
import { run } from "src/resolvers/testUtils";

describe("noInputMutation", () => {
  it("handles this business case", () => {
    fail();
  });
});

function runNoInputMutation(ctx: Context, inputFn: () => void) {
  return run(ctx, (ctx) => noInputMutation.noInputMutation({}, { input: inputFn() }, ctx, undefined!));
}
