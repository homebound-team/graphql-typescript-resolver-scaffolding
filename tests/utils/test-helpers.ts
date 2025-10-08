import { buildSchema, GraphQLSchema, Source } from "graphql";
import { vol } from "memfs";
import { plugin, Config } from "../../src/index";

jest.mock("fs", () => {
  const { fs } = require("memfs");
  const path = require("path");

  return {
    ...fs,
    promises: {
      writeFile: async (filePath: string, content: any, options?: any) => {
        // Ensure directory exists before writing
        const dir = path.dirname(filePath);
        try {
          await fs.promises.mkdir(dir, { recursive: true });
        } catch (e) {
          // Ignore errors if directory already exists
        }
        return fs.promises.writeFile(filePath, content, options);
      },
      mkdir: fs.promises.mkdir.bind(fs.promises),
      access: fs.promises.access.bind(fs.promises),
      readFile: fs.promises.readFile.bind(fs.promises),
      readdir: fs.promises.readdir.bind(fs.promises),
      stat: fs.promises.stat.bind(fs.promises),
      realpath: async (path: string) => {
        // For tests, return the root directory for "."
        if (path === "." || path === "./") {
          return "/";
        }
        return path;
      },
    },
  };
});

/**
 * Test helper to create a GraphQL schema from SDL string
 */
export function createTestSchema(sdl: string, schemaFileName: string = "root.graphql"): GraphQLSchema {
  const source = new Source(sdl, schemaFileName);
  return buildSchema(source);
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
  preExistingFiles: Record<string, string> = {},
): Promise<Record<string, string>> {
  const defaultConfig: Config = {
    contextType: "src/context#Context",
    mappers: {},
  };
  const config = {
    ...defaultConfig,
    ...configOverrides,
  };

  try {
    // Pre-populate the virtual filesystem with existing files
    if (Object.keys(preExistingFiles).length > 0) {
      vol.fromJSON(preExistingFiles);
    }

    // Run the plugin
    await plugin(schema, [], config);

    // Capture all files written to the virtual filesystem
    const allFiles = vol.toJSON();
    const cwd = process.cwd();
    const writtenFiles: Record<string, string> = {};
    for (const [path, content] of Object.entries(allFiles)) {
      if (content !== null) {
        const contentStr = typeof content === "string" ? content : (content as Buffer).toString();
        const relativePath = path.startsWith(cwd) ? path.slice(cwd.length + 1) : path;
        writtenFiles[relativePath] = contentStr;
      }
    }

    return writtenFiles;
  } finally {
    // Clean up the virtual filesystem
    vol.reset();
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
