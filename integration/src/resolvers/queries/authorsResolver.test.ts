import { Context } from "@src/context";
import { QueryAuthorsArgs } from "@src/generated/graphql-types";
import { run } from "@src/resolvers/testUtils";
import { authors } from "@src/resolvers/queries/authorsResolver";

describe("authors", () => {
  it("works", () => {});
});

async function runAuthors(ctx: Context, args: QueryAuthorsArgs) {
  return await run(ctx, async () => {
    return authors.authors({}, args, ctx, undefined!);
  });
}
