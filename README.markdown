This is a [graphql-code-generator](https://graphql-code-generator.com/) plugin that generates scaffolding for resolvers.

Currently this only supports mutation, and they're extremely simple, just placeholders for your business logic and tests.

I.e. given `./schema/schema.graphql`:

```graphql
type Mutations {
  createFoo(input: FooInput): FooResult
}
```

These two files will be generated:

- `src/resolvers/mutations/createFoo.ts`
- `src/resolvers/mutations/createFoo.test.ts`

With some minimal boilerplate included.

If you break up your mutations into multiple files, i.e. `./schema/foo.graphql` :

```graphql
extend type Mutations {
  createFoo(input: FooInput): FooResult
}
```

Then the two files will be located at:

- `src/resolvers/mutations/foo/createFoo.ts`
- `src/resolvers/mutations/foo/createFoo.test.ts`

## Assumptions

- Your context type is named `Context` and in `src/context`
- You have `@src/...` import alias setup
- You have a `src/mutations/testUtils` module with a `run` method
- You use the `FooInput`/`FooResult` pattern for mutations
- Your graphql files are in `./schema/*.graphql` files
