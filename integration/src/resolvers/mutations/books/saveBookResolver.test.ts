import { Context } from "src/context";
import { BookInput } from "src/generated/graphql-types";
import { saveBook } from "src/resolvers/mutations/books/saveBookResolver";
import { run } from "src/resolvers/testUtils";

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
