import { dirname } from "path";
import { GraphQLField, GraphQLInputObjectType, GraphQLNonNull, GraphQLObjectType } from "graphql";
import { code, Code, imp } from "ts-poet";
import { SymbolSpec } from "ts-poet/build/SymbolSpecs";
import { PluginFunction, Types } from "@graphql-codegen/plugin-helpers";
import { promises as fs } from "fs";
import { pascalCase } from "change-case";
import PluginOutput = Types.PluginOutput;

const QueryResolvers = imp("QueryResolvers@@src/generated/graphql-types");
const MutationResolvers = imp("MutationResolvers@@src/generated/graphql-types");
const Context = imp(`Context@@src/context`);
const run = imp(`run@@src/resolvers/testUtils`);

const baseDir = "src/resolvers";
const fileNamesConsideredTopLevel = ["schema.graphql", "mutations.graphql", "queries.graphql", "root.graphql"];

export const plugin: PluginFunction<Config> = async (schema, documents, config) => {
  const querySymbols: SymbolSpec[] = [];
  const mutationSymbols: SymbolSpec[] = [];

  const mutationType = schema.getType("Mutation");
  if (mutationType instanceof GraphQLObjectType) {
    const consts = await maybeGenerateMutationScaffolding(mutationType);
    consts.forEach(c => mutationSymbols.push(c));
  }

  const queryType = schema.getType("Query");
  if (queryType instanceof GraphQLObjectType) {
    const consts = await generateQueryScaffolding(queryType);
    consts.forEach(c => querySymbols.push(c));
  }

  await writeBarrelFile("mutationResolvers", MutationResolvers, "mutations.ts", mutationSymbols);
  await writeBarrelFile("queryResolvers", QueryResolvers, "queries.ts", querySymbols);

  // We don't output any content into the generated-types.ts file.
  return {} as PluginOutput;
};

/** Given the `Query` types, generates `foo.ts` and `foo.test.ts` scaffolds for each field. */
async function generateQueryScaffolding(query: GraphQLObjectType): Promise<SymbolSpec[]> {
  const cwd = await fs.realpath(".");

  const promises = Object.values(query.getFields()).map(async field => {
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

      async function run${pascalCase(name)}(ctx: ${Context}, args: ${argsImp}) {
        return await ${run}(ctx, async () => {
          return ${resolverConst}.${name}({}, args, ctx, undefined!);
        });
      }
    `;

    await fs.mkdir(dirname(modulePath), { recursive: true });
    await writeIfNew(`${modulePath}.ts`, resolverContents);
    await writeIfNew(`${modulePath}.test.ts`, testContents);

    return resolverConst;
  });

  return (await Promise.all(promises)).flat();
}

/** Given the `Mutation` type, generates `foo.ts` and `foo.test.ts` scaffolds for each field. */
async function maybeGenerateMutationScaffolding(mutation: GraphQLObjectType): Promise<SymbolSpec[]> {
  const cwd = await fs.realpath(".");

  const promises = Object.values(mutation.getFields()).map(async field => {
    const name = field.name;
    const resolverContents = code`
      export const ${name}: Pick<${MutationResolvers}, "${name}"> = {
        async ${name}(root, args, ctx) {
          throw new Error("not implemented");
        }
      };
    `;

    const inputType = getInputType(field);
    if (!inputType) {
      return;
    }
    const inputImp = imp(`${inputType.name}@@src/generated/graphql-types`);

    const maybeSubDir = subDirectory(cwd, field);
    const modulePath = `${baseDir}/mutations/${maybeSubDir}${name}Resolver`;
    const resolverConst = imp(`${name}@@${modulePath}`);
    const testContents = code`
      describe("${name}", () => {
        it("handles this business case", () => {
          fail();
        });
      });

      async function run${pascalCase(name)}(ctx: ${Context}, input: ${inputImp}) {
        return await ${run}(ctx, async () => {
          return ${resolverConst}.${name}({}, { input }, ctx, undefined!);
        });
      }
    `;

    await fs.mkdir(dirname(modulePath), { recursive: true });
    await writeIfNew(`${modulePath}.ts`, resolverContents);
    await writeIfNew(`${modulePath}.test.ts`, testContents);

    return resolverConst;
  });

  return (await Promise.all(promises)).flat();
}

/** Creates a barrel file that re-exports every symbol in `symbols`. */
async function writeBarrelFile(constName: string, constType: SymbolSpec, filePath: string, symbols: SymbolSpec[]) {
  const contents = code`
    // This file is auto-generated
    
    export const ${constName}: ${constType} = {
      ${symbols.map(symbol => code`...${symbol},`)}
    }
  `;
  await fs.writeFile(`${baseDir}/${filePath}`, await contents.toStringWithImports(filePath));
}

/** Assumes the mutation has a single `Input`-style parameter, which should be non-null. */
function getInputType(field: GraphQLField<any, any>): GraphQLInputObjectType | undefined {
  if (field.args[0].type instanceof GraphQLNonNull) {
    return (field.args[0].type.ofType as any) as GraphQLInputObjectType;
  } else if (field.args[0].type instanceof GraphQLInputObjectType) {
    return field.args[0].type;
  }
  return undefined;
}

/** Finds the relative path within the `$projectDir/schema/` directory. */
function relativeSourcePath(cwd: string, field: GraphQLField<any, any>): string | undefined {
  //  Assume files are in `./schema/*.graphql` files.
  return field.astNode?.loc?.source.name?.replace(cwd, "")?.replace("/schema/", "");
}

function subDirectory(cwd: string, field: GraphQLField<any, any>): string | undefined {
  const path = relativeSourcePath(cwd, field);
  const shouldGoInTopLevel = path && fileNamesConsideredTopLevel.includes(path);
  return !path || shouldGoInTopLevel ? "" : `${path.replace(".graphql", "")}/`;
}

async function writeIfNew(path: string, code: Code): Promise<void> {
  const exists = await trueIfResolved(fs.access(path));
  if (!exists) {
    await fs.writeFile(path, await code.toStringWithImports(path));
  }
}

/** The config values we read from the graphql-codegen.yml file. */
export type Config = {
  contextType: string;
};

/** Returns true if `p` is resolved, otherwise false if it is rejected. */
export async function trueIfResolved(p: Promise<unknown>): Promise<boolean> {
  return await p.then(
    () => true,
    () => false,
  );
}
