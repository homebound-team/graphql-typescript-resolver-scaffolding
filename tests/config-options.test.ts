import { createTestSchema, runPlugin, getFile } from "./utils/test-helpers";

describe("Config options", () => {
  it("generates expected files with standard configuration", async () => {
    const schema = createTestSchema(`
      type Query {
        authors: [Author!]!
        books: [Book!]!
      }

      type Mutation {
        saveAuthor(input: SaveAuthorInput!): Author!
      }

      input SaveAuthorInput {
        name: String!
      }

      type Subscription {
        authorSaved: Author!
      }

      type Author {
        id: ID!
        name: String!
        books: [Book!]!
      }

      type Book {
        id: ID!
        title: String!
        author: Author!
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
       "src/resolvers/mutations/index.ts": "import { MutationResolvers } from "src/generated/graphql-types";
     import { saveAuthor } from "src/resolvers/mutations/saveAuthorMutation";

     // This file is auto-generated

     export const mutationResolvers: MutationResolvers = { ...saveAuthor };
     ",
       "src/resolvers/mutations/saveAuthorMutation.test.ts": "import { Context } from "src/context";
     import { SaveAuthorInput } from "src/generated/graphql-types";
     import { saveAuthor } from "src/resolvers/mutations/saveAuthorMutation";
     import { run } from "src/resolvers/testUtils";

     describe("saveAuthor", () => {
       it("handles this business case", () => {
         fail();
       });
     });

     function runSaveAuthor(ctx: Context, inputFn: () => SaveAuthorInput) {
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
     import { authors } from "src/resolvers/queries/authorsQuery";
     import { run } from "src/resolvers/testUtils";

     describe("authors", () => {
       it("handles this business case", () => {
         fail();
       });
     });

     function runAuthors(ctx: Context, argsFn: () => {}) {
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
       "src/resolvers/subscriptions/authorSavedSubscription.test.ts": "import { Context } from "src/context";
     import { authorSaved } from "src/resolvers/subscriptions/authorSavedSubscription";
     import { run } from "src/resolvers/testUtils";

     describe("authorSaved", () => {
       it("handles this business case", () => {
         fail();
       });
     });

     function runAuthorSaved(ctx: Context, argsFn: () => {}) {
       return run(ctx, (ctx) => authorSaved.authorSaved.subscribe(undefined, argsFn(), ctx, undefined!));
     }
     ",
       "src/resolvers/subscriptions/authorSavedSubscription.ts": "import { SubscriptionResolvers } from "src/generated/graphql-types";

     export const AuthorSavedEvent = "AuthorSavedEvent";

     export const authorSaved: Pick<SubscriptionResolvers, "authorSaved"> = {
       authorSaved: {
         subscribe: () => {
           // likely can import pubsub implementation and uncomment next line
           // return pubsub.asyncIterator(AuthorSavedEvent);
           throw new Error("not implemented");
         },
       },
     };
     ",
       "src/resolvers/subscriptions/index.ts": "import { SubscriptionResolvers } from "src/generated/graphql-types";
     import { authorSaved } from "src/resolvers/subscriptions/authorSavedSubscription";

     // This file is auto-generated

     export const subscriptionResolvers: SubscriptionResolvers = { ...authorSaved };
     ",
     }
    `);
  });

  it("respects ignoreObjectsPattern with suffix pattern", async () => {
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
  });

  it("respects ignoreObjectsPattern with prefix pattern", async () => {
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
  });

  // TODO: Fix this test
  // This is a bug today - we are not paying attention to the contextType from the config
  it.skip("uses custom contextType from config", async () => {
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
    expect(testFile).toMatchInlineSnapshot(`
     "import { Context } from "src/context";
     import { authors } from "src/resolvers/queries/authorsQuery";
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
});
