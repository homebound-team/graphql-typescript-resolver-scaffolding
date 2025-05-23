import { Context } from "src/context";
import { books } from "src/resolvers/queries/books/booksResolver";
import { run } from "src/resolvers/testUtils";

describe("books", () => {
  it("handles this business case", () => {
    fail();
  });
});

function runBooks(ctx: Context, argsFn: () => {}) {
  return run(ctx, (ctx) => books.books({}, argsFn(), ctx, undefined!));
}
