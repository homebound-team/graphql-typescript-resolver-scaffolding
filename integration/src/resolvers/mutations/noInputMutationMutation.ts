import { MutationResolvers } from "src/generated/graphql-types";

export const noInputMutation: Pick<MutationResolvers, "noInputMutation"> = {
  async noInputMutation(root, args, ctx) {
    throw new Error("not implemented");
  },
};
