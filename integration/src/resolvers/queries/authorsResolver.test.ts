import { Context } from "src/context";
import { QueryAuthorsArgs } from "src/generated/graphql-types";
import { run } from "src/resolvers/testUtils";
import { authors } from "src/resolvers/queries/authorsResolver";

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
