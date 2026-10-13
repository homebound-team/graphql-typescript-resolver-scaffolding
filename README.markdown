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

- For types defined in "top-level" schema files like `schema.graphql` and `root.graphql`
  - Queries go in `src/resolvers/queries/<field-name>.ts`
  - Mutations go in `src/resolvers/mutations/<field-name>.ts`
  - Objects go in `src/resolvers/objects/<type-name>.ts`
  - Other "top-level" files include `queries.graphql`, `mutations.graphql`, and `subscriptions.graphql`
- For types defined in `<fileName>.graphql`
  - `extend type Query`s go in `src/resolvers/queries/<file-name>/<field-name.ts>`
  - `extend type Mutation`s go in `src/resolvers/mutations/<file-name>/<field-name.ts>`
  - Objects go in `src/resolvers/objects/<file-name>/<type-name>.ts`

I.e. each query and mutation gets its own dedicated `<field-name.ts>` file, potentially in a sub-directory based on the file name it's declared in.

Field resolvers for a given object go in a `<type-name.ts>`, potentially in a sub-directory based on the file the object is declared in.

Todo: Think about where `extend type OtherObject` things go, when both in `schema.graphql` (seems uncommon) or `fileName.graphql`. ...in the same sub-directory as `fileName`?

## Config

The plugin only generates scaffolds for objects that are mapped types.

- `scaffolding.ignoreObjectsPattern` will ignore certain objects that are mapped types, but you don't want scaffolded
- `resolversPath` sets the scaffold output directory and resolver imports (default: `src/resolvers`).
- `graphqlTypesPath` sets the generated GraphQL types module (default: `src/generated/graphql-types`).
- `testUtilsPath` sets the test helper module (default: `src/resolvers/testUtils`).
- `contextType` sets the context mapper used by mutation fallback and subscription runners (default: `src/context#Context`). Helper-based tests infer the context from the helpers and resolver types.
- `emitLegacyCommonJSImports` defaults to `true`, emitting extensionless imports. Set it to `false` to emit `.js` import extensions for ESM.

For Node.js subpath imports, escape the leading `#` in configuration paths, e.g. `"\\#src/testUtils"` or `"\\#src/context#AppContext"`.

## Generated Tests and Consumer Requirements

New query, mutation, and object tests use a context-aware test interface and an explicitly unfinished business-case placeholder:

```typescript
describe("saveAuthor", () => {
  it.withCtx("handles this business case", async (ctx) => {
    // Given ...
    // When ...
    // Then ...
    fail();
  });
});

const runMutation = makeRunInputMutation(saveAuthor);
```

Configure your test setup to provide and type `it.withCtx(name, async (ctx) => { ... })`. It must supply your application's resolver context. The placeholder also assumes a global `fail()` that fails the test; replace it with meaningful test logic when implementing the business case.

The module configured by `testUtilsPath` must export these factories for the scaffold types you generate:

| Scaffold                                         | Required exports                            | Generated declarations (below `describe`)                                                                             |
| ------------------------------------------------ | ------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| Mutation with exactly one argument named `input` | `makeRunInputMutation`                      | `const runMutation = makeRunInputMutation(saveAuthor);`                                                               |
| Query, with or without arguments                 | `makeRunQuery`                              | `const runQuery = makeRunQuery(authors);`                                                                             |
| Mapped object                                    | `makeRunObjectFields`, `makeRunObjectField` | `const runFields = makeRunObjectFields(authorResolvers);` and `const runField = makeRunObjectField(authorResolvers);` |

Each factory receives the **resolver object**, not an individual resolver method. Use helpers compatible with Joist's helper-based test interface, or provide equivalent application-owned helpers that infer context, argument, root, and result types from these objects. The plugin supplies imports and declarations, not helper implementations or test setup. It has no ORM dependency and object tests do not import mapped root types, entity factories, or `entityResolver`.

The input helper is used for a single argument named `input`, including nullable, scalar, and list inputs. Mutations with other argument shapes retain a wrapper using the configured context, GraphQL types, and `run` helper. For example, `deleteAuthor(id: ID!)` generates:

```typescript
function runMutation(ctx: Context, argsFn: () => MutationDeleteAuthorArgs) {
  return run(ctx, (ctx) => deleteAuthor.deleteAuthor({}, argsFn(), ctx, undefined!));
}
```

Zero-argument mutations instead generate `runMutation(ctx: Context)` and pass `{}` as resolver arguments. Multiple-argument mutations pass the complete generated `Mutation<Field>Args` object, including any `input` argument.

Export `run(ctx, callback)` from `testUtilsPath` if you generate fallback mutation or subscription tests. The callback receives the execution context. Subscriptions keep their subscribe-specific runner and existing test skeleton.

Existing resolver and test files are preserved. These requirements apply to newly created tests; existing tests are not migrated. Barrel files continue to be regenerated.

## Assumptions

- Your configured import paths resolve in your application and test environment
- Your test environment provides the helpers and context-aware interface described above
- Your graphql files are in `./schema/*.graphql` files
