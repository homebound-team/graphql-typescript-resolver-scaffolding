import { createTestSchema, runPlugin, getFile } from "./utils/test-helpers";

describe("Mutation resolver scaffolding", () => {
  it("generates mutation resolver scaffolding with input", async () => {
    const schema = createTestSchema(`
      type Mutation {
        saveAuthor(input: AuthorInput!): SaveAuthorResult!
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

    // Check that the mutation resolver file was generated
    const mutationFile = getFile(files, "saveAuthorMutation.ts");
    expect(mutationFile).toMatchInlineSnapshot(`
      "import { MutationResolvers } from "src/generated/graphql-types";

      export const saveAuthor: Pick<MutationResolvers, "saveAuthor"> = {
        async saveAuthor(root, args, ctx) {
          throw new Error("not implemented");
        },
      };
      "
    `);

    // Check that the test file was generated
    const testFile = getFile(files, "saveAuthorMutation.test.ts");
    expect(testFile).toMatchInlineSnapshot(`
      "import { Context } from "src/context";
      import { AuthorInput } from "src/generated/graphql-types";
      import { saveAuthor } from "src/resolvers/GraphQL";
      import { run } from "src/resolvers/testUtils";

      describe("saveAuthor", () => {
        it("handles this business case", () => {
          fail();
        });
      });

      function runSaveAuthor(ctx: Context, inputFn: () => AuthorInput) {
        return run(ctx, (ctx) => saveAuthor.saveAuthor({}, { input: inputFn() }, ctx, undefined!));
      }
      "
    `);

    // Check that the barrel file was generated
    const barrelFile = getFile(files, "mutations/index.ts");
    expect(barrelFile).toMatchInlineSnapshot(`
      "import { MutationResolvers } from "src/generated/graphql-types";
      import { saveAuthor } from "src/resolvers/GraphQL";

      // This file is auto-generated

      export const mutationResolvers: MutationResolvers = { ...saveAuthor };
      "
    `);
  });

  it("generates mutation resolver scaffolding without input", async () => {
    const schema = createTestSchema(`
      type Mutation {
        noInputMutation: Boolean
      }

      type Query {
        dummy: String
      }
    `);

    const files = await runPlugin(schema, {
      mappers: {},
    });

    // Check that the mutation resolver file was generated
    const mutationFile = getFile(files, "noInputMutationMutation.ts");
    expect(mutationFile).toMatchInlineSnapshot(`
      "import { MutationResolvers } from "src/generated/graphql-types";

      export const noInputMutation: Pick<MutationResolvers, "noInputMutation"> = {
        async noInputMutation(root, args, ctx) {
          throw new Error("not implemented");
        },
      };
      "
    `);

    // Check that the test file was generated
    const testFile = getFile(files, "noInputMutationMutation.test.ts");
    expect(testFile).toMatchInlineSnapshot(`
      "import { Context } from "src/context";
      import { noInputMutation } from "src/resolvers/GraphQL";
      import { run } from "src/resolvers/testUtils";

      describe("noInputMutation", () => {
        it("handles this business case", () => {
          fail();
        });
      });

      function runNoInputMutation(ctx: Context, inputFn: () => void) {
        return run(ctx, (ctx) => noInputMutation.noInputMutation({}, { input: inputFn() }, ctx, undefined!));
      }
      "
    `);
  });

  it("generates multiple mutation resolvers", async () => {
    const schema = createTestSchema(`
      type Mutation {
        saveAuthor(input: AuthorInput!): SaveAuthorResult!
        saveBook(input: BookInput!): SaveBookResult!
        deleteAuthor(input: DeleteAuthorInput!): Boolean!
      }

      input AuthorInput {
        name: String
      }

      input BookInput {
        title: String
      }

      input DeleteAuthorInput {
        id: ID!
      }

      type SaveAuthorResult {
        author: Author!
      }

      type SaveBookResult {
        book: Book!
      }

      type Author {
        name: String!
      }

      type Book {
        title: String!
      }

      type Query {
        dummy: String
      }
    `);

    const files = await runPlugin(schema, {
      mappers: {
        Author: "src/entities#Author",
        Book: "src/entities#Book",
      },
    });

    // Check that all mutation resolver files were generated
    expect(getFile(files, "saveAuthorMutation.ts")).toBeDefined();
    expect(getFile(files, "saveBookMutation.ts")).toBeDefined();
    expect(getFile(files, "deleteAuthorMutation.ts")).toBeDefined();

    // Check that the barrel file includes all mutations
    const barrelFile = getFile(files, "mutations/index.ts");
    expect(barrelFile).toMatchInlineSnapshot(`
      "import { MutationResolvers } from "src/generated/graphql-types";
      import { deleteAuthor, saveAuthor, saveBook } from "src/resolvers/GraphQL";

      // This file is auto-generated

      export const mutationResolvers: MutationResolvers = { ...saveAuthor, ...saveBook, ...deleteAuthor };
      "
    `);
  });
});
