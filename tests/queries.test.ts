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
       "src/resolvers/objects/authorResolvers.ts": "import { AuthorResolvers } from "src/generated/graphql-types";

     // @ts-ignore not implemented
     export const authorResolvers: AuthorResolvers = {};
     ",
       "src/resolvers/objects/bookResolvers.test.ts": "describe("bookResolvers", () => {
       it("handles this business case", () => {
         fail();
       });
     });
     ",
       "src/resolvers/objects/bookResolvers.ts": "import { BookResolvers } from "src/generated/graphql-types";

     // @ts-ignore not implemented
     export const bookResolvers: BookResolvers = {};
     ",
       "src/resolvers/objects/index.ts": "import { authorResolvers } from "src/resolvers/objects/authorResolvers";
     import { bookResolvers } from "src/resolvers/objects/bookResolvers";

     // This file is auto-generated

     export const objectResolvers = { Author: authorResolvers, Book: bookResolvers };
     ",
       "src/resolvers/queries/authorsQuery.test.ts": "import { Context } from "src/context";
     import { QueryAuthorsArgs } from "src/generated/graphql-types";
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
       "src/resolvers/queries/authorsQuery.ts": "import { QueryResolvers } from "src/generated/graphql-types";

     export const authors: Pick<QueryResolvers, "authors"> = {
       async authors(root, args, ctx) {
         throw new Error("not implemented");
       },
     };
     ",
       "src/resolvers/queries/booksQuery.test.ts": "import { Context } from "src/context";
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
       "src/resolvers/queries/booksQuery.ts": "import { QueryResolvers } from "src/generated/graphql-types";

     export const books: Pick<QueryResolvers, "books"> = {
       async books(root, args, ctx) {
         throw new Error("not implemented");
       },
     };
     ",
       "src/resolvers/queries/index.ts": "import { QueryResolvers } from "src/generated/graphql-types";
     import { authors } from "src/resolvers/queries/authorsQuery";
     import { books } from "src/resolvers/queries/booksQuery";

     // This file is auto-generated

     export const queryResolvers: QueryResolvers = { ...authors, ...books };
     ",
     }
    `);
  });
});
