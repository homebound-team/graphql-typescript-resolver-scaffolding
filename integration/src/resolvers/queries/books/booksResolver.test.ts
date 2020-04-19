import { Context } from "@src/context";
import { run } from "@src/resolvers/testUtils";
import { books } from "@src/resolvers/queries/books/booksResolver";

describe("books", () => {
  it("works", () => {});
});

async function runBooks(ctx: Context, args: {}) {
  return await run(ctx, async () => {
    return books.books({}, args, ctx, undefined!);
  });
}
