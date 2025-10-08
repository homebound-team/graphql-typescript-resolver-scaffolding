import { createTestSchema, runPlugin } from "./utils/test-helpers";

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
       "src/resolvers/mutations/index.ts": "import type { MutationResolvers } from "src/generated/graphql-types";
     import { noInputMutation } from "src/resolvers/mutations/noInputMutationMutation";
     import { saveAuthor } from "src/resolvers/mutations/saveAuthorMutation";

     // This file is auto-generated

     export const mutationResolvers: MutationResolvers = { ...saveAuthor, ...noInputMutation };
     ",
       "src/resolvers/mutations/noInputMutationMutation.test.ts": "import type { Context } from "src/context";
     import { noInputMutation } from "src/resolvers/mutations/noInputMutationMutation";
     import { run } from "src/resolvers/testUtils";

     describe("noInputMutation", () => {
       it("handles this business case", () => {
         fail();
       });
     });

     function runNoInputMutation(ctx: Context, inputFn: () => void) {
       return run(ctx, (ctx) => noInputMutation.noInputMutation({}, { input: inputFn() }, ctx, undefined!));
     }
     ",
       "src/resolvers/mutations/noInputMutationMutation.ts": "import type { MutationResolvers } from "src/generated/graphql-types";

     export const noInputMutation: Pick<MutationResolvers, "noInputMutation"> = {
       async noInputMutation(root, args, ctx) {
         throw new Error("not implemented");
       },
     };
     ",
       "src/resolvers/mutations/saveAuthorMutation.test.ts": "import type { Context } from "src/context";
     import type { AuthorInput } from "src/generated/graphql-types";
     import { saveAuthor } from "src/resolvers/mutations/saveAuthorMutation";
     import { run } from "src/resolvers/testUtils";

     describe("saveAuthor", () => {
       it("handles this business case", () => {
         fail();
       });
     });

     function runSaveAuthor(ctx: Context, inputFn: () => AuthorInput) {
       return run(ctx, (ctx) => saveAuthor.saveAuthor({}, { input: inputFn() }, ctx, undefined!));
     }
     ",
       "src/resolvers/mutations/saveAuthorMutation.ts": "import type { MutationResolvers } from "src/generated/graphql-types";

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
       "src/resolvers/objects/authorResolvers.ts": "import type { AuthorResolvers } from "src/generated/graphql-types";

     // @ts-ignore not implemented
     export const authorResolvers: AuthorResolvers = {};
     ",
       "src/resolvers/objects/index.ts": "import { authorResolvers } from "src/resolvers/objects/authorResolvers";

     // This file is auto-generated

     export const objectResolvers = { Author: authorResolvers };
     ",
       "src/resolvers/queries/dummyQuery.test.ts": "import type { Context } from "src/context";
     import { dummy } from "src/resolvers/queries/dummyQuery";
     import { run } from "src/resolvers/testUtils";

     describe("dummy", () => {
       it("handles this business case", () => {
         fail();
       });
     });

     function runDummy(ctx: Context, argsFn: () => {}) {
       return run(ctx, (ctx) => dummy.dummy({}, argsFn(), ctx, undefined!));
     }
     ",
       "src/resolvers/queries/dummyQuery.ts": "import type { QueryResolvers } from "src/generated/graphql-types";

     export const dummy: Pick<QueryResolvers, "dummy"> = {
       async dummy(root, args, ctx) {
         throw new Error("not implemented");
       },
     };
     ",
       "src/resolvers/queries/index.ts": "import type { QueryResolvers } from "src/generated/graphql-types";
     import { dummy } from "src/resolvers/queries/dummyQuery";

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

  it("generates ESM-compatible imports with .js extensions when emitLegacyCommonJSImports is false", async () => {
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
      emitLegacyCommonJSImports: false,
      mappers: {
        Author: "src/entities#Author",
      },
    });

    expect(files).toMatchInlineSnapshot(`
     {
       "src/resolvers/mutations/index.ts": "import type { MutationResolvers } from "src/generated/graphql-types.js";
     import { noInputMutation } from "src/resolvers/mutations/noInputMutationMutation.js";
     import { saveAuthor } from "src/resolvers/mutations/saveAuthorMutation.js";

     // This file is auto-generated

     export const mutationResolvers: MutationResolvers = { ...saveAuthor, ...noInputMutation };
     ",
       "src/resolvers/mutations/noInputMutationMutation.test.ts": "import type { Context } from "src/context.js";
     import { noInputMutation } from "src/resolvers/mutations/noInputMutationMutation.js";
     import { run } from "src/resolvers/testUtils.js";

     describe("noInputMutation", () => {
       it("handles this business case", () => {
         fail();
       });
     });

     function runNoInputMutation(ctx: Context, inputFn: () => void) {
       return run(ctx, (ctx) => noInputMutation.noInputMutation({}, { input: inputFn() }, ctx, undefined!));
     }
     ",
       "src/resolvers/mutations/noInputMutationMutation.ts": "import type { MutationResolvers } from "src/generated/graphql-types.js";

     export const noInputMutation: Pick<MutationResolvers, "noInputMutation"> = {
       async noInputMutation(root, args, ctx) {
         throw new Error("not implemented");
       },
     };
     ",
       "src/resolvers/mutations/saveAuthorMutation.test.ts": "import type { Context } from "src/context.js";
     import type { AuthorInput } from "src/generated/graphql-types.js";
     import { saveAuthor } from "src/resolvers/mutations/saveAuthorMutation.js";
     import { run } from "src/resolvers/testUtils.js";

     describe("saveAuthor", () => {
       it("handles this business case", () => {
         fail();
       });
     });

     function runSaveAuthor(ctx: Context, inputFn: () => AuthorInput) {
       return run(ctx, (ctx) => saveAuthor.saveAuthor({}, { input: inputFn() }, ctx, undefined!));
     }
     ",
       "src/resolvers/mutations/saveAuthorMutation.ts": "import type { MutationResolvers } from "src/generated/graphql-types.js";

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
       "src/resolvers/objects/authorResolvers.ts": "import type { AuthorResolvers } from "src/generated/graphql-types.js";

     // @ts-ignore not implemented
     export const authorResolvers: AuthorResolvers = {};
     ",
       "src/resolvers/objects/index.ts": "import { authorResolvers } from "src/resolvers/objects/authorResolvers.js";

     // This file is auto-generated

     export const objectResolvers = { Author: authorResolvers };
     ",
       "src/resolvers/queries/dummyQuery.test.ts": "import type { Context } from "src/context.js";
     import { dummy } from "src/resolvers/queries/dummyQuery.js";
     import { run } from "src/resolvers/testUtils.js";

     describe("dummy", () => {
       it("handles this business case", () => {
         fail();
       });
     });

     function runDummy(ctx: Context, argsFn: () => {}) {
       return run(ctx, (ctx) => dummy.dummy({}, argsFn(), ctx, undefined!));
     }
     ",
       "src/resolvers/queries/dummyQuery.ts": "import type { QueryResolvers } from "src/generated/graphql-types.js";

     export const dummy: Pick<QueryResolvers, "dummy"> = {
       async dummy(root, args, ctx) {
         throw new Error("not implemented");
       },
     };
     ",
       "src/resolvers/queries/index.ts": "import type { QueryResolvers } from "src/generated/graphql-types.js";
     import { dummy } from "src/resolvers/queries/dummyQuery.js";

     // This file is auto-generated

     export const queryResolvers: QueryResolvers = { ...dummy };
     ",
     }
    `);
  });
});
