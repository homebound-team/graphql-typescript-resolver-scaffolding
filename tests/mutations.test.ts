import { createTestSchema, runPlugin, getFile } from "./utils/test-helpers";

describe("Mutation resolver scaffolding", () => {
  it("generates expected mutation files with standard configuration", async () => {
    const schema = createTestSchema(`
      type Mutation {
        saveAuthor(input: AuthorInput!): SaveAuthorResult!
        noInputMutation: Boolean
      }

      input AuthorInput {
        name: String
      }

      type SaveAuthorResult {
        author: Author!
      }

      type Author {
        name: String!
      }

      type Query {
        dummy: String
      }
    `);

    const files = await runPlugin(schema, {
      mappers: {
        Author: "src/entities#Author",
      },
    });

    expect(files).toMatchInlineSnapshot(`
     {
       "src/resolvers/mutations/index.ts": "import { MutationResolvers } from "src/generated/graphql-types.ts";
     import { noInputMutation } from "src/resolvers/mutations/noInputMutationMutation.ts";
     import { saveAuthor } from "src/resolvers/mutations/saveAuthorMutation.ts";

     // This file is auto-generated

     export const mutationResolvers: MutationResolvers = { ...saveAuthor, ...noInputMutation };
     ",
       "src/resolvers/mutations/noInputMutationMutation.test.ts": "import type { Context } from "src/context.ts";
     import { noInputMutation } from "src/resolvers/mutations/noInputMutationMutation.ts";
     import { run } from "src/resolvers/testUtils.ts";

     describe("noInputMutation", () => {
       it("handles this business case", () => {
         fail();
       });
     });

     function runNoInputMutation(ctx: Context, inputFn: () => void) {
       return run(ctx, (ctx) => noInputMutation.noInputMutation({}, { input: inputFn() }, ctx, undefined!));
     }
     ",
       "src/resolvers/mutations/noInputMutationMutation.ts": "import { MutationResolvers } from "src/generated/graphql-types.ts";

     export const noInputMutation: Pick<MutationResolvers, "noInputMutation"> = {
       async noInputMutation(root, args, ctx) {
         throw new Error("not implemented");
       },
     };
     ",
       "src/resolvers/mutations/saveAuthorMutation.test.ts": "import type { Context } from "src/context.ts";
     import { AuthorInput } from "src/generated/graphql-types.ts";
     import { saveAuthor } from "src/resolvers/mutations/saveAuthorMutation.ts";
     import { run } from "src/resolvers/testUtils.ts";

     describe("saveAuthor", () => {
       it("handles this business case", () => {
         fail();
       });
     });

     function runSaveAuthor(ctx: Context, inputFn: () => AuthorInput) {
       return run(ctx, (ctx) => saveAuthor.saveAuthor({}, { input: inputFn() }, ctx, undefined!));
     }
     ",
       "src/resolvers/mutations/saveAuthorMutation.ts": "import { MutationResolvers } from "src/generated/graphql-types.ts";

     export const saveAuthor: Pick<MutationResolvers, "saveAuthor"> = {
       async saveAuthor(root, args, ctx) {
         throw new Error("not implemented");
       },
     };
     ",
       "src/resolvers/objects/authorResolvers.test.ts": "describe("authorResolvers", () => {
       it("handles this business case", () => {
         fail();
       });
     });
     ",
       "src/resolvers/objects/authorResolvers.ts": "import { AuthorResolvers } from "src/generated/graphql-types.ts";

     // @ts-ignore not implemented
     export const authorResolvers: AuthorResolvers = {};
     ",
       "src/resolvers/objects/index.ts": "import { authorResolvers } from "src/resolvers/objects/authorResolvers.ts";

     // This file is auto-generated

     export const objectResolvers = { Author: authorResolvers };
     ",
       "src/resolvers/queries/dummyQuery.test.ts": "import type { Context } from "src/context.ts";
     import { dummy } from "src/resolvers/queries/dummyQuery.ts";
     import { run } from "src/resolvers/testUtils.ts";

     describe("dummy", () => {
       it("handles this business case", () => {
         fail();
       });
     });

     function runDummy(ctx: Context, argsFn: () => {}) {
       return run(ctx, (ctx) => dummy.dummy({}, argsFn(), ctx, undefined!));
     }
     ",
       "src/resolvers/queries/dummyQuery.ts": "import { QueryResolvers } from "src/generated/graphql-types.ts";

     export const dummy: Pick<QueryResolvers, "dummy"> = {
       async dummy(root, args, ctx) {
         throw new Error("not implemented");
       },
     };
     ",
       "src/resolvers/queries/index.ts": "import { QueryResolvers } from "src/generated/graphql-types.ts";
     import { dummy } from "src/resolvers/queries/dummyQuery.ts";

     // This file is auto-generated

     export const queryResolvers: QueryResolvers = { ...dummy };
     ",
     }
    `);
  });

  it("does not overwrite existing mutation files", async () => {
    const schema = createTestSchema(`
      type Mutation {
        saveAuthor(input: AuthorInput!): SaveAuthorResult!
        noInputMutation: Boolean
      }

      input AuthorInput {
        name: String
      }

      type SaveAuthorResult {
        author: Author!
      }

      type Author {
        name: String!
      }

      type Query {
        dummy: String
      }
    `);

    const existingContent = "// This is existing content that should not be overwritten";
    const existingTestContent = "// This is existing test content that should not be overwritten";

    const files = await runPlugin(
      schema,
      {
        mappers: {
          Author: "src/entities#Author",
        },
      },
      {
        "src/resolvers/mutations/saveAuthorMutation.ts": existingContent,
        "src/resolvers/mutations/saveAuthorMutation.test.ts": existingTestContent,
      },
    );

    // Verify that the existing files were not overwritten
    expect(files["src/resolvers/mutations/saveAuthorMutation.ts"]).toBe(existingContent);
    expect(files["src/resolvers/mutations/saveAuthorMutation.test.ts"]).toBe(existingTestContent);

    // Verify that the noInputMutation files were still created (since they didn't exist)
    expect(files["src/resolvers/mutations/noInputMutationMutation.ts"]).toBeDefined();
    expect(files["src/resolvers/mutations/noInputMutationMutation.ts"]).toContain("noInputMutation");
    expect(files["src/resolvers/mutations/noInputMutationMutation.test.ts"]).toBeDefined();
  });
});
