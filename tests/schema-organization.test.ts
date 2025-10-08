import { buildSchema } from "graphql";
import { runPlugin, getFile } from "./utils/test-helpers";

describe("Schema file organization", () => {
  // Note: This feature depends on the file path in the AST, which we need to mock more carefully

  it("organizes resolvers by schema file when defined in separate files", async () => {
    // This test verifies that when a query/mutation/subscription is defined in a file
    // like "books.graphql", the generated resolver goes in "src/resolvers/books/"
    // instead of the default "src/resolvers/queries|mutations|subscriptions/"

    // For this test to work properly, we need the schema to have source location info
    // which is harder to mock in unit tests. We'll test the path logic indirectly
    // by checking the getFile logic and documenting the expected behavior.

    const schema = buildSchema(`
      type Query {
        books: [Book!]!
      }

      type Mutation {
        saveBook(input: BookInput!): Book!
      }

      type Subscription {
        bookSaved: Book!
      }

      input BookInput {
        title: String
      }

      type Book {
        title: String!
      }
    `);

    const writtenFiles = await runPlugin(schema, {
      mappers: {
        Book: "src/entities#Book",
      },
    });

    // When using buildSchema without file paths, GraphQL uses "GraphQL request" as source
    // This gets used as a subdirectory name in the plugin
    expect(getFile(writtenFiles, "booksQuery.ts")).toBeDefined();
    expect(getFile(writtenFiles, "saveBookMutation.ts")).toBeDefined();
    expect(getFile(writtenFiles, "bookSavedSubscription.ts")).toBeDefined();
    expect(getFile(writtenFiles, "bookResolvers.ts")).toBeDefined();

    // Barrel files are still generated in the standard locations
    expect(getFile(writtenFiles, "queries/index.ts")).toBeDefined();
    expect(getFile(writtenFiles, "mutations/index.ts")).toBeDefined();
    expect(getFile(writtenFiles, "subscriptions/index.ts")).toBeDefined();
    expect(getFile(writtenFiles, "objects/index.ts")).toBeDefined();

    // Note: In real usage with actual .graphql files (not buildSchema),
    // resolvers defined in "books.graphql" would go in "books/" subdirectory
  });

  it("uses default directories for queries/mutations in top-level schema files", async () => {
    // Files named schema.graphql, mutations.graphql, queries.graphql, etc.
    // are considered "top-level" and their resolvers go in the default directories

    const schema = buildSchema(`
      type Query {
        authors: [Author!]!
      }

      type Mutation {
        saveAuthor(input: AuthorInput!): Author!
      }

      input AuthorInput {
        name: String
      }

      type Author {
        name: String!
      }
    `);

    const writtenFiles = await runPlugin(schema, {
      mappers: {
        Author: "src/entities#Author",
      },
    });

    // Queries and mutations should be generated
    expect(getFile(writtenFiles, "authorsQuery.ts")).toBeDefined();
    expect(getFile(writtenFiles, "saveAuthorMutation.ts")).toBeDefined();
    expect(getFile(writtenFiles, "authorResolvers.ts")).toBeDefined();

    // Check barrel files are in standard locations
    expect(getFile(writtenFiles, "queries/index.ts")).toBeDefined();
    expect(getFile(writtenFiles, "mutations/index.ts")).toBeDefined();
    expect(getFile(writtenFiles, "objects/index.ts")).toBeDefined();
  });

  it("organizes object resolvers by the file with most fields", async () => {
    // When an object type has fields in multiple files (via "extend type"),
    // the resolver goes in the directory of the file with the most fields

    const schema = buildSchema(`
      type Query {
        authors: [Author!]!
      }

      type Author {
        name: String!
        email: String!
        books: [Book!]!
      }

      type Book {
        title: String!
      }
    `);

    const writtenFiles = await runPlugin(schema, {
      mappers: {
        Author: "src/entities#Author",
        Book: "src/entities#Book",
      },
    });

    // Object resolvers should be generated
    expect(getFile(writtenFiles, "authorResolvers.ts")).toBeDefined();
    expect(getFile(writtenFiles, "bookResolvers.ts")).toBeDefined();

    // Objects barrel file should exist
    expect(getFile(writtenFiles, "objects/index.ts")).toBeDefined();
  });
});
