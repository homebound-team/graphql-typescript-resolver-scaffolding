import { Context } from "src/context";
import { BookInput } from "src/generated/graphql-types";
import { saveBook } from "src/resolvers/books/saveBookMutation";
import { run } from "src/resolvers/testUtils";

describe("saveBook", () => {
  it("handles this business case", () => {
    fail();
  });
});

function runSaveBook(ctx: Context, inputFn: () => BookInput) {
  return run(ctx, (ctx) => saveBook.saveBook({}, { input: inputFn() }, ctx, undefined!));
}
