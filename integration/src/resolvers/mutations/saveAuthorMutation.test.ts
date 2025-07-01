import { Context } from "src/context";
import { AuthorInput } from "src/generated/graphql-types";
import { saveAuthor } from "src/resolvers/mutations/saveAuthorMutation";
import { run } from "src/resolvers/testUtils";

describe("saveAuthor", () => {
  it("handles this business case", () => {
    fail();
  });
});

function runSaveAuthor(ctx: Context, inputFn: () => AuthorInput) {
  return run(ctx, (ctx) => saveAuthor.saveAuthor({}, { input: inputFn() }, ctx, undefined!));
}
