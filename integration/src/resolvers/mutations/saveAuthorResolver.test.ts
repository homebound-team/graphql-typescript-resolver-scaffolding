import { Context } from "@src/context";
import { AuthorInput } from "@src/generated/graphql-types";
import { run } from "@src/resolvers/testUtils";
import { saveAuthor } from "@src/resolvers/mutations/saveAuthorResolver";

describe("saveAuthor", () => {
  it("handles this business case", () => {
    fail();
  });
});

async function runSaveAuthor(ctx: Context, inputFn: () => AuthorInput) {
  return await run(ctx, async () => {
    return saveAuthor.saveAuthor({}, { input: inputFn() }, ctx, undefined!);
  });
}
