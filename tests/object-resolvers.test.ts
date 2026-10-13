import { createTestSchema, runPlugin, getFile, formatFilesForSnapshot } from "./utils/test-helpers";

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


     File: src/resolvers/queries/index.ts
     =======================================================
     import type { QueryResolvers } from "src/generated/graphql-types";
     import { authors } from "src/resolvers/queries/authorsQuery";

     // This file is auto-generated

     export const queryResolvers: QueryResolvers = { ...authors };
     "
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
    expect(getFile(files, "src/resolvers/objects/authorResolvers.ts")).toBeDefined();
    expect(getFile(files, "src/resolvers/objects/unmappedTypeResolvers.ts")).toBeUndefined();

    // Check that the objects barrel file only includes Author
    const barrelFile = getFile(files, "src/resolvers/objects/index.ts");
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
    expect(getFile(files, "src/resolvers/objects/authorResolvers.ts")).toBeDefined();
    expect(getFile(files, "src/resolvers/objects/queryResolvers.ts")).toBeUndefined();
    expect(getFile(files, "src/resolvers/objects/mutationResolvers.ts")).toBeUndefined();
    expect(getFile(files, "src/resolvers/objects/subscriptionResolvers.ts")).toBeUndefined();

    // Check that the objects barrel file only includes Author
    const barrelFile = getFile(files, "src/resolvers/objects/index.ts");
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
    const barrelFile = getFile(files, "src/resolvers/objects/index.ts");

    // Verify alphabetical order by checking index positions
    const appleIndex = barrelFile!.indexOf("Apple:");
    const bananaIndex = barrelFile!.indexOf("Banana:");
    const zebraIndex = barrelFile!.indexOf("Zebra:");

    expect(appleIndex).toBeLessThan(bananaIndex);
    expect(bananaIndex).toBeLessThan(zebraIndex);
  });

  it("does not overwrite existing object resolver files", async () => {
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
        "src/resolvers/objects/authorResolvers.ts": existingContent,
        "src/resolvers/objects/authorResolvers.test.ts": existingTestContent,
      },
    );

    // Verify that the existing files were not overwritten
    expect(files["src/resolvers/objects/authorResolvers.ts"]).toBe(existingContent);
    expect(files["src/resolvers/objects/authorResolvers.test.ts"]).toBe(existingTestContent);

    // Verify that the book resolver files were still created (since they didn't exist)
    expect(files["src/resolvers/objects/bookResolvers.ts"]).toBeDefined();
    expect(files["src/resolvers/objects/bookResolvers.ts"]).toContain("bookResolvers");
    expect(files["src/resolvers/objects/bookResolvers.test.ts"]).toBeDefined();
  });

  it("provides both field helpers without assuming an entity root", async () => {
    // Given an object mapped to an application-owned root type
    const schema = createTestSchema(`
      type Query { settings: Settings }
      type Settings { theme: String }
    `);

    // When its test is scaffolded
    const files = await runPlugin(schema, { mappers: { Settings: "src/models#SettingsRoot" } });

    // Then both helpers receive the resolver without importing the mapped root
    expect(files["src/resolvers/objects/settingsResolvers.test.ts"]).toMatchInlineSnapshot(`
     "import { settingsResolvers } from "src/resolvers/objects/settingsResolvers";
     import { makeRunObjectField, makeRunObjectFields } from "src/resolvers/testUtils";

     describe("settingsResolvers", () => {
       it.withCtx("handles this business case", async (ctx) => {
         // Given ...
         // When ...
         // Then ...
         fail();
       });
     });

     const runFields = makeRunObjectFields(settingsResolvers);
     const runField = makeRunObjectField(settingsResolvers);
     "
    `);
  });
});
