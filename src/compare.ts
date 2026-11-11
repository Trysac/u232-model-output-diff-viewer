import { Buffer } from "node:buffer";
import { ViewerError } from "./errors.js";
import type { Comparison, ComparisonCase } from "./types.js";

const DEFAULT_MAX_BYTES = 10_000_000;
const MAX_MODELS = 8;
const MAX_CASES = 5_000;

/**
 * Parses and validates a JSON comparison document.
 *
 * @param json - JSON string.
 * @param opts - Optional maximum input size in UTF-8 bytes.
 * @returns Validated comparison.
 * @throws {ViewerError} With a stable code when input is invalid.
 */
export function parseComparison(json: string, opts?: { maxBytes?: number }): Comparison {
  const maxBytes = opts?.maxBytes ?? DEFAULT_MAX_BYTES;
  if (typeof json !== "string") {
    throw new ViewerError("invalid_json", "input must be a string");
  }
  if (Buffer.byteLength(json, "utf8") > maxBytes) {
    throw new ViewerError("input_too_large", `input exceeds ${maxBytes} bytes`);
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    throw new ViewerError("invalid_json", "invalid JSON");
  }
  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    throw new ViewerError("invalid_comparison", "root must be an object");
  }
  const obj = parsed as Record<string, unknown>;
  if ("title" in obj && obj.title !== undefined && typeof obj.title !== "string") {
    throw new ViewerError("invalid_comparison", "title must be a string");
  }
  const baseline = obj.baseline;
  if (typeof baseline !== "string") {
    throw new ViewerError("invalid_comparison", "baseline must be a string");
  }
  if (!Array.isArray(obj.cases)) {
    throw new ViewerError("invalid_comparison", "cases must be an array");
  }
  if (obj.cases.length > MAX_CASES) {
    throw new ViewerError("too_many_cases", `too many cases: ${obj.cases.length}`);
  }
  const cases: ComparisonCase[] = [];
  const modelSet = new Set<string>();
  for (const [index, rawCase] of obj.cases.entries()) {
    if (typeof rawCase !== "object" || rawCase === null || Array.isArray(rawCase)) {
      throw new ViewerError("invalid_comparison", `case ${index} must be an object`);
    }
    const c = rawCase as Record<string, unknown>;
    if (typeof c.id !== "string") {
      throw new ViewerError("invalid_comparison", `case ${index} id must be a string`);
    }
    if (typeof c.prompt !== "string") {
      throw new ViewerError("invalid_comparison", `case ${index} prompt must be a string`);
    }
    if (typeof c.outputs !== "object" || c.outputs === null || Array.isArray(c.outputs)) {
      throw new ViewerError("invalid_comparison", `case ${index} outputs must be an object`);
    }
    const outputsObj = c.outputs as Record<string, unknown>;
    const outputs: Record<string, string> = {};
    for (const [model, output] of Object.entries(outputsObj)) {
      if (typeof output !== "string") {
        throw new ViewerError(
          "invalid_comparison",
          `case ${index} output for ${model} must be a string`,
        );
      }
      outputs[model] = output;
      modelSet.add(model);
    }
    cases.push({ id: c.id, prompt: c.prompt, outputs });
  }
  if (modelSet.size > MAX_MODELS) {
    throw new ViewerError("too_many_models", `too many models: ${modelSet.size}`);
  }
  if (cases.length > 0 && !modelSet.has(baseline)) {
    throw new ViewerError("unknown_baseline", `unknown baseline: ${baseline}`);
  }
  const result: Comparison = { baseline, cases };
  if (typeof obj.title === "string") {
    result.title = obj.title;
  }
  return result;
}
