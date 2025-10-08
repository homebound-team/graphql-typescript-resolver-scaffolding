import { PluginFunction, Types } from "@graphql-codegen/plugin-helpers";
import { parseMapper, isExternalMapperType } from "@graphql-codegen/visitor-plugin-common";
import { pascalCase, camelCase } from "change-case";
import { promises as fs } from "fs";
import { GraphQLField, GraphQLInputObjectType, GraphQLNonNull, GraphQLObjectType } from "graphql";
import { dirname } from "path";
import { code, Code, imp, Import } from "ts-poet";
import type { RawConfig } from "@graphql-codegen/visitor-plugin-common";
import type { ToStringOpts } from "ts-poet/build/Code";
import PluginOutput = Types.PluginOutput;

const withFilter = imp("withFilter@graphql-subscriptions");

const baseDir = "src/resolvers";
const fileNamesConsideredTopLevel = [
  "schema.graphql",
  "mutations.graphql",
  "queries.graphql",
  "subscriptions.graphql",
  "root.graphql",
];

/** Internal context passed to scaffolding functions */
interface ScaffoldingContext {
  tsPoetConfig: ToStringOpts;
  graphqlTypesPath: string;
  QueryResolvers: Import;
  MutationResolvers: Import;
  SubscriptionResolvers: Import;
  Context: Import;
  run: Import;
}

/** Helper to build mapper spec - escape # for subpath imports */
function buildSpec(path: string, exportName: string): string {
  // If path starts with #, it's a subpath import and needs to be escaped
  const escapedPath = path.startsWith("#") ? `\\${path}` : path;
  return `${escapedPath}#${exportName}`;
}

/**
 * Given a schema, generates the top-level Query/Mutation/Object resovlers by stitching
 * together the respective individual resolvers at expected locations.
 *
 * We also put scaffolding in each "expected location" place to help engineers
 * know where to put things.
 */
export const plugin: PluginFunction<Config> = async (schema, documents, config) => {
  const { emitLegacyCommonJSImports = true } = config;

  // Create scaffolding context with all internal config
  const graphqlTypesPath = config.graphqlTypesPath || "src/generated/graphql-types";
  const testUtilsPath = config.testUtilsPath || "src/resolvers/testUtils";

  const ctx: ScaffoldingContext = {
    tsPoetConfig: {
      importExtensions: emitLegacyCommonJSImports ? false : "js",
    },
    graphqlTypesPath,
    QueryResolvers: toImp(buildSpec(graphqlTypesPath, "QueryResolvers"), {
      typeName: "QueryResolvers",
      isTypeOnlyImport: true,
    }) as Import,
    MutationResolvers: toImp(buildSpec(graphqlTypesPath, "MutationResolvers"), {
      typeName: "MutationResolvers",
      isTypeOnlyImport: true,
    }) as Import,
    SubscriptionResolvers: toImp(buildSpec(graphqlTypesPath, "SubscriptionResolvers"), {
      typeName: "SubscriptionResolvers",
      isTypeOnlyImport: true,
    }) as Import,
    Context: toImp(config.contextType, { typeName: "Context", isTypeOnlyImport: true }) as Import,
    run: toImp(buildSpec(testUtilsPath, "run"), { typeName: "run" }) as Import,
  };

  const mutationType = schema.getMutationType();
  if (mutationType) {
    const symbols = await generateMutationScaffolding(ctx, mutationType);
    await writeBarrelFile("mutationResolvers", ctx.MutationResolvers, "mutations/index.ts", symbols, ctx.tsPoetConfig);
  }

  const queryType = schema.getQueryType();
  if (queryType) {
    const symbols = await generateQueryScaffolding(ctx, queryType);
    await writeBarrelFile("queryResolvers", ctx.QueryResolvers, "queries/index.ts", symbols, ctx.tsPoetConfig);
  }

  const subscriptionType = schema.getSubscriptionType();
  if (subscriptionType) {
    const symbols = await generateSubscriptionScaffolding(ctx, subscriptionType);
    await writeBarrelFile(
      "subscriptionResolvers",
      ctx.SubscriptionResolvers,
      "subscriptions/index.ts",
      symbols,
      ctx.tsPoetConfig,
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
  await writeObjectBarrelFile("objectResolvers", "objects/index.ts", objectSymbols, ctx.tsPoetConfig);

  // We don't output any content into the generated-types.ts file.
  return {} as PluginOutput;
};

/** Given the `Query` types, generates `foo.ts` and `foo.test.ts` scaffolds for each field. */
async function generateQueryScaffolding(ctx: ScaffoldingContext, query: GraphQLObjectType): Promise<Import[]> {
  const cwd = await fs.realpath(".");

  // Loop over every `Query.foo` field
  const promises = Object.values(query.getFields()).map(async (field) => {
    const name = field.name;

    const argsImp =
      field.args.length === 0
        ? "{}"
        : (toImp(buildSpec(ctx.graphqlTypesPath, `Query${pascalCase(name)}Args`), {
            isTypeOnlyImport: true,
          }) as Import);

    const maybeSubDir = maybeGetSchemaFile(cwd, field);
    const modulePath = `${baseDir}/${maybeSubDir ?? "queries"}/${name}Query`;
    const resolverConst = imp(`${name}@${modulePath}.ts`);

    const newFile = await writeIfNew(
      `${modulePath}.ts`,
      code`
        export const ${name}: Pick<${ctx.QueryResolvers}, "${name}"> = {
          async ${name}(root, args, ctx) {
            throw new Error("not implemented");
          }
        };
      `,
      ctx.tsPoetConfig,
    );
    if (newFile) {
      await writeIfNew(
        `${modulePath}.test.ts`,
        code`
          describe("${name}", () => {
            it("handles this business case", () => {
              fail();
            });
          });

          function run${pascalCase(name)}(ctx: ${ctx.Context}, argsFn: () => ${argsImp}) {
            return ${ctx.run}(ctx, (ctx) => ${resolverConst}.${name}({}, argsFn(), ctx, undefined!));
          }
        `,
        ctx.tsPoetConfig,
      );
    }

    return resolverConst;
  });

  return Promise.all(promises);
}

/** Given the `Mutation` type, generates `foo.ts` and `foo.test.ts` scaffolds for each field. */
async function generateMutationScaffolding(ctx: ScaffoldingContext, mutation: GraphQLObjectType): Promise<Import[]> {
  const cwd = await fs.realpath(".");

  const promises = Object.values(mutation.getFields()).map(async (field) => {
    const name = field.name;

    // Look for the `input: ...Input!` convention
    const inputType = getInputType(field);
    // if no inputType then make inputImp void
    const inputImp = inputType
      ? (toImp(buildSpec(ctx.graphqlTypesPath, inputType.name), { isTypeOnlyImport: true }) as Import)
      : "void";

    const maybeSubDir = maybeGetSchemaFile(cwd, field);
    const modulePath = `${baseDir}/${maybeSubDir ?? "mutations"}/${name}Mutation`;
    const resolverConst = imp(`${name}@${modulePath}.ts`);

    const newFile = await writeIfNew(
      `${modulePath}.ts`,
      code`
        export const ${name}: Pick<${ctx.MutationResolvers}, "${name}"> = {
          async ${name}(root, args, ctx) {
            throw new Error("not implemented");
          }
        };
      `,
      ctx.tsPoetConfig,
    );

    if (newFile) {
      await writeIfNew(
        `${modulePath}.test.ts`,
        code`
        describe("${name}", () => {
          it("handles this business case", () => {
            fail();
          });
        });

        function run${pascalCase(name)}(ctx: ${ctx.Context}, inputFn: () => ${inputImp}) {
          return ${ctx.run}(ctx, (ctx) => ${resolverConst}.${name}({}, { input: inputFn() }, ctx, undefined!));
        }
      `,
        ctx.tsPoetConfig,
      );
    }

    return resolverConst;
  });

  return Promise.all(promises);
}

/** Given the `Subscription` types, generates `foo.ts` and `foo.test.ts` scaffolds for each field. */
async function generateSubscriptionScaffolding(
  ctx: ScaffoldingContext,
  subscription: GraphQLObjectType,
): Promise<Import[]> {
  const cwd = await fs.realpath(".");

  const promises = Object.values(subscription.getFields()).map(async (field) => {
    const name = field.name;
    const argsImp =
      field.args.length === 0
        ? "{}"
        : (toImp(buildSpec(ctx.graphqlTypesPath, `Subscription${pascalCase(name)}Args`), {
            isTypeOnlyImport: true,
          }) as Import);
    const resolverContents: Code[] = [];

    // define subscription event
    resolverContents.push(code`
        export const ${pascalCase(name)}Event = "${pascalCase(name)}Event";
      `);
    // if no args, simple implementation should do
    if (field.args.length === 0) {
      resolverContents.push(code`
          export const ${name}: Pick<${ctx.SubscriptionResolvers}, "${name}"> = {
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
          export const ${name}: Pick<${ctx.SubscriptionResolvers}, "${name}"> = {
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
    const modulePath = `${baseDir}/${maybeSubDir ?? "subscriptions"}/${name}Subscription`;
    const resolverConst = imp(`${name}@${modulePath}.ts`);
    const testContents = code`
      describe("${name}", () => {
        it("handles this business case", () => {
          fail();
        });
      });

      function run${pascalCase(name)}(ctx: ${ctx.Context}, argsFn: () => ${argsImp}) {
        return ${ctx.run}(ctx, (ctx) => ${resolverConst}.${name}.subscribe(undefined, argsFn(), ctx,undefined!));
      }
    `;

    const newFile = await writeIfNew(`${modulePath}.ts`, code`${resolverContents}`, ctx.tsPoetConfig);
    if (newFile) {
      await writeIfNew(`${modulePath}.test.ts`, testContents, ctx.tsPoetConfig);
    }

    return resolverConst;
  });

  return (await Promise.all(promises)).flat();
}

/** Given the (mapped) `Object` type, generates `foo.ts` and `foo.test.ts` scaffolds for each field. */
async function generateObjectScaffolding(ctx: ScaffoldingContext, object: GraphQLObjectType): Promise<Import> {
  const cwd = await fs.realpath(".");

  const name = camelCase(object.name);
  const resolverType = toImp(buildSpec(ctx.graphqlTypesPath, `${object.name}Resolvers`), {
    isTypeOnlyImport: true,
  }) as Import;
  const maybeSubDir = maybeGetSchemaFile(cwd, object);
  const modulePath = `${baseDir}/${maybeSubDir ?? "objects"}/${name}Resolvers`;
  const resolverConst = imp(`${name}Resolvers@${modulePath}.ts`);

  const newFile = await writeIfNew(
    `${modulePath}.ts`,
    code`
        // @ts-ignore not implemented
        export const ${name}Resolvers: ${resolverType} = {
        };
      `,
    ctx.tsPoetConfig,
  );
  if (newFile) {
    await writeIfNew(
      `${modulePath}.test.ts`,
      code`
        describe("${name}Resolvers", () => {
          it("handles this business case", () => {
            fail();
          });
        });
      `,
      ctx.tsPoetConfig,
    );
  }

  return resolverConst;
}

/** Creates a barrel file that re-exports every symbol in `symbols`. */
async function writeBarrelFile(
  constName: string,
  constType: Import,
  filePath: string,
  symbols: Import[],
  tsPoetConfig: ToStringOpts,
) {
  const contents = code`
    // This file is auto-generated

    export const ${constName}: ${constType} = {
      ${symbols.map((symbol) => code`...${symbol},`)}
    }
  `;
  await fs.writeFile(`${baseDir}/${filePath}`, contents.toString({ path: filePath, ...tsPoetConfig }));
}

/** Creates a barrel file that re-exports every symbol in `symbols`. */
async function writeObjectBarrelFile(
  constName: string,
  filePath: string,
  symbols: Record<string, Import>,
  tsPoetConfig: ToStringOpts,
) {
  const contents = code`
    // This file is auto-generated

    export const ${constName} = {
      ${Object.entries(sortObject(symbols)).map(([name, symbol]) => code`${name}: ${symbol},`)}
    }
  `;
  await fs.writeFile(`${baseDir}/${filePath}`, contents.toString({ path: filePath, ...tsPoetConfig }));
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

async function writeIfNew(path: string, code: Code, tsPoetConfig: ToStringOpts): Promise<boolean> {
  await fs.mkdir(dirname(path), { recursive: true });
  const exists = await trueIfResolved(fs.access(path));
  if (!exists) {
    await fs.writeFile(path, code.toString({ path, ...tsPoetConfig }));
    return true;
  }
  return false;
}

/**
 * Parses a mapper specification and returns structured information about external mappers.
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
 * Maps the visit-plugin convention (e.g., `@src/context#Context` or `#src/context#Context` for subpath imports) to ts-poet's format.
 * Returns undefined if spec is undefined.
 */
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

/** The config values we read from the graphql-codegen.yml file. */
export interface Config extends RawConfig {
  contextType: string;
  mappers: Record<string, string>;
  /** Path to the generated GraphQL types file. Defaults to "src/generated/graphql-types". Supports subpath imports like "#src/graphql-types". */
  graphqlTypesPath?: string;
  /** Path to the test utils module. Defaults to "src/resolvers/testUtils". Supports subpath imports like "#src/testUtils". */
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
