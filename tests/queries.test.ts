import { createTestSchema, runPlugin, getFile } from "./utils/test-helpers";

describe("Query resolver scaffolding", () => {
  it("generates query resolver scaffolding with args", async () => {
    const schema = createTestSchema(`
      type Query {
        authors(id: ID): [Author!]!
      }

      type Author {
        name: String!
      }
    `);

    const files = await runPlugin(schema, {
      mappers: {
        Author: "src/entities#Author",
      },
    });

    // Check that the query resolver file was generated
    const queryFile = getFile(files, "authorsQuery.ts");
    expect(queryFile).toMatchInlineSnapshot(`
      "import { QueryResolvers } from "src/generated/graphql-types";

      export const authors: Pick<QueryResolvers, "authors"> = {
        async authors(root, args, ctx) {
          throw new Error("not implemented");
        },
      };
      "
    `);

    // Check that the test file was generated
    const testFile = getFile(files, "authorsQuery.test.ts");
    expect(testFile).toMatchInlineSnapshot(`
      "import { Context } from "src/context";
      import { QueryAuthorsArgs } from "src/generated/graphql-types";
      import { authors } from "src/resolvers/GraphQL";
      import { run } from "src/resolvers/testUtils";

      describe("authors", () => {
        it("handles this business case", () => {
          fail();
        });
      });

      function runAuthors(ctx: Context, argsFn: () => QueryAuthorsArgs) {
        return run(ctx, (ctx) => authors.authors({}, argsFn(), ctx, undefined!));
      }
      "
    `);

    // Check that the barrel file was generated
    const barrelFile = getFile(files, "queries/index.ts");
    expect(barrelFile).toMatchInlineSnapshot(`
      "import { QueryResolvers } from "src/generated/graphql-types";
      import { authors } from "src/resolvers/GraphQL";

      // This file is auto-generated

      export const queryResolvers: QueryResolvers = { ...authors };
      "
    `);
  });

  it("generates query resolver scaffolding without args", async () => {
    const schema = createTestSchema(`
      type Query {
        books: [Book!]!
      }

      type Book {
        title: String!
      }
    `);

    const files = await runPlugin(schema, {
      mappers: {
        Book: "src/entities#Book",
      },
    });

    // Check that the query resolver file was generated
    const queryFile = getFile(files, "booksQuery.ts");
    expect(queryFile).toMatchInlineSnapshot(`
      "import { QueryResolvers } from "src/generated/graphql-types";

      export const books: Pick<QueryResolvers, "books"> = {
        async books(root, args, ctx) {
          throw new Error("not implemented");
        },
      };
      "
    `);

    // Check that the test file was generated
    const testFile = getFile(files, "booksQuery.test.ts");
    expect(testFile).toMatchInlineSnapshot(`
      "import { Context } from "src/context";
      import { books } from "src/resolvers/GraphQL";
      import { run } from "src/resolvers/testUtils";

      describe("books", () => {
        it("handles this business case", () => {
          fail();
        });
      });

      function runBooks(ctx: Context, argsFn: () => {}) {
        return run(ctx, (ctx) => books.books({}, argsFn(), ctx, undefined!));
      }
      "
    `);
  });

  it("generates multiple query resolvers", async () => {
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
        Book: "src/entities#Book",
        User: "src/entities#User",
      },
    });

    // Check that all query resolver files were generated
    expect(getFile(files, "authorsQuery.ts")).toBeDefined();
    expect(getFile(files, "booksQuery.ts")).toBeDefined();
    expect(getFile(files, "usersQuery.ts")).toBeDefined();

    // Check that the barrel file includes all queries
    const barrelFile = getFile(files, "queries/index.ts");
    expect(barrelFile).toMatchInlineSnapshot(`
      "import { QueryResolvers } from "src/generated/graphql-types";
      import { authors, books, users } from "src/resolvers/GraphQL";

      // This file is auto-generated

      export const queryResolvers: QueryResolvers = { ...authors, ...books, ...users };
      "
    `);
  });
});
