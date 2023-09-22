import { Context } from "src/context";
import { AuthorInput } from "src/generated/graphql-types";
import { saveAuthor } from "src/resolvers/mutations/saveAuthorResolver";
import { run } from "src/resolvers/testUtils";

describe("saveAuthor", () => {
  it("handles this business case", () => {
    fail();
  });
});

async function runSaveAuthor(ctx: Context, inputFn: () => AuthorInput) {
  return await run(ctx, async (ctx) => {
    return saveAuthor.saveAuthor({}, { input: inputFn() }, ctx, undefined!);
  });
}
