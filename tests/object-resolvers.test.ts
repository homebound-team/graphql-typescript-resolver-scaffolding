import { createTestSchema, runPlugin, getFile } from "./utils/test-helpers";

describe("Object resolver scaffolding", () => {
  it("generates expected object resolver files with standard configuration", async () => {
    const schema = createTestSchema(`
      type Query {
        authors: [Author!]!
      }

      type Author {
        name: String!
        books: [Book!]!
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
       "src/resolvers/queries/index.ts": "import { QueryResolvers } from "src/generated/graphql-types";
     import { authors } from "src/resolvers/queries/authorsQuery";

     // This file is auto-generated

     export const queryResolvers: QueryResolvers = { ...authors };
     ",
     }
    `);
  });

  it("does not generate object resolvers for unmapped types", async () => {
    const schema = createTestSchema(`
      type Query {
        authors: [Author!]!
      }

      type Author {
        name: String!
      }

      type UnmappedType {
        value: String!
      }
    `);

    const files = await runPlugin(schema, {
      mappers: {
        Author: "src/entities#Author",
        // UnmappedType is not in mappers
      },
    });

    // Check that only Author resolver was generated
    expect(getFile(files, "authorResolvers.ts")).toBeDefined();
    expect(getFile(files, "unmappedTypeResolvers.ts")).toBeUndefined();

    // Check that the objects barrel file only includes Author
    const barrelFile = getFile(files, "objects/index.ts");
    expect(barrelFile).toContain("Author");
    expect(barrelFile).not.toContain("UnmappedType");
  });

  it("does not generate object resolvers for Query, Mutation, or Subscription types", async () => {
    const schema = createTestSchema(`
      type Query {
        authors: [Author!]!
      }

      type Mutation {
        saveAuthor(input: AuthorInput!): Author!
      }

      type Subscription {
        authorSaved: Author!
      }

      input AuthorInput {
        name: String
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

    // Check that object resolver was only generated for Author, not Query/Mutation/Subscription
    expect(getFile(files, "authorResolvers.ts")).toBeDefined();
    expect(getFile(files, "queryResolvers.ts")).toBeUndefined();
    expect(getFile(files, "mutationResolvers.ts")).toBeUndefined();
    expect(getFile(files, "subscriptionResolvers.ts")).toBeUndefined();

    // Check that the objects barrel file only includes Author
    const barrelFile = getFile(files, "objects/index.ts");
    expect(barrelFile).toContain("Author");
    expect(barrelFile).not.toContain("Query");
    expect(barrelFile).not.toContain("Mutation");
  });

  it("sorts object resolvers alphabetically in barrel file", async () => {
    const schema = createTestSchema(`
      type Query {
        dummy: String
      }

      type Zebra {
        name: String!
      }

      type Apple {
        color: String!
      }

      type Banana {
        length: Int!
      }
    `);

    const files = await runPlugin(schema, {
      mappers: {
        Zebra: "src/entities#Zebra",
        Apple: "src/entities#Apple",
        Banana: "src/entities#Banana",
      },
    });

    // Check that the objects barrel file has them sorted alphabetically
    const barrelFile = getFile(files, "objects/index.ts");

    // Verify alphabetical order by checking index positions
    const appleIndex = barrelFile!.indexOf("Apple:");
    const bananaIndex = barrelFile!.indexOf("Banana:");
    const zebraIndex = barrelFile!.indexOf("Zebra:");

    expect(appleIndex).toBeLessThan(bananaIndex);
    expect(bananaIndex).toBeLessThan(zebraIndex);
  });
});
