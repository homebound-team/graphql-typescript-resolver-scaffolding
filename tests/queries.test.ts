import { createTestSchema, runPlugin, getFile } from "./utils/test-helpers";

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

    expect(files).toMatchInlineSnapshot(`
     {
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
       "src/resolvers/objects/bookResolvers.test.ts": "describe("bookResolvers", () => {
       it("handles this business case", () => {
         fail();
       });
     });
     ",
       "src/resolvers/objects/bookResolvers.ts": "import type { BookResolvers } from "src/generated/graphql-types";

     // @ts-ignore not implemented
     export const bookResolvers: BookResolvers = {};
     ",
       "src/resolvers/objects/index.ts": "import { authorResolvers } from "src/resolvers/objects/authorResolvers";
     import { bookResolvers } from "src/resolvers/objects/bookResolvers";

     // This file is auto-generated

     export const objectResolvers = { Author: authorResolvers, Book: bookResolvers };
     ",
       "src/resolvers/queries/authorsQuery.test.ts": "import type { Context } from "src/context";
     import type { QueryAuthorsArgs } from "src/generated/graphql-types";
     import { authors } from "src/resolvers/queries/authorsQuery";
     import { run } from "src/resolvers/testUtils";

     describe("authors", () => {
       it("handles this business case", () => {
         fail();
       });
     });

     function runAuthors(ctx: Context, argsFn: () => QueryAuthorsArgs) {
       return run(ctx, (ctx) => authors.authors({}, argsFn(), ctx, undefined!));
     }
     ",
       "src/resolvers/queries/authorsQuery.ts": "import type { QueryResolvers } from "src/generated/graphql-types";

     export const authors: Pick<QueryResolvers, "authors"> = {
       async authors(root, args, ctx) {
         throw new Error("not implemented");
       },
     };
     ",
       "src/resolvers/queries/booksQuery.test.ts": "import type { Context } from "src/context";
     import { books } from "src/resolvers/queries/booksQuery";
     import { run } from "src/resolvers/testUtils";

     describe("books", () => {
       it("handles this business case", () => {
         fail();
       });
     });

     function runBooks(ctx: Context, argsFn: () => {}) {
       return run(ctx, (ctx) => books.books({}, argsFn(), ctx, undefined!));
     }
     ",
       "src/resolvers/queries/booksQuery.ts": "import type { QueryResolvers } from "src/generated/graphql-types";

     export const books: Pick<QueryResolvers, "books"> = {
       async books(root, args, ctx) {
         throw new Error("not implemented");
       },
     };
     ",
       "src/resolvers/queries/index.ts": "import type { QueryResolvers } from "src/generated/graphql-types";
     import { authors } from "src/resolvers/queries/authorsQuery";
     import { books } from "src/resolvers/queries/booksQuery";

     // This file is auto-generated

     export const queryResolvers: QueryResolvers = { ...authors, ...books };
     ",
     }
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

  it("generates ESM-compatible imports with .js extensions when emitLegacyCommonJSImports is false", async () => {
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
      emitLegacyCommonJSImports: false,
      mappers: {
        Author: "src/entities#Author",
        Book: "src/entities#Book",
      },
    });

    expect(files).toMatchInlineSnapshot(`
     {
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
       "src/resolvers/objects/bookResolvers.test.ts": "describe("bookResolvers", () => {
       it("handles this business case", () => {
         fail();
       });
     });
     ",
       "src/resolvers/objects/bookResolvers.ts": "import type { BookResolvers } from "src/generated/graphql-types.js";

     // @ts-ignore not implemented
     export const bookResolvers: BookResolvers = {};
     ",
       "src/resolvers/objects/index.ts": "import { authorResolvers } from "src/resolvers/objects/authorResolvers.js";
     import { bookResolvers } from "src/resolvers/objects/bookResolvers.js";

     // This file is auto-generated

     export const objectResolvers = { Author: authorResolvers, Book: bookResolvers };
     ",
       "src/resolvers/queries/authorsQuery.test.ts": "import type { Context } from "src/context.js";
     import type { QueryAuthorsArgs } from "src/generated/graphql-types.js";
     import { authors } from "src/resolvers/queries/authorsQuery.js";
     import { run } from "src/resolvers/testUtils.js";

     describe("authors", () => {
       it("handles this business case", () => {
         fail();
       });
     });

     function runAuthors(ctx: Context, argsFn: () => QueryAuthorsArgs) {
       return run(ctx, (ctx) => authors.authors({}, argsFn(), ctx, undefined!));
     }
     ",
       "src/resolvers/queries/authorsQuery.ts": "import type { QueryResolvers } from "src/generated/graphql-types.js";

     export const authors: Pick<QueryResolvers, "authors"> = {
       async authors(root, args, ctx) {
         throw new Error("not implemented");
       },
     };
     ",
       "src/resolvers/queries/booksQuery.test.ts": "import type { Context } from "src/context.js";
     import { books } from "src/resolvers/queries/booksQuery.js";
     import { run } from "src/resolvers/testUtils.js";

     describe("books", () => {
       it("handles this business case", () => {
         fail();
       });
     });

     function runBooks(ctx: Context, argsFn: () => {}) {
       return run(ctx, (ctx) => books.books({}, argsFn(), ctx, undefined!));
     }
     ",
       "src/resolvers/queries/booksQuery.ts": "import type { QueryResolvers } from "src/generated/graphql-types.js";

     export const books: Pick<QueryResolvers, "books"> = {
       async books(root, args, ctx) {
         throw new Error("not implemented");
       },
     };
     ",
       "src/resolvers/queries/index.ts": "import type { QueryResolvers } from "src/generated/graphql-types.js";
     import { authors } from "src/resolvers/queries/authorsQuery.js";
     import { books } from "src/resolvers/queries/booksQuery.js";

     // This file is auto-generated

     export const queryResolvers: QueryResolvers = { ...authors, ...books };
     ",
     }
    `);
  });
});
