import { Context } from "@src/context";
import { run } from "@src/resolvers/testUtils";
import { saveAuthor } from "@src/resolvers/mutations/author/saveAuthor";

async function runsaveAuthor(ctx: Context, input: Project) {
  return await run(ctx, async () => {
    return saveAuthor.saveAuthor(p.idOrFail, { draftMode: true }, ctx, info);
  });
}
