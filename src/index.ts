import {
  GraphQLObjectType,
  GraphQLNonNull,
  StringValueNode,
  GraphQLField,
  GraphQLInputType,
  GraphQLInputObjectType,
} from "graphql";
import { code, Code, imp } from "ts-poet";
import { PluginFunction, Types } from "@graphql-codegen/plugin-helpers";
import { promises as fs } from "fs";
import { dirname } from "path";
import { pascalCase } from "change-case";
import PluginOutput = Types.PluginOutput;

const MutationResolvers = imp("MutationResolvers@@src/generated/graphql-types");

export const plugin: PluginFunction<Config> = async (schema, documents, config) => {
  const chunks: Code[] = [];

  const mutationType = schema.getType("Mutation");
  if (mutationType instanceof GraphQLObjectType) {
    await maybeGenerateMutationScaffolding(mutationType);
  }

  const content = await code`${chunks}`.toStringWithImports();
  return { content } as PluginOutput;
};

async function maybeGenerateMutationScaffolding(mutation: GraphQLObjectType): Promise<void[]> {
  const baseDir = "src/resolvers/mutations";
  const Context = imp(`Context@@src/context`);
  const run = imp(`run@@src/resolvers/testUtils`);

  const cwd = await fs.realpath(".");

  return Promise.all(
    Object.values(mutation.getFields()).map(async field => {
      // Assume files are in `./schema/*.graphql` files.
      const relativeLocation = field.astNode?.loc?.source.name?.replace(cwd, "")?.replace("/schema/", "");

      // relativeLocation == {schema,mutations}.graphql --> no sub dir
      const subdir =
        !relativeLocation || relativeLocation === "schema.graphql" || relativeLocation === "mutations.graphql"
          ? ""
          : `${relativeLocation.replace(".graphql", "")}/`;

      const name = field.name;
      const resolverContents = code`
            export const ${name}: Pick<${MutationResolvers}, "${name}"> = {
              async ${name}(root, args, ctx) {
                return undefined!;
              }
            };
          `;

      const inputType = getInputType(field);
      if (!inputType) {
        return;
      }
      const inputImp = imp(`${inputType.name}@@src/generated/graphql-types`);

      const moduleName = `${subdir}${name}Resolver`;
      const resolverConst = imp(`${name}@@${baseDir}/${moduleName}`);
      const testContents = code`
        describe("${name}", () => {
          it("works", () => {
          });
        });

        async function run${pascalCase(name)}(ctx: ${Context}, input: ${inputImp}) {
          return await ${run}(ctx, async () => {
            return ${resolverConst}.${name}({}, { input }, ctx, undefined!);
          });
        }
      `;

      await fs.mkdir(`${baseDir}/${subdir}`, { recursive: true });
      await writeIfNew(`${baseDir}/${moduleName}.ts`, resolverContents);
      await writeIfNew(`${baseDir}/${moduleName}.test.ts`, testContents);
    }),
  );
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
