import { Context } from "@src/context";
import { BookInput } from "@src/generated/graphql-types";
import { run } from "@src/resolvers/testUtils";
import { saveBook } from "@src/resolvers/mutations/books/saveBook";

describe("saveBook", () => {
  it("works", () => {});
});

async function runSaveBook(ctx: Context, input: BookInput) {
  return await run(ctx, async () => {
    return saveBook.saveBook({}, { input }, ctx, undefined!);
  });
}
