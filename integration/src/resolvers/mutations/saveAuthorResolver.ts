import { MutationResolvers } from "@src/generated/graphql-types";

export const saveAuthor: Pick<MutationResolvers, "saveAuthor"> = {
  async saveAuthor(root, args, ctx) {
    throw new Error("not implemented");
  },
};
