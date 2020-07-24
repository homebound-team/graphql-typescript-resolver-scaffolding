import { PluginFunction, Types } from "@graphql-codegen/plugin-helpers";
import { pascalCase, camelCase } from "change-case";
import { promises as fs } from "fs";
import { GraphQLField, GraphQLInputObjectType, GraphQLNonNull, GraphQLObjectType } from "graphql";
import { dirname } from "path";
import { code, Code, imp } from "ts-poet";
import { SymbolSpec } from "ts-poet/build/SymbolSpecs";
import PluginOutput = Types.PluginOutput;

const QueryResolvers = imp("QueryResolvers@@src/generated/graphql-types");
const MutationResolvers = imp("MutationResolvers@@src/generated/graphql-types");
const Context = imp(`Context@@src/context`);
const run = imp(`run@@src/resolvers/testUtils`);

const baseDir = "src/resolvers";
const fileNamesConsideredTopLevel = ["schema.graphql", "mutations.graphql", "queries.graphql", "root.graphql"];

function isGraphQLObjectType(o: any): o is GraphQLObjectType {
  return o instanceof GraphQLObjectType;
}

export const plugin: PluginFunction<Config> = async (schema, documents, config) => {
  const querySymbols: SymbolSpec[] = [];
  const mutationSymbols: SymbolSpec[] = [];
  const objectSymbols: Record<string, SymbolSpec> = {};

  const mutationType = schema.getMutationType();
  if (mutationType) {
    const consts = await maybeGenerateMutationScaffolding(mutationType);
    consts.forEach((c) => mutationSymbols.push(c));
  }

  const queryType = schema.getQueryType();
  if (queryType) {
    const consts = await generateQueryScaffolding(queryType);
    consts.forEach((c) => querySymbols.push(c));
  }

  const ignoreObjectsPattern = config?.scaffolding?.ignoreObjectsPattern;
  const ignoreObjectsRegex = ignoreObjectsPattern && new RegExp(ignoreObjectsPattern);

  await Promise.all(
    Object.values(schema.getTypeMap())
      .filter((value) => isGraphQLObjectType(value))
      .filter((value) => !value.name.startsWith("__"))
      .filter((value) => value !== queryType && value !== mutationType)
      .filter((value) => config.mappers[value.name] !== undefined)
      .filter((value) => ignoreObjectsRegex === undefined || !value.name.match(ignoreObjectsRegex))
      .map(async (o) => {
        const sym = await maybeGenerateObjectScaffolding(o as GraphQLObjectType);
        objectSymbols[(o as GraphQLObjectType).name] = sym;
      }),
  );

  await writeBarrelFile("mutationResolvers", MutationResolvers, "mutations/index.ts", mutationSymbols);
  await writeBarrelFile("queryResolvers", QueryResolvers, "queries/index.ts", querySymbols);
  await writeObjectBarrelFile("objectResolvers", "objects/index.ts", objectSymbols);

  // We don't output any content into the generated-types.ts file.
  return {} as PluginOutput;
};

/** Given the `Query` types, generates `foo.ts` and `foo.test.ts` scaffolds for each field. */
async function generateQueryScaffolding(query: GraphQLObjectType): Promise<SymbolSpec[]> {
  const cwd = await fs.realpath(".");

  const promises = Object.values(query.getFields()).map(async (field) => {
    const name = field.name;
    const resolverContents = code`
      export const ${name}: Pick<${QueryResolvers}, "${name}"> = {
        async ${name}(root, args, ctx) {
          throw new Error("not implemented");
        }
      };
    `;

    const argsImp = field.args.length === 0 ? "{}" : imp(`Query${pascalCase(name)}Args@@src/generated/graphql-types`);

    const maybeSubDir = subDirectory(cwd, field);
    const modulePath = `${baseDir}/queries/${maybeSubDir}${name}Resolver`;
    const resolverConst = imp(`${name}@@${modulePath}`);
    const testContents = code`
      describe("${name}", () => {
        it("handles this business case", () => {
          fail();
        });
      });

      async function run${pascalCase(name)}(ctx: ${Context}, argsFn: () => ${argsImp}) {
        return await ${run}(ctx, async () => {
          return ${resolverConst}.${name}({}, argsFn(), ctx, undefined!);
        });
      }
    `;

    await fs.mkdir(dirname(modulePath), { recursive: true });
    const newFile = await writeIfNew(`${modulePath}.ts`, resolverContents);
    if (newFile) {
      await writeIfNew(`${modulePath}.test.ts`, testContents);
    }

    return resolverConst;
  });

  return (await Promise.all(promises)).flat();
}

/** Given the `Mutation` type, generates `foo.ts` and `foo.test.ts` scaffolds for each field. */
async function maybeGenerateMutationScaffolding(mutation: GraphQLObjectType): Promise<SymbolSpec[]> {
  const cwd = await fs.realpath(".");

  const promises = Object.values(mutation.getFields()).map(async (field) => {
    const name = field.name;
    const resolverContents = code`
      export const ${name}: Pick<${MutationResolvers}, "${name}"> = {
        async ${name}(root, args, ctx) {
          throw new Error("not implemented");
        }
      };
    `;

    const inputType = getInputType(field);

    // if no inputType then make inputImp void
    const inputImp = inputType ? imp(`${inputType.name}@@src/generated/graphql-types`) : "void";

    const maybeSubDir = subDirectory(cwd, field);
    const modulePath = `${baseDir}/mutations/${maybeSubDir}${name}Resolver`;
    const resolverConst = imp(`${name}@@${modulePath}`);
    const testContents = code`
      describe("${name}", () => {
        it("handles this business case", () => {
          fail();
        });
      });

      async function run${pascalCase(name)}(ctx: ${Context}, inputFn: () => ${inputImp}) {
        return await ${run}(ctx, async (ctx) => {
          return ${resolverConst}.${name}({}, { input: inputFn() }, ctx, undefined!);
        });
      }
    `;

    await fs.mkdir(dirname(modulePath), { recursive: true });
    const newFile = await writeIfNew(`${modulePath}.ts`, resolverContents);
    if (newFile) {
      await writeIfNew(`${modulePath}.test.ts`, testContents);
    }

    return resolverConst;
  });

  return (await Promise.all(promises)).flat();
}

/** Given the (mapped) `Object` type, generates `foo.ts` and `foo.test.ts` scaffolds for each field. */
async function maybeGenerateObjectScaffolding(object: GraphQLObjectType): Promise<SymbolSpec> {
  const cwd = await fs.realpath(".");

  const name = camelCase(object.name) + "Resolvers";
  const resolverType = imp(`${object.name}Resolvers@@src/generated/graphql-types`);

  const resolverContents = code`
    // @ts-ignore not implemented
    export const ${name}: ${resolverType} = {
    };
  `;

  const maybeSubDir = subDirectory(cwd, object);
  const modulePath = `${baseDir}/objects/${maybeSubDir}${name}`;
  const resolverConst = imp(`${name}@@${modulePath}`);
  const testContents = code`
    describe("${name}", () => {
      it("handles this business case", () => {
        fail();
      });
    });
  `;

  await fs.mkdir(dirname(modulePath), { recursive: true });
  const newFile = await writeIfNew(`${modulePath}.ts`, resolverContents);
  if (newFile) {
    await writeIfNew(`${modulePath}.test.ts`, testContents);
  }

  return resolverConst;
}

/** Creates a barrel file that re-exports every symbol in `symbols`. */
async function writeBarrelFile(constName: string, constType: SymbolSpec, filePath: string, symbols: SymbolSpec[]) {
  const contents = code`
    // This file is auto-generated

    export const ${constName}: ${constType} = {
      ${symbols.map((symbol) => code`...${symbol},`)}
    }
  `;
  await fs.writeFile(`${baseDir}/${filePath}`, await contents.toStringWithImports(filePath));
}

/** Creates a barrel file that re-exports every symbol in `symbols`. */
async function writeObjectBarrelFile(constName: string, filePath: string, symbols: Record<string, SymbolSpec>) {
  const contents = code`
    // This file is auto-generated

    export const ${constName} = {
      ${Object.entries(sortObject(symbols)).map(([name, symbol]) => code`${name}: ${symbol},`)}
    }
  `;
  await fs.writeFile(`${baseDir}/${filePath}`, await contents.toStringWithImports(filePath));
}

/** Assumes the mutation has a single `Input`-style parameter, which should be non-null. */
function getInputType(field: GraphQLField<any, any>): GraphQLInputObjectType | undefined {
  if (field.args.length > 0) {
    if (field.args[0].type instanceof GraphQLNonNull) {
      return (field.args[0].type.ofType as any) as GraphQLInputObjectType;
    } else if (field.args[0].type instanceof GraphQLInputObjectType) {
      return field.args[0].type;
    }
  }
  return undefined;
}

type HasAst = GraphQLObjectType | GraphQLField<any, any>;

/** Finds the relative path within the `$projectDir/schema/` directory. */
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
      .reduce((acc, name) => {
        if (name) {
          if (acc[name]) {
            acc[name]++;
          } else {
            acc[name] = 1;
          }
        }
        return acc;
      }, {} as Record<string, number>);

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

function subDirectory(cwd: string, field: HasAst): string | undefined {
  const path = relativeSourcePath(cwd, field);
  const shouldGoInTopLevel = path && fileNamesConsideredTopLevel.includes(path);
  return !path || shouldGoInTopLevel ? "" : `${path.replace(".graphql", "")}/`;
}

async function writeIfNew(path: string, code: Code): Promise<boolean> {
  const exists = await trueIfResolved(fs.access(path));
  if (!exists) {
    await fs.writeFile(path, await code.toStringWithImports(path));
    return true;
  }
  return false;
}

/** The config values we read from the graphql-codegen.yml file. */
export type Config = {
  contextType: string;
  mappers: Record<string, string>;
  scaffolding?: {
    ignoreObjectsPattern?: string;
  };
};

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
    .reduce((acc, key) => {
      acc[key as keyof T] = obj[key as keyof T];
      return acc;
    }, ({} as any) as T) as T;
}
