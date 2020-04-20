import { QueryResolvers } from "@src/generated/graphql-types";

export const authors: Pick<QueryResolvers, "authors"> = {
  async authors(root, args, ctx) {
    throw new Error("not implemented");
  },
};
