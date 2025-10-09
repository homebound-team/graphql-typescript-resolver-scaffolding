import { PluginFunction, Types } from "@graphql-codegen/plugin-helpers";
import { parseMapper, isExternalMapperType } from "@graphql-codegen/visitor-plugin-common";
import { pascalCase, camelCase } from "change-case";
import { promises as fs } from "fs";
import { GraphQLField, GraphQLInputObjectType, GraphQLNonNull, GraphQLObjectType } from "graphql";
import { dirname, join, normalize, isAbsolute } from "path";
import { code, Code, imp, Import } from "ts-poet";
import type { RawConfig } from "@graphql-codegen/visitor-plugin-common";
import type { ToStringOpts } from "ts-poet/build/Code";
import PluginOutput = Types.PluginOutput;

const withFilter = imp("withFilter@graphql-subscriptions");

const fileNamesConsideredTopLevel = [
  "schema.graphql",
  "mutations.graphql",
  "queries.graphql",
  "subscriptions.graphql",
  "root.graphql",
];

interface PluginContext {
  tsPoetConfig: ToStringOpts;
  resolversPath: string;
  graphqlTypesPath: string;
  imports: {
    QueryResolvers: Import;
    MutationResolvers: Import;
    SubscriptionResolvers: Import;
    Context: Import;
    run: Import;
  };
}

/**
 * Given a schema, generates the top-level Query/Mutation/Object resolvers by stitching
 * together the respective individual resolvers at expected locations.
 *
 * We also put scaffolding in each "expected location" place to help engineers
 * know where to put things.
 */
export const plugin: PluginFunction<Config> = async (schema, documents, config) => {
  const {
    emitLegacyCommonJSImports = true,
    contextType = "src/context#Context",
    resolversPath = "src/resolvers",
    graphqlTypesPath = "src/generated/graphql-types",
    testUtilsPath = "src/resolvers/testUtils",
  } = config;
  const ctx: PluginContext = {
    tsPoetConfig: {
      importExtensions: emitLegacyCommonJSImports ? false : "js",
    },
    resolversPath,
    graphqlTypesPath,
    imports: {
      QueryResolvers: toImp(buildSpec(graphqlTypesPath, "QueryResolvers"), {
        typeName: "QueryResolvers",
        isTypeOnlyImport: true,
      }),
      MutationResolvers: toImp(buildSpec(graphqlTypesPath, "MutationResolvers"), {
        typeName: "MutationResolvers",
        isTypeOnlyImport: true,
      }),
      SubscriptionResolvers: toImp(buildSpec(graphqlTypesPath, "SubscriptionResolvers"), {
        typeName: "SubscriptionResolvers",
        isTypeOnlyImport: true,
      }),
      Context: toImp(contextType, { typeName: "Context", isTypeOnlyImport: true }),
      run: toImp(buildSpec(testUtilsPath, "run"), { typeName: "run" }),
    },
  };

  const mutationType = schema.getMutationType();
  if (mutationType) {
    const symbols = await generateMutationScaffolding(ctx, mutationType);
    await writeBarrelFile(ctx, "mutationResolvers", ctx.imports.MutationResolvers, "mutations/index.ts", symbols);
  }

  const queryType = schema.getQueryType();
  if (queryType) {
    const symbols = await generateQueryScaffolding(ctx, queryType);
    await writeBarrelFile(ctx, "queryResolvers", ctx.imports.QueryResolvers, "queries/index.ts", symbols);
  }

  const subscriptionType = schema.getSubscriptionType();
  if (subscriptionType) {
    const symbols = await generateSubscriptionScaffolding(ctx, subscriptionType);
    await writeBarrelFile(
      ctx,
      "subscriptionResolvers",
      ctx.imports.SubscriptionResolvers,
      "subscriptions/index.ts",
      symbols,
    );
  }

  // Allow config to ignore certain objects, i.e. we ignore all of our enums b/c `enumsResolvers` codegens them
  const ignoreObjectsPattern = config?.scaffolding?.ignoreObjectsPattern;
  const ignoreObjectsRegex = ignoreObjectsPattern && new RegExp(ignoreObjectsPattern);

  const objectSymbols: Record<string, Import> = {};
  await Promise.all(
    Object.values(schema.getTypeMap())
      .filter((value) => isGraphQLObjectType(value))
      .filter((value) => !value.name.startsWith("__"))
      .filter((value) => value !== queryType && value !== mutationType)
      .filter((value) => config.mappers[value.name] !== undefined)
      .filter((value) => ignoreObjectsRegex === undefined || !value.name.match(ignoreObjectsRegex))
      .map(async (o) => {
        const symbol = await generateObjectScaffolding(ctx, o as GraphQLObjectType);
        objectSymbols[(o as GraphQLObjectType).name] = symbol;
      }),
  );
  await writeObjectBarrelFile(ctx, "objectResolvers", "objects/index.ts", objectSymbols);

  // We don't output any content into the generated-types.ts file.
  return {} as PluginOutput;
};

/** Given the `Query` types, generates `foo.ts` and `foo.test.ts` scaffolds for each field. */
async function generateQueryScaffolding(ctx: PluginContext, query: GraphQLObjectType): Promise<Import[]> {
  const {
    graphqlTypesPath,
    resolversPath,
    imports: { QueryResolvers, Context, run },
  } = ctx;
  const cwd = await fs.realpath(".");

  // Loop over every `Query.foo` field
  const promises = Object.values(query.getFields()).map(async (field) => {
    const name = field.name;

    const argsImp =
      field.args.length === 0
        ? "{}"
        : toImp(buildSpec(graphqlTypesPath, `Query${pascalCase(name)}Args`), {
            typeName: `Query${pascalCase(name)}Args`,
            isTypeOnlyImport: true,
          });

    const maybeSubDir = maybeGetSchemaFile(cwd, field);
    const modulePath = join(unescapePath(resolversPath), maybeSubDir ?? "queries", `${name}Query`);
    const resolverConst = imp(`${name}@${modulePath}.ts`);

    const newFile = await writeIfNew(
      ctx,
      `${toFilesystemPath(modulePath)}.ts`,
      code`
        export const ${name}: Pick<${QueryResolvers}, "${name}"> = {
          async ${name}(root, args, ctx) {
            throw new Error("not implemented");
          }
        };
      `,
    );
    if (newFile) {
      await writeIfNew(
        ctx,
        `${toFilesystemPath(modulePath)}.test.ts`,
        code`
          describe("${name}", () => {
            it("handles this business case", () => {
              fail();
            });
          });

          function run${pascalCase(name)}(ctx: ${Context}, argsFn: () => ${argsImp}) {
            return ${run}(ctx, (ctx) => ${resolverConst}.${name}({}, argsFn(), ctx, undefined!));
          }
        `,
      );
    }

    return resolverConst;
  });

  return Promise.all(promises);
}

/** Given the `Mutation` type, generates `foo.ts` and `foo.test.ts` scaffolds for each field. */
async function generateMutationScaffolding(ctx: PluginContext, mutation: GraphQLObjectType): Promise<Import[]> {
  const {
    graphqlTypesPath,
    resolversPath,
    imports: { MutationResolvers, Context, run },
  } = ctx;
  const cwd = await fs.realpath(".");

  const promises = Object.values(mutation.getFields()).map(async (field) => {
    const name = field.name;

    // Look for the `input: ...Input!` convention
    const inputType = getInputType(field);
    // if no inputType then make inputImp void
    const inputImp = inputType
      ? toImp(buildSpec(graphqlTypesPath, inputType.name), {
          typeName: inputType.name,
          isTypeOnlyImport: true,
        })
      : "void";

    const maybeSubDir = maybeGetSchemaFile(cwd, field);
    const modulePath = join(unescapePath(resolversPath), maybeSubDir ?? "mutations", `${name}Mutation`);
    const resolverConst = imp(`${name}@${modulePath}.ts`);

    const newFile = await writeIfNew(
      ctx,
      `${toFilesystemPath(modulePath)}.ts`,
      code`
        export const ${name}: Pick<${MutationResolvers}, "${name}"> = {
          async ${name}(root, args, ctx) {
            throw new Error("not implemented");
          }
        };
      `,
    );

    if (newFile) {
      await writeIfNew(
        ctx,
        `${toFilesystemPath(modulePath)}.test.ts`,
        code`
        describe("${name}", () => {
          it("handles this business case", () => {
            fail();
          });
        });

        function run${pascalCase(name)}(ctx: ${Context}, inputFn: () => ${inputImp}) {
          return ${run}(ctx, (ctx) => ${resolverConst}.${name}({}, { input: inputFn() }, ctx, undefined!));
        }
      `,
      );
    }

    return resolverConst;
  });

  return Promise.all(promises);
}

/** Given the `Subscription` types, generates `foo.ts` and `foo.test.ts` scaffolds for each field. */
async function generateSubscriptionScaffolding(ctx: PluginContext, subscription: GraphQLObjectType): Promise<Import[]> {
  const {
    graphqlTypesPath,
    resolversPath,
    imports: { SubscriptionResolvers, Context, run },
  } = ctx;
  const cwd = await fs.realpath(".");

  const promises = Object.values(subscription.getFields()).map(async (field) => {
    const name = field.name;
    const argsImp =
      field.args.length === 0
        ? "{}"
        : toImp(buildSpec(graphqlTypesPath, `Subscription${pascalCase(name)}Args`), {
            typeName: `Subscription${pascalCase(name)}Args`,
            isTypeOnlyImport: true,
          });
    const resolverContents: Code[] = [];

    // define subscription event
    resolverContents.push(code`
        export const ${pascalCase(name)}Event = "${pascalCase(name)}Event";
      `);
    // if no args, simple implementation should do
    if (field.args.length === 0) {
      resolverContents.push(code`
          export const ${name}: Pick<${SubscriptionResolvers}, "${name}"> = {
            ${name}: {
              subscribe: () => {
                // likely can import pubsub implementation and uncomment next line
                // return pubsub.asyncIterator(${pascalCase(name)}Event);
                throw new Error("not implemented");
              }
            }
          };
        `);
    } // enable subscription filtering if args not empty
    // TODO figure out how to type the payload variable below
    else {
      resolverContents.push(code`
          export const ${name}: Pick<${SubscriptionResolvers}, "${name}"> = {
            ${name}: {
              subscribe: ${withFilter}(
                () => {
                  // likely can import pubsub implementation and uncomment next line
                  // return pubsub.asyncIterator(${pascalCase(name)}Event);
                  throw new Error("not implemented");
                },
                (payload, args: ${argsImp}) => {
                  // return true if payload / args should result in notification
                  throw new Error("not implemented");
                },
              ),
            }
          };
        `);
    }

    const maybeSubDir = maybeGetSchemaFile(cwd, field);
    const modulePath = join(unescapePath(resolversPath), maybeSubDir ?? "subscriptions", `${name}Subscription`);
    const resolverConst = imp(`${name}@${modulePath}.ts`);
    const testContents = code`
      describe("${name}", () => {
        it("handles this business case", () => {
          fail();
        });
      });

      function run${pascalCase(name)}(ctx: ${Context}, argsFn: () => ${argsImp}) {
        return ${run}(ctx, (ctx) => ${resolverConst}.${name}.subscribe(undefined, argsFn(), ctx,undefined!));
      }
    `;

    const newFile = await writeIfNew(ctx, `${toFilesystemPath(modulePath)}.ts`, code`${resolverContents}`);
    if (newFile) {
      await writeIfNew(ctx, `${toFilesystemPath(modulePath)}.test.ts`, testContents);
    }

    return resolverConst;
  });

  return (await Promise.all(promises)).flat();
}

/** Given the (mapped) `Object` type, generates `foo.ts` and `foo.test.ts` scaffolds for each field. */
async function generateObjectScaffolding(ctx: PluginContext, object: GraphQLObjectType): Promise<Import> {
  const { graphqlTypesPath, resolversPath } = ctx;
  const cwd = await fs.realpath(".");

  const name = camelCase(object.name);
  const resolverType = toImp(buildSpec(graphqlTypesPath, `${object.name}Resolvers`), {
    typeName: `${object.name}Resolvers`,
    isTypeOnlyImport: true,
  });
  const maybeSubDir = maybeGetSchemaFile(cwd, object);
  const modulePath = join(unescapePath(resolversPath), maybeSubDir ?? "objects", `${name}Resolvers`);
  const resolverConst = imp(`${name}Resolvers@${modulePath}.ts`);

  const newFile = await writeIfNew(
    ctx,
    `${toFilesystemPath(modulePath)}.ts`,
    code`
        // @ts-ignore not implemented
        export const ${name}Resolvers: ${resolverType} = {
        };
      `,
  );
  if (newFile) {
    await writeIfNew(
      ctx,
      `${toFilesystemPath(modulePath)}.test.ts`,
      code`
        describe("${name}Resolvers", () => {
          it("handles this business case", () => {
            fail();
          });
        });
      `,
    );
  }

  return resolverConst;
}

/** Creates a barrel file that re-exports every symbol in `symbols`. */
async function writeBarrelFile(
  ctx: PluginContext,
  constName: string,
  constType: Import,
  filePath: string,
  symbols: Import[],
) {
  const { resolversPath, tsPoetConfig } = ctx;
  const contents = code`
    // This file is auto-generated

    export const ${constName}: ${constType} = {
      ${symbols.map((symbol) => code`...${symbol},`)}
    }
  `;
  await fs.writeFile(
    join(toFilesystemPath(resolversPath), filePath),
    contents.toString({ path: filePath, ...tsPoetConfig }),
  );
}

/** Creates a barrel file that re-exports every symbol in `symbols`. */
async function writeObjectBarrelFile(
  ctx: PluginContext,
  constName: string,
  filePath: string,
  symbols: Record<string, Import>,
) {
  const { resolversPath, tsPoetConfig } = ctx;
  const contents = code`
    // This file is auto-generated

    export const ${constName} = {
      ${Object.entries(sortObject(symbols)).map(([name, symbol]) => code`${name}: ${symbol},`)}
    }
  `;
  await fs.writeFile(
    join(toFilesystemPath(resolversPath), filePath),
    contents.toString({ path: filePath, ...tsPoetConfig }),
  );
}

/** Assumes the mutation has a single `Input`-style parameter, which should be non-null. */
function getInputType(field: GraphQLField<any, any>): GraphQLInputObjectType | undefined {
  if (field.args.length > 0) {
    if (field.args[0].type instanceof GraphQLNonNull) {
      return field.args[0].type.ofType as any as GraphQLInputObjectType;
    } else if (field.args[0].type instanceof GraphQLInputObjectType) {
      return field.args[0].type;
    }
  }
  return undefined;
}

type HasAst = GraphQLObjectType | GraphQLField<any, any>;

/**
 * Finds the relative path within the `$projectDir/schema/` directory.
 *
 * I.e. given `node` is a `type Author`, returns the `author.graphql` file.
 */
function relativeSourcePath(cwd: string, node: HasAst): string | undefined {
  let source: string | undefined;
  if (node instanceof GraphQLObjectType && Object.values(node.getFields()).length > 0) {
    // There is a bug in graphql-codegen/graphql-toolkit where the top-level objects don't
    // have source locations, but if we call .getFields() and look at the first field, it works.
    //
    // That said, the "first field" might be in a file that is doing `extends type ...`, so
    // our heuristic is to look at all of the fields and pick the most-used source name.

    // group by and count. Yuck.
    const fieldSources = Object.values(node.getFields())
      .map((f) => f.astNode?.loc?.source.name)
      .reduce(
        (acc, name) => {
          if (name) {
            if (acc[name]) {
              acc[name]++;
            } else {
              acc[name] = 1;
            }
          }
          return acc;
        },
        {} as Record<string, number>,
      );

    // Find the max. Yuck.
    const fieldSource = Object.entries(fieldSources).reduce((max, next) => {
      if (next[1] > max[1]) {
        return next;
      } else {
        return max;
      }
    });

    source = fieldSource[0];
  } else if (!(node instanceof GraphQLObjectType)) {
    source = node.astNode?.loc?.source.name;
  }
  if (source) {
    // Assume files are in `./schema/*.graphql` files.
    return source.replace(cwd, "")?.replace("/schema/", "");
  }
  return undefined;
}

/** Given `field` is in `author.graphql`, returns `author` as the base file prefix. */
function maybeGetSchemaFile(cwd: string, field: HasAst): string | undefined {
  const path = relativeSourcePath(cwd, field);
  const shouldGoInTopLevel = path && fileNamesConsideredTopLevel.includes(path);
  return !path || shouldGoInTopLevel ? undefined : path.replace(".graphql", "");
}

async function writeIfNew(ctx: PluginContext, path: string, code: Code): Promise<boolean> {
  const { tsPoetConfig } = ctx;
  await fs.mkdir(dirname(path), { recursive: true });
  const exists = await trueIfResolved(fs.access(path));
  if (!exists) {
    await fs.writeFile(path, code.toString({ path, ...tsPoetConfig }));
    return true;
  }
  return false;
}

/**
 * Parses a graphql-codegen mapper specification and returns structured information about external mappers.
 * Supports both traditional format (path#symbol) and subpath imports (#src/path#symbol).
 */
export function parseExternalMapper(spec: string): {
  isExternal: boolean;
  isDefault: boolean;
  import: string;
  source: string | undefined;
  type: string;
} {
  const parsed = parseMapper(spec);
  const isExternal = isExternalMapperType(parsed);

  return {
    isExternal,
    isDefault: isExternal ? parsed.default : false,
    import: isExternal ? parsed.import : spec,
    source: isExternal ? parsed.source : undefined,
    type: parsed.type,
  };
}

/**
 * Maps the graphql-codegen mapper specification (e.g., `@src/context#Context` or `#src/context#Context` for subpath imports) to ts-poet's format.
 * Returns undefined if spec is undefined.
 */
export function toImp(spec: string, options: { typeName: string; isTypeOnlyImport?: boolean }): Import;
export function toImp(
  spec: string | undefined,
  options?: { typeName?: string; isTypeOnlyImport?: boolean },
): string | Import | undefined;
export function toImp(
  spec: string | undefined,
  options: { typeName?: string; isTypeOnlyImport?: boolean } = {},
): string | Import | undefined {
  if (!spec) {
    return undefined;
  }

  const mapper = parseExternalMapper(spec);

  // Internal mapper, just return the type as-is
  if (!mapper.isExternal) {
    return mapper.type;
  }

  // For external mappers, build the import path
  const { typeName, isTypeOnlyImport } = options;
  const sourceWithExt = `${mapper.source}.ts`;
  const typeOnlyPrefix = isTypeOnlyImport ? "t:" : "";

  // For default imports, use ts-poet = syntax with the type name as the import alias
  if (mapper.isDefault && typeName) {
    return imp(`${typeOnlyPrefix}${typeName}=${sourceWithExt}`);
  }

  // For named imports, use the import element (which may include 'as' aliasing)
  return imp(`${typeOnlyPrefix}${mapper.import}@${sourceWithExt}`);
}

/**
 * The config values we read from the graphql-codegen.yml file.
 *
 * Note on subpath imports: If using Node.js subpath imports (paths starting with #),
 * you must escape the # character with a backslash to avoid ambiguity with the # separator
 * used in mapper specs. For example:
 * - contextType: "\\#src/context#AppContext"
 * - resolversPath: "\\#src/resolvers"
 * - graphqlTypesPath: "\\#src/types"
 */
export interface Config extends RawConfig {
  /**
   * Type to use for resolver context.
   * Supports subpath imports like "\\#src/context#AppContext".
   *
   * @default - "src/context#Context".
   */
  contextType?: string;
  mappers: Record<string, string>;
  /**
   * Output directory for generated resolver scaffolding.
   * Supports subpath imports like "\\#src/resolvers".
   *
   * @default - "src/resolvers"
   */
  resolversPath?: string;
  /**
   * Path to the generated GraphQL types file.
   * Supports subpath imports like "\\#src/graphql-types".
   *
   * @default - "src/generated/graphql-types".
   */
  graphqlTypesPath?: string;
  /**
   * Path to the test utils module.
   * Supports subpath imports like "\\#src/testUtils".
   *
   * @default - "src/resolvers/testUtils".
   */
  testUtilsPath?: string;
  scaffolding?: {
    ignoreObjectsPattern?: string;
  };
}

/** Returns true if `p` is resolved, otherwise false if it is rejected. */
export async function trueIfResolved(p: Promise<unknown>): Promise<boolean> {
  return await p.then(
    () => true,
    () => false,
  );
}

function sortObject<T extends object>(obj: T): T {
  return Object.keys(obj)
    .sort()
    .reduce(
      (acc, key) => {
        acc[key as keyof T] = obj[key as keyof T];
        return acc;
      },
      {} as any as T,
    ) as T;
}

function isGraphQLObjectType(o: any): o is GraphQLObjectType {
  return o instanceof GraphQLObjectType;
}

/**
 * Unescapes a path by removing the leading backslash from escaped subpath imports.
 * For example, "\\#src/foo" becomes "#src/foo"
 */
function unescapePath(path: string): string {
  return path.startsWith("\\#") ? path.substring(1) : path;
}

/**
 * Builds a mapper spec from a path and export name.
 *
 * Note: If the path is a subpath import (starts with #), it must be pre-escaped
 * by the caller (e.g., "\\#src/foo" not "#src/foo") to avoid ambiguity with the
 * # separator between path and export name.
 */
function buildSpec(path: string, exportName: string): string {
  return `${path}#${exportName}`;
}

/**
 * Converts a potentially subpath-import path to a filesystem path by stripping the leading #
 * or escaped leading \\#.
 *
 * Validates that the resulting path is relative and does not attempt to traverse outside
 * the project directory.
 */
function toFilesystemPath(path: string): string {
  // Strip leading # or \#
  let normalizedPath = path;
  if (normalizedPath.startsWith("\\#")) {
    normalizedPath = normalizedPath.substring(2);
  } else if (normalizedPath.startsWith("#")) {
    normalizedPath = normalizedPath.substring(1);
  }

  // Validate that the path is relative
  if (isAbsolute(normalizedPath)) {
    throw new Error(`Path must be relative, got absolute path: ${path}`);
  }

  // Normalize the path to resolve any .. or . segments
  const normalized = normalize(normalizedPath);

  // Check if the normalized path tries to escape the project directory
  if (normalized.startsWith("..")) {
    throw new Error(`Path cannot traverse outside project directory: ${path}`);
  }

  return normalizedPath;
}
