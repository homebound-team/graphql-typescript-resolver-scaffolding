import { createTestSchema, runPlugin, getFile } from "./utils/test-helpers";

describe("Object resolver scaffolding", () => {
  it("generates object resolver scaffolding for mapped types", async () => {
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

    // Check that the object resolver files were generated
    const authorResolverFile = getFile(files, "authorResolvers.ts");
    expect(authorResolverFile).toBeDefined();
    expect(authorResolverFile).toContain("AuthorResolvers");
    expect(authorResolverFile).toMatchInlineSnapshot(`
      "import { AuthorResolvers } from "src/generated/graphql-types";

      // @ts-ignore not implemented
      export const authorResolvers: AuthorResolvers = {};
      "
    `);

    const bookResolverFile = getFile(files, "bookResolvers.ts");
    expect(bookResolverFile).toBeDefined();
    expect(bookResolverFile).toContain("BookResolvers");
    expect(bookResolverFile).toMatchInlineSnapshot(`
      "import { BookResolvers } from "src/generated/graphql-types";

      // @ts-ignore not implemented
      export const bookResolvers: BookResolvers = {};
      "
    `);

    // Check that the test files were generated
    expect(getFile(files, "authorResolvers.test.ts")).toBeDefined();
    expect(getFile(files, "bookResolvers.test.ts")).toBeDefined();

    // Check that the objects barrel file was generated
    const barrelFile = getFile(files, "objects/index.ts");
    expect(barrelFile).toBeDefined();
    expect(barrelFile).toContain("Author");
    expect(barrelFile).toContain("Book");
    expect(barrelFile).toMatchInlineSnapshot(`
      "import { authorResolvers, bookResolvers } from "src/resolvers/GraphQL";

      // This file is auto-generated

      export const objectResolvers = { Author: authorResolvers, Book: bookResolvers };
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
    expect(getFile(files, "authorResolvers.ts")).toBeDefined();
    expect(getFile(files, "unmappedTypeResolvers.ts")).toBeUndefined();

    // Check that the objects barrel file only includes Author
    const barrelFile = getFile(files, "objects/index.ts");
    expect(barrelFile).toBeDefined();
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
    expect(barrelFile).toBeDefined();
    expect(barrelFile).toContain("Author");
    expect(barrelFile).not.toContain("Query");
    expect(barrelFile).not.toContain("Mutation");
    expect(barrelFile).toMatchInlineSnapshot(`
      "import { authorResolvers } from "src/resolvers/GraphQL";

      // This file is auto-generated

      export const objectResolvers = { Author: authorResolvers };
      "
    `);
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

    // Check that the objects barrel file has them sorted
    const barrelFile = getFile(files, "objects/index.ts");
    expect(barrelFile).toBeDefined();

    // Verify alphabetical order by checking index positions
    const appleIndex = barrelFile!.indexOf("Apple:");
    const bananaIndex = barrelFile!.indexOf("Banana:");
    const zebraIndex = barrelFile!.indexOf("Zebra:");

    expect(appleIndex).toBeLessThan(bananaIndex);
    expect(bananaIndex).toBeLessThan(zebraIndex);
    expect(barrelFile).toMatchInlineSnapshot(`
      "import { appleResolvers, bananaResolvers, zebraResolvers } from "src/resolvers/GraphQL";

      // This file is auto-generated

      export const objectResolvers = { Apple: appleResolvers, Banana: bananaResolvers, Zebra: zebraResolvers };
      "
    `);
  });
});
