import { buildSchema, GraphQLSchema } from "graphql";
import { plugin, Config } from "../../src/index";
import * as fs from "fs";

/**
 * Test helper to create a GraphQL schema from SDL string
 */
export function createTestSchema(sdl: string): GraphQLSchema {
  return buildSchema(sdl);
}

/**
 * Represents a file that would be written by the plugin
 */
export interface GeneratedFile {
  path: string;
  content: string;
}

/**
 * Test helper to run the plugin with a given schema and config.
 * Mocks the filesystem to capture generated files instead of writing to disk.
 */
export async function runPlugin(
  schema: GraphQLSchema,
  configOverrides: Partial<Config> = {},
): Promise<Record<string, string>> {
  const defaultConfig: Config = {
    contextType: "src/context#Context",
    mappers: {},
  };
  const config = {
    ...defaultConfig,
    ...configOverrides,
  };

  // Track all file writes
  const writtenFiles: Record<string, string> = {};

  // Mock writeFile to capture file contents
  jest.spyOn(fs.promises, "writeFile").mockImplementation(async (filePath: any, content: any) => {
    const pathStr = filePath.toString();
    const contentStr = typeof content === "string" ? content : content.toString();
    writtenFiles[pathStr] = contentStr;
  });

  // Mock mkdir to do nothing
  jest.spyOn(fs.promises, "mkdir").mockImplementation(async () => {
    return undefined as any;
  });

  // Mock access to always reject (files don't exist yet)
  jest.spyOn(fs.promises, "access").mockImplementation(async () => {
    throw new Error("File does not exist");
  });

  // Mock realpath to return a test directory
  jest.spyOn(fs.promises, "realpath").mockImplementation(async () => {
    return "/test-project";
  });

  try {
    // Run the plugin
    await plugin(schema, [], config);

    return writtenFiles;
  } finally {
    // Restore original implementations
    jest.restoreAllMocks();
  }
}

/**
 * Helper to get a specific file from the generated files
 */
export function getFile(files: Record<string, string>, filename: string): string | undefined {
  // Try exact match first
  if (files[filename]) {
    return files[filename];
  }

  // Try to find by relative path or filename
  const matchingKey = Object.keys(files).find((key) => key.endsWith(filename) || key.includes(filename));
  return matchingKey ? files[matchingKey] : undefined;
}

/**
 * Helper to normalize file paths in snapshots (replace absolute paths with relative)
 */
export function normalizeFilePaths(files: Record<string, string>): Record<string, string> {
  const normalized: Record<string, string> = {};
  for (const [filePath, content] of Object.entries(files)) {
    // Remove the base directory prefix to make paths relative
    const relativePath = filePath.replace(/^src\/resolvers\//, "");
    normalized[relativePath] = content;
  }
  return normalized;
}
