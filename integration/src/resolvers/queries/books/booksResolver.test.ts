import { Context } from "src/context";
import { run } from "src/resolvers/testUtils";
import { books } from "src/resolvers/queries/books/booksResolver";

describe("books", () => {
  it("handles this business case", () => {
    fail();
  });
});

async function runBooks(ctx: Context, argsFn: () => {}) {
  return await run(ctx, async () => {
    return books.books({}, argsFn(), ctx, undefined!);
  });
}
