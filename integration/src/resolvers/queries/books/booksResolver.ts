import { QueryResolvers } from "@src/generated/graphql-types";

export const books: Pick<QueryResolvers, "books"> = {
  async books(root, args, ctx) {
    return undefined!;
  },
};
