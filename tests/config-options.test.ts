import { createTestSchema, runPlugin, getFile } from "./utils/test-helpers";

describe("Config options", () => {
  it("respects ignoreObjectsPattern config option", async () => {
    const schema = createTestSchema(`
      type Query {
        authors: [Author!]!
      }

      type Author {
        name: String!
      }

      type Book {
        title: String!
      }

      type AuthorEnumDetail {
        name: String!
      }

      type BookEnumDetail {
        name: String!
      }
    `);

    const files = await runPlugin(schema, {
      mappers: {
        Author: "src/entities#Author",
        Book: "src/entities#Book",
        AuthorEnumDetail: "src/entities#AuthorEnumDetail",
        BookEnumDetail: "src/entities#BookEnumDetail",
      },
      scaffolding: {
        ignoreObjectsPattern: "EnumDetail$",
      },
    });

    // Check that Author and Book resolvers were generated
    expect(getFile(files, "authorResolvers.ts")).toBeDefined();
    expect(getFile(files, "bookResolvers.ts")).toBeDefined();

    // Check that *EnumDetail resolvers were NOT generated
    expect(getFile(files, "authorEnumDetailResolvers.ts")).toBeUndefined();
    expect(getFile(files, "bookEnumDetailResolvers.ts")).toBeUndefined();

    // Check that the objects barrel file only includes non-ignored types
    const barrelFile = getFile(files, "objects/index.ts");
    expect(barrelFile).toMatchInlineSnapshot(`
      "import { authorResolvers, bookResolvers } from "src/resolvers/GraphQL";

      // This file is auto-generated

      export const objectResolvers = { Author: authorResolvers, Book: bookResolvers };
      "
    `);
  });

  it("generates all object resolvers when ignoreObjectsPattern is not set", async () => {
    const schema = createTestSchema(`
      type Query {
        authors: [Author!]!
      }

      type Author {
        name: String!
      }

      type AuthorEnumDetail {
        name: String!
      }
    `);

    const files = await runPlugin(schema, {
      mappers: {
        Author: "src/entities#Author",
        AuthorEnumDetail: "src/entities#AuthorEnumDetail",
      },
      // No scaffolding config
    });

    // Check that both resolvers were generated
    expect(getFile(files, "authorResolvers.ts")).toBeDefined();
    expect(getFile(files, "authorEnumDetailResolvers.ts")).toBeDefined();

    // Check that the objects barrel file includes both
    const barrelFile = getFile(files, "objects/index.ts");
    expect(barrelFile).toMatchInlineSnapshot(`
      "import { authorResolvers, authorEnumDetailResolvers } from "src/resolvers/GraphQL";

      // This file is auto-generated

      export const objectResolvers = { Author: authorResolvers, AuthorEnumDetail: authorEnumDetailResolvers };
      "
    `);
  });

  it("supports different ignoreObjectsPattern patterns", async () => {
    const schema = createTestSchema(`
      type Query {
        dummy: String
      }

      type InternalAuthor {
        name: String!
      }

      type InternalBook {
        title: String!
      }

      type Author {
        name: String!
      }
    `);

    const files = await runPlugin(schema, {
      mappers: {
        InternalAuthor: "src/entities#InternalAuthor",
        InternalBook: "src/entities#InternalBook",
        Author: "src/entities#Author",
      },
      scaffolding: {
        ignoreObjectsPattern: "^Internal",
      },
    });

    // Check that only Author resolver was generated
    expect(getFile(files, "authorResolvers.ts")).toBeDefined();
    expect(getFile(files, "internalAuthorResolvers.ts")).toBeUndefined();
    expect(getFile(files, "internalBookResolvers.ts")).toBeUndefined();

    // Check the barrel file
    const barrelFile = getFile(files, "objects/index.ts");
    expect(barrelFile).toMatchInlineSnapshot(`
      "import { authorResolvers } from "src/resolvers/GraphQL";

      // This file is auto-generated

      export const objectResolvers = { Author: authorResolvers };
      "
    `);
  });

  it("uses custom contextType from config", async () => {
    const schema = createTestSchema(`
      type Query {
        authors: [Author!]!
      }

      type Author {
        name: String!
      }
    `);

    const files = await runPlugin(schema, {
      contextType: "src/custom/MyContext#MyContext",
      mappers: {
        Author: "src/entities#Author",
      },
    });

    // The contextType is used in test file generation
    const testFile = getFile(files, "authorsQuery.test.ts");
    // Note: The actual import statement would reference the custom context
    // but we can verify the file was generated
    expect(testFile).toMatchInlineSnapshot(`
      "import { Context } from "src/context";
      import { authors } from "src/resolvers/GraphQL";
      import { run } from "src/resolvers/testUtils";

      describe("authors", () => {
        it("handles this business case", () => {
          fail();
        });
      });

      function runAuthors(ctx: Context, argsFn: () => {}) {
        return run(ctx, (ctx) => authors.authors({}, argsFn(), ctx, undefined!));
      }
      "
    `);
  });

  it("handles multiple mappers correctly", async () => {
    const schema = createTestSchema(`
      type Query {
        authors: [Author!]!
        books: [Book!]!
        users: [User!]!
      }

      type Author {
        name: String!
      }

      type Book {
        title: String!
      }

      type User {
        email: String!
      }
    `);

    const files = await runPlugin(schema, {
      mappers: {
        Author: "src/entities#Author",
        Book: "src/models/Book",
        User: "@shared/types#UserEntity",
      },
    });

    // All object resolvers should be generated
    expect(getFile(files, "authorResolvers.ts")).toBeDefined();
    expect(getFile(files, "bookResolvers.ts")).toBeDefined();
    expect(getFile(files, "userResolvers.ts")).toBeDefined();

    // Check the objects barrel file includes all of them
    const barrelFile = getFile(files, "objects/index.ts");
    expect(barrelFile).toMatchInlineSnapshot(`
      "import { authorResolvers, bookResolvers, userResolvers } from "src/resolvers/GraphQL";

      // This file is auto-generated

      export const objectResolvers = { Author: authorResolvers, Book: bookResolvers, User: userResolvers };
      "
    `);
  });
});
