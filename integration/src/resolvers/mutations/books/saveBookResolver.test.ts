import { Context } from "@src/context";
import { BookInput } from "@src/generated/graphql-types";
import { run } from "@src/resolvers/testUtils";
import { saveBook } from "@src/resolvers/mutations/books/saveBookResolver";

describe("saveBook", () => {
  it("handles this business case", () => {
    fail();
  });
});

async function runSaveBook(ctx: Context, inputFn: () => BookInput) {
  return await run(ctx, async (ctx) => {
    return saveBook.saveBook({}, { input: inputFn() }, ctx, undefined!);
  });
}
