import { Context } from "@src/context";

type MaybePromise<T> = T | Promise<T>;

// Placeholder for application-specific before/after invoking system under test.
export function run<T>(ctx: Context, fn: (ctx: Context) => MaybePromise<T>): MaybePromise<T> {
  return fn(ctx);
}
