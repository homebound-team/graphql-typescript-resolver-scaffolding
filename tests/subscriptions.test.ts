import { createTestSchema, runPlugin, getFile } from "./utils/test-helpers";

describe("Subscription resolver scaffolding", () => {
  it("generates expected subscription files with standard configuration", async () => {
    const schema = createTestSchema(`
      type Subscription {
        authorSaved: Author!
        bookSaved(startsWith: String): Book
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
       "src/resolvers/subscriptions/authorSavedSubscription.test.ts": "import type { Context } from "src/context";
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
       "src/resolvers/subscriptions/bookSavedSubscription.test.ts": "import type { Context } from "src/context";
     import { SubscriptionBookSavedArgs } from "src/generated/graphql-types";
     import { bookSaved } from "src/resolvers/subscriptions/bookSavedSubscription";
     import { run } from "src/resolvers/testUtils";

     describe("bookSaved", () => {
       it("handles this business case", () => {
         fail();
       });
     });

     function runBookSaved(ctx: Context, argsFn: () => SubscriptionBookSavedArgs) {
       return run(ctx, (ctx) => bookSaved.bookSaved.subscribe(undefined, argsFn(), ctx, undefined!));
     }
     ",
       "src/resolvers/subscriptions/bookSavedSubscription.ts": "import { withFilter } from "graphql-subscriptions";
     import { SubscriptionBookSavedArgs, SubscriptionResolvers } from "src/generated/graphql-types";

     export const BookSavedEvent = "BookSavedEvent";

     export const bookSaved: Pick<SubscriptionResolvers, "bookSaved"> = {
       bookSaved: {
         subscribe: withFilter(() => {
           // likely can import pubsub implementation and uncomment next line
           // return pubsub.asyncIterator(BookSavedEvent);
           throw new Error("not implemented");
         }, (payload, args: SubscriptionBookSavedArgs) => {
           // return true if payload / args should result in notification
           throw new Error("not implemented");
         }),
       },
     };
     ",
       "src/resolvers/subscriptions/index.ts": "import { SubscriptionResolvers } from "src/generated/graphql-types";
     import { authorSaved } from "src/resolvers/subscriptions/authorSavedSubscription";
     import { bookSaved } from "src/resolvers/subscriptions/bookSavedSubscription";

     // This file is auto-generated

     export const subscriptionResolvers: SubscriptionResolvers = { ...authorSaved, ...bookSaved };
     ",
     }
    `);
  });

  it("does not overwrite existing subscription files", async () => {
    const schema = createTestSchema(`
      type Subscription {
        authorSaved: Author!
        bookSaved(startsWith: String): Book
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
        "src/resolvers/subscriptions/authorSavedSubscription.ts": existingContent,
        "src/resolvers/subscriptions/authorSavedSubscription.test.ts": existingTestContent,
      },
    );

    // Verify that the existing files were not overwritten
    expect(files["src/resolvers/subscriptions/authorSavedSubscription.ts"]).toBe(existingContent);
    expect(files["src/resolvers/subscriptions/authorSavedSubscription.test.ts"]).toBe(existingTestContent);

    // Verify that the bookSaved subscription files were still created (since they didn't exist)
    expect(files["src/resolvers/subscriptions/bookSavedSubscription.ts"]).toBeDefined();
    expect(files["src/resolvers/subscriptions/bookSavedSubscription.ts"]).toContain("bookSaved");
    expect(files["src/resolvers/subscriptions/bookSavedSubscription.test.ts"]).toBeDefined();
  });
});
