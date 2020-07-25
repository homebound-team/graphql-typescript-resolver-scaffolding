import { MutationResolvers } from "src/generated/graphql-types";

export const saveBook: Pick<MutationResolvers, "saveBook"> = {
  async saveBook(root, args, ctx) {
    throw new Error("not implemented");
  },
};
