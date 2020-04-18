import { GraphQLObjectType, StringValueNode } from "graphql";
import { code, Code, imp } from "ts-poet";
import { PluginFunction, Types } from "@graphql-codegen/plugin-helpers";
import PluginOutput = Types.PluginOutput;
import { promises as fs } from "fs";

const builtInScalars = ["Int", "Boolean", "String", "ID", "Float"];
const GraphQLScalarTypeSymbol = imp("GraphQLScalarType@graphql");
const GraphQLResolveInfo = imp("GraphQLResolveInfo@graphql");

export const plugin: PluginFunction<Config> = async (schema, documents, config) => {
  const chunks: Code[] = [];

  const mutationType = schema.getType("Mutation");
  if (mutationType instanceof GraphQLObjectType) {
    const p = Object.values(mutationType.getFields()).map(async field => {
      const orgDirective = field.astNode?.directives?.find(d => d.name.value === "org");
      if (orgDirective) {
        const category = (orgDirective.arguments?.find(a => a.name.value === "category")?.value as
          | StringValueNode
          | undefined)?.value;
        if (category) {
          const name = field.name;
          const path = `src/resolvers/mutations/${category}/${name}.ts`;
          const MutationResolvers = imp("MutationResolvers@src/generated/graphql-types");
          const contents = code`
            export const ${name}: Pick<${MutationResolvers}, "${name}"> = {
              async ${name}(root, args, ctx) {
              }
            };
          `;

          await fs.mkdir(`src/resolvers/mutations/${category}`, { recursive: true });
          const exists = await trueIfResolved(fs.access(path));
          if (!exists) {
            await fs.writeFile(path, await contents.toStringWithImports(path));
          }
        }
      }
    });
    await Promise.all(p);
  }

  const content = await code`${chunks}`.toStringWithImports();
  return { content } as PluginOutput;
};

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
