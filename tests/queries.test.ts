import { createTestSchema, runPlugin, formatFilesForSnapshot } from "./utils/test-helpers";

describe("Query resolver scaffolding", () => {
  it("generates expected query files with standard configuration", async () => {
    const schema = createTestSchema(`
      type Query {
        authors(id: ID): [Author!]!
        books: [Book!]!
      }

      type Author {
        name: String!
      }

      type Book {
        title: String!
      }
    `);

    const files = await runPlugin(schema, {
      mappers: {
        Author: "src/entities#Author",
        Book: "src/entities#Book",
      },
    });

    expect(formatFilesForSnapshot(files)).toMatchInlineSnapshot(`
     "File: src/resolvers/objects/authorResolvers.test.ts
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


     File: src/resolvers/objects/bookResolvers.test.ts
     =======================================================
     import { bookResolvers } from "src/resolvers/objects/bookResolvers";
     import { makeRunObjectField, makeRunObjectFields } from "src/resolvers/testUtils";

     describe("bookResolvers", () => {
       it.withCtx("handles this business case", async (ctx) => {
         // Given ...
         // When ...
         // Then ...
         fail();
       });
     });

     const runFields = makeRunObjectFields(bookResolvers);
     const runField = makeRunObjectField(bookResolvers);


     File: src/resolvers/objects/bookResolvers.ts
     =======================================================
     import type { BookResolvers } from "src/generated/graphql-types";

     // @ts-ignore not implemented
     export const bookResolvers: BookResolvers = {};


     File: src/resolvers/objects/index.ts
     =======================================================
     import { authorResolvers } from "src/resolvers/objects/authorResolvers";
     import { bookResolvers } from "src/resolvers/objects/bookResolvers";

     // This file is auto-generated

     export const objectResolvers = { Author: authorResolvers, Book: bookResolvers };


     File: src/resolvers/queries/authorsQuery.test.ts
     =======================================================
     import { authors } from "src/resolvers/queries/authorsQuery";
     import { makeRunQuery } from "src/resolvers/testUtils";

     describe("authors", () => {
       it.withCtx("handles this business case", async (ctx) => {
         // Given ...
         // When ...
         // Then ...
         fail();
       });
     });

     const runQuery = makeRunQuery(authors);


     File: src/resolvers/queries/authorsQuery.ts
     =======================================================
     import type { QueryResolvers } from "src/generated/graphql-types";

     export const authors: Pick<QueryResolvers, "authors"> = {
       async authors(root, args, ctx) {
         throw new Error("not implemented");
       },
     };


     File: src/resolvers/queries/booksQuery.test.ts
     =======================================================
     import { books } from "src/resolvers/queries/booksQuery";
     import { makeRunQuery } from "src/resolvers/testUtils";

     describe("books", () => {
       it.withCtx("handles this business case", async (ctx) => {
         // Given ...
         // When ...
         // Then ...
         fail();
       });
     });

     const runQuery = makeRunQuery(books);


     File: src/resolvers/queries/booksQuery.ts
     =======================================================
     import type { QueryResolvers } from "src/generated/graphql-types";

     export const books: Pick<QueryResolvers, "books"> = {
       async books(root, args, ctx) {
         throw new Error("not implemented");
       },
     };


     File: src/resolvers/queries/index.ts
     =======================================================
     import type { QueryResolvers } from "src/generated/graphql-types";
     import { authors } from "src/resolvers/queries/authorsQuery";
     import { books } from "src/resolvers/queries/booksQuery";

     // This file is auto-generated

     export const queryResolvers: QueryResolvers = { ...authors, ...books };
     "
    `);
  });

  it("does not overwrite existing query files", async () => {
    const schema = createTestSchema(`
      type Query {
        authors(id: ID): [Author!]!
        books: [Book!]!
      }

      type Author {
        name: String!
      }

      type Book {
        title: String!
      }
    `);

    const existingContent = "// This is existing content that should not be overwritten";
    const existingTestContent = "// This is existing test content that should not be overwritten";

    const files = await runPlugin(
      schema,
      {
        mappers: {
          Author: "src/entities#Author",
          Book: "src/entities#Book",
        },
      },
      {
        "src/resolvers/queries/authorsQuery.ts": existingContent,
        "src/resolvers/queries/authorsQuery.test.ts": existingTestContent,
      },
    );

    // Verify that the existing files were not overwritten
    expect(files["src/resolvers/queries/authorsQuery.ts"]).toBe(existingContent);
    expect(files["src/resolvers/queries/authorsQuery.test.ts"]).toBe(existingTestContent);

    // Verify that the books query files were still created (since they didn't exist)
    expect(files["src/resolvers/queries/booksQuery.ts"]).toBeDefined();
    expect(files["src/resolvers/queries/booksQuery.ts"]).toContain("books");
    expect(files["src/resolvers/queries/booksQuery.test.ts"]).toBeDefined();
  });

  it("uses the query helper with the complete resolver object", async () => {
    // Given a query with multiple arguments
    const schema = createTestSchema(`type Query { search(term: String!, limit: Int): String }`);

    // When its test is scaffolded
    const files = await runPlugin(schema);

    // Then the helper replaces the context and args wrapper
    expect(files["src/resolvers/queries/searchQuery.test.ts"]).toMatchInlineSnapshot(`
     "import { search } from "src/resolvers/queries/searchQuery";
     import { makeRunQuery } from "src/resolvers/testUtils";

     describe("search", () => {
       it.withCtx("handles this business case", async (ctx) => {
         // Given ...
         // When ...
         // Then ...
         fail();
       });
     });

     const runQuery = makeRunQuery(search);
     "
    `);
  });
});
