import { createTestSchema, runPlugin, formatFilesForSnapshot } from "./utils/test-helpers";

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

    expect(formatFilesForSnapshot(files)).toMatchInlineSnapshot(`
     "File: src/resolvers/mutations/index.ts
     =======================================================
     import type { MutationResolvers } from "src/generated/graphql-types";
     import { noInputMutation } from "src/resolvers/mutations/noInputMutationMutation";
     import { saveAuthor } from "src/resolvers/mutations/saveAuthorMutation";

     // This file is auto-generated

     export const mutationResolvers: MutationResolvers = { ...saveAuthor, ...noInputMutation };


     File: src/resolvers/mutations/noInputMutationMutation.test.ts
     =======================================================
     import type { Context } from "src/context";
     import { noInputMutation } from "src/resolvers/mutations/noInputMutationMutation";
     import { run } from "src/resolvers/testUtils";

     describe("noInputMutation", () => {
       it.withCtx("handles this business case", async (ctx) => {
         // Given ...
         // When ...
         // Then ...
         fail();
       });
     });

     function runMutation(ctx: Context) {
       return run(ctx, (ctx) => noInputMutation.noInputMutation({}, {}, ctx, undefined!));
     }


     File: src/resolvers/mutations/noInputMutationMutation.ts
     =======================================================
     import type { MutationResolvers } from "src/generated/graphql-types";

     export const noInputMutation: Pick<MutationResolvers, "noInputMutation"> = {
       async noInputMutation(root, args, ctx) {
         throw new Error("not implemented");
       },
     };


     File: src/resolvers/mutations/saveAuthorMutation.test.ts
     =======================================================
     import { saveAuthor } from "src/resolvers/mutations/saveAuthorMutation";
     import { makeRunInputMutation } from "src/resolvers/testUtils";

     describe("saveAuthor", () => {
       it.withCtx("handles this business case", async (ctx) => {
         // Given ...
         // When ...
         // Then ...
         fail();
       });
     });

     const runMutation = makeRunInputMutation(saveAuthor);


     File: src/resolvers/mutations/saveAuthorMutation.ts
     =======================================================
     import type { MutationResolvers } from "src/generated/graphql-types";

     export const saveAuthor: Pick<MutationResolvers, "saveAuthor"> = {
       async saveAuthor(root, args, ctx) {
         throw new Error("not implemented");
       },
     };


     File: src/resolvers/objects/authorResolvers.test.ts
     =======================================================
     import { authorResolvers } from "src/resolvers/objects/authorResolvers";
     import { makeRunObjectField, makeRunObjectFields } from "src/resolvers/testUtils";

     describe("authorResolvers", () => {
       it.withCtx("handles this business case", async (ctx) => {
         // Given ...
         // When ...
         // Then ...
         fail();
       });
     });

     const runFields = makeRunObjectFields(authorResolvers);
     const runField = makeRunObjectField(authorResolvers);


     File: src/resolvers/objects/authorResolvers.ts
     =======================================================
     import type { AuthorResolvers } from "src/generated/graphql-types";

     // @ts-ignore not implemented
     export const authorResolvers: AuthorResolvers = {};


     File: src/resolvers/objects/index.ts
     =======================================================
     import { authorResolvers } from "src/resolvers/objects/authorResolvers";

     // This file is auto-generated

     export const objectResolvers = { Author: authorResolvers };


     File: src/resolvers/queries/dummyQuery.test.ts
     =======================================================
     import { dummy } from "src/resolvers/queries/dummyQuery";
     import { makeRunQuery } from "src/resolvers/testUtils";

     describe("dummy", () => {
       it.withCtx("handles this business case", async (ctx) => {
         // Given ...
         // When ...
         // Then ...
         fail();
       });
     });

     const runQuery = makeRunQuery(dummy);


     File: src/resolvers/queries/dummyQuery.ts
     =======================================================
     import type { QueryResolvers } from "src/generated/graphql-types";

     export const dummy: Pick<QueryResolvers, "dummy"> = {
       async dummy(root, args, ctx) {
         throw new Error("not implemented");
       },
     };


     File: src/resolvers/queries/index.ts
     =======================================================
     import type { QueryResolvers } from "src/generated/graphql-types";
     import { dummy } from "src/resolvers/queries/dummyQuery";

     // This file is auto-generated

     export const queryResolvers: QueryResolvers = { ...dummy };
     "
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

  it("uses the input helper for a required object input", async () => {
    // Given a mutation with exactly one required input argument
    const schema = createMutationSchema("(input: AuthorInput!)");

    // When its test is scaffolded
    const files = await runPlugin(schema);

    // Then the helper receives the whole resolver without context or input-type imports
    expect(files["src/resolvers/mutations/saveAuthorMutation.test.ts"]).toMatchInlineSnapshot(`
     "import { saveAuthor } from "src/resolvers/mutations/saveAuthorMutation";
     import { makeRunInputMutation } from "src/resolvers/testUtils";

     describe("saveAuthor", () => {
       it.withCtx("handles this business case", async (ctx) => {
         // Given ...
         // When ...
         // Then ...
         fail();
       });
     });

     const runMutation = makeRunInputMutation(saveAuthor);
     "
    `);
  });

  it("uses the input helper for a nullable object input", async () => {
    // Given a mutation with exactly one nullable input argument
    const schema = createMutationSchema("(input: AuthorInput)");

    // When its test is scaffolded
    const files = await runPlugin(schema);

    // Then the helper receives the whole resolver without context or input-type imports
    expect(files["src/resolvers/mutations/saveAuthorMutation.test.ts"]).toMatchInlineSnapshot(`
     "import { saveAuthor } from "src/resolvers/mutations/saveAuthorMutation";
     import { makeRunInputMutation } from "src/resolvers/testUtils";

     describe("saveAuthor", () => {
       it.withCtx("handles this business case", async (ctx) => {
         // Given ...
         // When ...
         // Then ...
         fail();
       });
     });

     const runMutation = makeRunInputMutation(saveAuthor);
     "
    `);
  });

  it("uses the input helper for a scalar input", async () => {
    // Given a mutation with exactly one scalar input argument
    const schema = createMutationSchema("(input: String!)");

    // When its test is scaffolded
    const files = await runPlugin(schema);

    // Then the helper receives the whole resolver without context or input-type imports
    expect(files["src/resolvers/mutations/saveAuthorMutation.test.ts"]).toMatchInlineSnapshot(`
     "import { saveAuthor } from "src/resolvers/mutations/saveAuthorMutation";
     import { makeRunInputMutation } from "src/resolvers/testUtils";

     describe("saveAuthor", () => {
       it.withCtx("handles this business case", async (ctx) => {
         // Given ...
         // When ...
         // Then ...
         fail();
       });
     });

     const runMutation = makeRunInputMutation(saveAuthor);
     "
    `);
  });

  it("uses the input helper for a list input", async () => {
    // Given a mutation with exactly one list input argument
    const schema = createMutationSchema("(input: [String!]!)");

    // When its test is scaffolded
    const files = await runPlugin(schema);

    // Then the helper receives the whole resolver without context or input-type imports
    expect(files["src/resolvers/mutations/saveAuthorMutation.test.ts"]).toMatchInlineSnapshot(`
     "import { saveAuthor } from "src/resolvers/mutations/saveAuthorMutation";
     import { makeRunInputMutation } from "src/resolvers/testUtils";

     describe("saveAuthor", () => {
       it.withCtx("handles this business case", async (ctx) => {
         // Given ...
         // When ...
         // Then ...
         fail();
       });
     });

     const runMutation = makeRunInputMutation(saveAuthor);
     "
    `);
  });

  it("passes empty arguments through the fallback runner for a zero-argument mutation", async () => {
    // Given a mutation without arguments
    const schema = createMutationSchema("");

    // When its test is scaffolded with custom ESM imports
    const files = await runPlugin(schema, fallbackConfig);

    // Then the fallback uses the configured context and passes {}
    expect(files["src/custom/resolvers/mutations/saveAuthorMutation.test.ts"]).toMatchInlineSnapshot(`
     "import type { AppContext } from "src/custom/context.js";
     import { saveAuthor } from "src/custom/resolvers/mutations/saveAuthorMutation.js";
     import { run } from "src/custom/testUtils.js";

     describe("saveAuthor", () => {
       it.withCtx("handles this business case", async (ctx) => {
         // Given ...
         // When ...
         // Then ...
         fail();
       });
     });

     function runMutation(ctx: AppContext) {
       return run(ctx, (ctx) => saveAuthor.saveAuthor({}, {}, ctx, undefined!));
     }
     "
    `);
  });

  it("passes a non-input argument through the fallback runner", async () => {
    // Given a mutation with an argument named author
    const schema = createMutationSchema("(author: AuthorInput!)");

    // When its test is scaffolded with custom ESM imports
    const files = await runPlugin(schema, fallbackConfig);

    // Then the fallback uses the configured context and complete argument type
    expect(files["src/custom/resolvers/mutations/saveAuthorMutation.test.ts"]).toMatchInlineSnapshot(`
     "import type { AppContext } from "src/custom/context.js";
     import type { MutationSaveAuthorArgs } from "src/custom/graphql-types.js";
     import { saveAuthor } from "src/custom/resolvers/mutations/saveAuthorMutation.js";
     import { run } from "src/custom/testUtils.js";

     describe("saveAuthor", () => {
       it.withCtx("handles this business case", async (ctx) => {
         // Given ...
         // When ...
         // Then ...
         fail();
       });
     });

     function runMutation(ctx: AppContext, argsFn: () => MutationSaveAuthorArgs) {
       return run(ctx, (ctx) => saveAuthor.saveAuthor({}, argsFn(), ctx, undefined!));
     }
     "
    `);
  });

  it("passes input and additional arguments through the fallback runner", async () => {
    // Given a mutation with input and dryRun arguments
    const schema = createMutationSchema("(input: AuthorInput!, dryRun: Boolean!)");

    // When its test is scaffolded with custom ESM imports
    const files = await runPlugin(schema, fallbackConfig);

    // Then the fallback uses the configured context and complete argument type
    expect(files["src/custom/resolvers/mutations/saveAuthorMutation.test.ts"]).toMatchInlineSnapshot(`
     "import type { AppContext } from "src/custom/context.js";
     import type { MutationSaveAuthorArgs } from "src/custom/graphql-types.js";
     import { saveAuthor } from "src/custom/resolvers/mutations/saveAuthorMutation.js";
     import { run } from "src/custom/testUtils.js";

     describe("saveAuthor", () => {
       it.withCtx("handles this business case", async (ctx) => {
         // Given ...
         // When ...
         // Then ...
         fail();
       });
     });

     function runMutation(ctx: AppContext, argsFn: () => MutationSaveAuthorArgs) {
       return run(ctx, (ctx) => saveAuthor.saveAuthor({}, argsFn(), ctx, undefined!));
     }
     "
    `);
  });

  it("passes multiple non-input arguments through the fallback runner", async () => {
    // Given a mutation with id and name arguments
    const schema = createMutationSchema("(id: ID!, name: String)");

    // When its test is scaffolded with custom ESM imports
    const files = await runPlugin(schema, fallbackConfig);

    // Then the fallback uses the configured context and complete argument type
    expect(files["src/custom/resolvers/mutations/saveAuthorMutation.test.ts"]).toMatchInlineSnapshot(`
     "import type { AppContext } from "src/custom/context.js";
     import type { MutationSaveAuthorArgs } from "src/custom/graphql-types.js";
     import { saveAuthor } from "src/custom/resolvers/mutations/saveAuthorMutation.js";
     import { run } from "src/custom/testUtils.js";

     describe("saveAuthor", () => {
       it.withCtx("handles this business case", async (ctx) => {
         // Given ...
         // When ...
         // Then ...
         fail();
       });
     });

     function runMutation(ctx: AppContext, argsFn: () => MutationSaveAuthorArgs) {
       return run(ctx, (ctx) => saveAuthor.saveAuthor({}, argsFn(), ctx, undefined!));
     }
     "
    `);
  });
});

const fallbackConfig = {
  emitLegacyCommonJSImports: false,
  contextType: "src/custom/context#AppContext",
  graphqlTypesPath: "src/custom/graphql-types",
  resolversPath: "src/custom/resolvers",
  testUtilsPath: "src/custom/testUtils",
};

/** Creates a mutation schema with the supplied argument declaration. */
function createMutationSchema(args: string) {
  return createTestSchema(`
    type Query { dummy: String }
    type Mutation { saveAuthor${args}: Boolean }
    input AuthorInput { name: String }
  `);
}
