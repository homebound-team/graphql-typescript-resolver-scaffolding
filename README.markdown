This is a [graphql-code-generator](https://graphql-code-generator.com/) plugin that generates scaffolding for resolvers.

Currently this only supports mutation, and they're extremely simple, just placeholders for your business logic and tests.

I.e. given:

```graphql
type Mutations {
  foo(input: FooInput): FooResult @org(category: "things")
}
```

These two files will be generated:

- `src/resolvers/mutations/things/foo.ts`
- `src/resolvers/mutations/things/foo.test.ts`

With some minimal boilerplate included.

## Assumptions

- Your context type is named `Context` and in `src/context`
- You have `@src/...` import alias setup
- You have a `src/mutations/testUtils` module with a `run` method
