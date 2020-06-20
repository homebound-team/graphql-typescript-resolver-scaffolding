This is a [graphql-code-generator](https://graphql-code-generator.com/) plugin that generates scaffolding for resolvers.

The generated scaffolds are extremely simple, and really just placeholders for your business logic and tests.

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

## File Placement

The generator works on a "create file if not already in place" approach, which means you can't really "turn off" certain files that the generator thinks you need, you need to have your existing resolver files already in the place it expects, and then it won't overwrite them.

The placement logic is:

- For types defined in `schema.graphql`
  - Queries go in `src/resolvers/queries/<field-name>.ts`
  - Mutations go in `src/resolvers/mutations/<field-name>.ts`
  - Objects go in `src/resolvers/objects/<type-name>.ts`
- For types defined in `fileName.graphql`
  - `extend type Query`s go in `src/resolvers/queries/<file-name>/<field-name.ts>`
  - `extend type Mutation`s go in `src/resolvers/mutations/<file-name>/<field-name.ts>`
  - Objects go in `src/resolvers/objects/<file-name>/<type-name>.ts`

I.e. each query and mutation gets its own dedicated `<field-name.ts>` file, potentially in a sub-directory based on the file name it's declared in.

Field resolvers for a given object go in a `<type-name.ts>`, potentially in a sub-directory based on the file the object is declared in.

Todo: Think about where `extend type OtherObject` things go, when both in `schema.graphql` (seems uncommon) or `fileName.graphql`. ...in the same sub-directory as `fileName`?

## Assumptions

- Your context type is named `Context` and in `src/context`
- You have `@src/...` import alias setup
- You have a `src/mutations/testUtils` module with a `run` method
- You use the `FooInput`/`FooResult` pattern for mutations
- Your graphql files are in `./schema/*.graphql` files
