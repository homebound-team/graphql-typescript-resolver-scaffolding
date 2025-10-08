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
 * Uses memfs to capture generated files in-memory instead of writing to disk.
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

  // Track all file writes in memory
  const writtenFiles: Record<string, string> = {};

  // Mock fs.promises methods
  jest.spyOn(fs.promises, "writeFile").mockImplementation(async (filePath: any, content: any) => {
    const pathStr = filePath.toString();
    const contentStr = typeof content === "string" ? content : content.toString();
    writtenFiles[pathStr] = contentStr;
  });

  jest.spyOn(fs.promises, "mkdir").mockImplementation(async () => undefined as any);
  jest.spyOn(fs.promises, "access").mockImplementation(async () => {
    throw new Error("File does not exist");
  });
  jest.spyOn(fs.promises, "realpath").mockImplementation(async () => "/test-project");

  try {
    // Run the plugin
    await plugin(schema, [], config);

    return writtenFiles;
  } finally {
    // Restore all mocks
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
