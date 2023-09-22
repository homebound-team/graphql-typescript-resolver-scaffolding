import { Context } from "src/context";
import { QueryAuthorsArgs } from "src/generated/graphql-types";
import { authors } from "src/resolvers/queries/authorsResolver";
import { run } from "src/resolvers/testUtils";

describe("authors", () => {
  it("handles this business case", () => {
    fail();
  });
});

async function runAuthors(ctx: Context, argsFn: () => QueryAuthorsArgs) {
  return await run(ctx, async () => {
    return authors.authors({}, argsFn(), ctx, undefined!);
  });
}
