import { createTestSchema, runPlugin, getFile } from "./utils/test-helpers";

describe("Subscription resolver scaffolding", () => {
  it("generates subscription resolver scaffolding without args", async () => {
    const schema = createTestSchema(`
      type Subscription {
        authorSaved: Author!
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

    // Check that the subscription resolver file was generated
    const subscriptionFile = getFile(files, "authorSavedSubscription.ts");
    expect(subscriptionFile).toMatchInlineSnapshot(`
      "import { SubscriptionResolvers } from "src/generated/graphql-types";

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
      "
    `);

    // Check that the test file was generated
    const testFile = getFile(files, "authorSavedSubscription.test.ts");
    expect(testFile).toMatchInlineSnapshot(`
      "import { Context } from "src/context";
      import { authorSaved } from "src/resolvers/GraphQL";
      import { run } from "src/resolvers/testUtils";

      describe("authorSaved", () => {
        it("handles this business case", () => {
          fail();
        });
      });

      function runAuthorSaved(ctx: Context, argsFn: () => {}) {
        return run(ctx, (ctx) => authorSaved.authorSaved.subscribe(undefined, argsFn(), ctx, undefined!));
      }
      "
    `);

    // Check that the barrel file was generated
    const barrelFile = getFile(files, "subscriptions/index.ts");
    expect(barrelFile).toMatchInlineSnapshot(`
      "import { SubscriptionResolvers } from "src/generated/graphql-types";
      import { authorSaved } from "src/resolvers/GraphQL";

      // This file is auto-generated

      export const subscriptionResolvers: SubscriptionResolvers = { ...authorSaved };
      "
    `);
  });

  it("generates subscription resolver scaffolding with args (filtering)", async () => {
    const schema = createTestSchema(`
      type Subscription {
        bookSaved(startsWith: String): Book
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
        Book: "src/entities#Book",
      },
    });

    // Check that the subscription resolver file was generated with withFilter
    const subscriptionFile = getFile(files, "bookSavedSubscription.ts");
    expect(subscriptionFile).toMatchInlineSnapshot(`
      "import { withFilter } from "graphql-subscriptions";
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
      "
    `);

    // Check that the test file was generated
    const testFile = getFile(files, "bookSavedSubscription.test.ts");
    expect(testFile).toMatchInlineSnapshot(`
      "import { Context } from "src/context";
      import { SubscriptionBookSavedArgs } from "src/generated/graphql-types";
      import { bookSaved } from "src/resolvers/GraphQL";
      import { run } from "src/resolvers/testUtils";

      describe("bookSaved", () => {
        it("handles this business case", () => {
          fail();
        });
      });

      function runBookSaved(ctx: Context, argsFn: () => SubscriptionBookSavedArgs) {
        return run(ctx, (ctx) => bookSaved.bookSaved.subscribe(undefined, argsFn(), ctx, undefined!));
      }
      "
    `);
  });

  it("generates multiple subscription resolvers", async () => {
    const schema = createTestSchema(`
      type Subscription {
        authorSaved: Author!
        bookSaved: Book!
        userLoggedIn(userId: ID): User
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

      type Query {
        dummy: String
      }
    `);

    const files = await runPlugin(schema, {
      mappers: {
        Author: "src/entities#Author",
        Book: "src/entities#Book",
        User: "src/entities#User",
      },
    });

    // Check that all subscription resolver files were generated
    expect(getFile(files, "authorSavedSubscription.ts")).toBeDefined();
    expect(getFile(files, "bookSavedSubscription.ts")).toBeDefined();
    expect(getFile(files, "userLoggedInSubscription.ts")).toBeDefined();

    // Check that the barrel file includes all subscriptions
    const barrelFile = getFile(files, "subscriptions/index.ts");
    expect(barrelFile).toMatchInlineSnapshot(`
      "import { SubscriptionResolvers } from "src/generated/graphql-types";
      import { authorSaved, bookSaved, userLoggedIn } from "src/resolvers/GraphQL";

      // This file is auto-generated

      export const subscriptionResolvers: SubscriptionResolvers = { ...authorSaved, ...bookSaved, ...userLoggedIn };
      "
    `);
  });
});
