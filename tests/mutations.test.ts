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
       "src/resolvers/mutations/index.ts": "import { MutationResolvers } from "src/generated/graphql-types";
     import { noInputMutation } from "src/resolvers/mutations/noInputMutationMutation";
     import { saveAuthor } from "src/resolvers/mutations/saveAuthorMutation";

     // This file is auto-generated

     export const mutationResolvers: MutationResolvers = { ...saveAuthor, ...noInputMutation };
     ",
       "src/resolvers/mutations/noInputMutationMutation.test.ts": "import { Context } from "src/context";
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
       "src/resolvers/mutations/noInputMutationMutation.ts": "import { MutationResolvers } from "src/generated/graphql-types";

     export const noInputMutation: Pick<MutationResolvers, "noInputMutation"> = {
       async noInputMutation(root, args, ctx) {
         throw new Error("not implemented");
       },
     };
     ",
       "src/resolvers/mutations/saveAuthorMutation.test.ts": "import { Context } from "src/context";
     import { AuthorInput } from "src/generated/graphql-types";
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
       "src/resolvers/mutations/saveAuthorMutation.ts": "import { MutationResolvers } from "src/generated/graphql-types";

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
       "src/resolvers/objects/authorResolvers.ts": "import { AuthorResolvers } from "src/generated/graphql-types";

     // @ts-ignore not implemented
     export const authorResolvers: AuthorResolvers = {};
     ",
       "src/resolvers/objects/index.ts": "import { authorResolvers } from "src/resolvers/objects/authorResolvers";

     // This file is auto-generated

     export const objectResolvers = { Author: authorResolvers };
     ",
       "src/resolvers/queries/dummyQuery.test.ts": "import { Context } from "src/context";
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
       "src/resolvers/queries/dummyQuery.ts": "import { QueryResolvers } from "src/generated/graphql-types";

     export const dummy: Pick<QueryResolvers, "dummy"> = {
       async dummy(root, args, ctx) {
         throw new Error("not implemented");
       },
     };
     ",
       "src/resolvers/queries/index.ts": "import { QueryResolvers } from "src/generated/graphql-types";
     import { dummy } from "src/resolvers/queries/dummyQuery";

     // This file is auto-generated

     export const queryResolvers: QueryResolvers = { ...dummy };
     ",
     }
    `);
  });
});
