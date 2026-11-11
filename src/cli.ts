import { readFile } from "node:fs/promises";
import { parseComparison } from "./compare.js";
import { renderHtml } from "./html.js";

const USAGE = "Usage: model-output-diff-viewer <comparison.json>";

/** Input/output abstraction for the CLI runner. */
export interface CliIo {
  stdout: { write(s: string): void };
  stderr: { write(s: string): void };
}

/**
 * Reads a comparison JSON file, renders HTML and writes it to stdout.
 *
 * @param argv - Process arguments (first element is the file path).
 * @param io - Output streams.
 * @returns Exit code (0 success, 2 usage or file/parse error).
 */
export async function run(argv: string[], io: CliIo): Promise<number> {
  if (argv.length !== 1) {
    io.stderr.write(`${USAGE}\n`);
    return 2;
  }
  const path = argv[0];
  if (path === undefined) {
    io.stderr.write(`${USAGE}\n`);
    return 2;
  }
  try {
    const content = await readFile(path, "utf8");
    const comparison = parseComparison(content);
    const html = renderHtml(comparison);
    io.stdout.write(html);
    return 0;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    io.stderr.write(`error: ${message}\n`);
    return 2;
  }
}
