import { Context } from "@src/context";

// Placeholder for application-specific before/after invoking system under test.
export function run<T>(ctx: Context, fn: (ctx: Context) => Promise<T>): Promise<T> {
  return fn(ctx);
}
