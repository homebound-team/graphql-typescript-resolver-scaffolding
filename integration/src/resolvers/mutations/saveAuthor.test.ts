import { Context } from "@src/context";
import { AuthorInput } from "@src/generated/graphql-types";
import { run } from "@src/resolvers/testUtils";
import { saveAuthor } from "@src/resolvers/mutations/saveAuthor";

describe("saveAuthor", () => {
  it("works", () => {});
});

async function runSaveAuthor(ctx: Context, input: AuthorInput) {
  return await run(ctx, async () => {
    return saveAuthor.saveAuthor({}, { input }, ctx, undefined!);
  });
}
