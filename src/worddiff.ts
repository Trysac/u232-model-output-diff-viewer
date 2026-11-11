import { ViewerError } from "./errors.js";
import type { DiffOp } from "./types.js";

const DEFAULT_MAX_CELLS = 4_000_000;

/** Tokenizes input into whitespace runs and non-whitespace runs. */
export function tokenize(s: string): string[] {
  const matches = s.match(/\s+|\S+/gu);
  return matches ?? [];
}

function at<T>(items: T[], index: number): T {
  return items[index] as T;
}

function lcsLength(a: string[], b: string[]): number {
  const n = a.length;
  const m = b.length;
  if (n === 0 || m === 0) return 0;
  const prev = new Array<number>(m + 1).fill(0);
  const curr = new Array<number>(m + 1).fill(0);
  for (let i = n - 1; i >= 0; i--) {
    const ai = at(a, i);
    for (let j = m - 1; j >= 0; j--) {
      const bj = at(b, j);
      const diagonal = at(prev, j + 1);
      const down = at(prev, j);
      const right = at(curr, j + 1);
      curr[j] = ai === bj ? diagonal + 1 : Math.max(down, right);
    }
    for (let j = 0; j <= m; j++) {
      prev[j] = at(curr, j);
      curr[j] = 0;
    }
  }
  return at(prev, 0);
}

function mergeOps(ops: DiffOp[]): DiffOp[] {
  if (ops.length === 0) return ops;
  const merged: DiffOp[] = [];
  for (const op of ops) {
    const last = merged[merged.length - 1];
    if (last !== undefined && last.op === op.op) {
      last.text += op.text;
    } else {
      merged.push({ op: op.op, text: op.text });
    }
  }
  return merged;
}

/**
 * Computes a deterministic word-level diff between two strings.
 *
 * Tokens are whitespace runs or non-whitespace runs. When the product of token
 * counts exceeds `maxCells` (default 4_000_000), the diff is skipped and a
 * single delete/insert pair is returned.
 *
 * @param a - Left side string.
 * @param b - Right side string.
 * @param opts - Optional maximum cells product.
 * @returns Ordered list of diff operations.
 * @throws {ViewerError} When `maxCells` is not a positive integer.
 */
export function wordDiff(a: string, b: string, opts?: { maxCells?: number }): DiffOp[] {
  const maxCells = opts?.maxCells ?? DEFAULT_MAX_CELLS;
  if (!Number.isFinite(maxCells) || maxCells <= 0 || !Number.isInteger(maxCells)) {
    throw new ViewerError("invalid_comparison", "maxCells must be a positive integer");
  }
  const tokensA = tokenize(a);
  const tokensB = tokenize(b);
  const n = tokensA.length;
  const m = tokensB.length;
  if (n === 0 && m === 0) return [];
  if (n * m > maxCells) {
    const skipped: DiffOp[] = [];
    if (n > 0) skipped.push({ op: "delete", text: a });
    if (m > 0) skipped.push({ op: "insert", text: b });
    return skipped;
  }
  const lcs: number[][] = Array.from({ length: n + 1 }, () => new Array<number>(m + 1).fill(0));
  for (let i = n - 1; i >= 0; i--) {
    const row = at(lcs, i);
    const nextRow = at(lcs, i + 1);
    const ai = at(tokensA, i);
    for (let j = m - 1; j >= 0; j--) {
      const bj = at(tokensB, j);
      row[j] = ai === bj ? at(nextRow, j + 1) + 1 : Math.max(at(nextRow, j), at(row, j + 1));
    }
  }
  const ops: DiffOp[] = [];
  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    const ai = at(tokensA, i);
    const bj = at(tokensB, j);
    if (ai === bj) {
      ops.push({ op: "equal", text: ai });
      i++;
      j++;
    } else {
      const deleteScore = at(at(lcs, i + 1), j);
      const insertScore = at(at(lcs, i), j + 1);
      if (deleteScore >= insertScore) {
        ops.push({ op: "delete", text: ai });
        i++;
      } else {
        ops.push({ op: "insert", text: bj });
        j++;
      }
    }
  }
  while (i < n) {
    ops.push({ op: "delete", text: at(tokensA, i) });
    i++;
  }
  while (j < m) {
    ops.push({ op: "insert", text: at(tokensB, j) });
    j++;
  }
  return mergeOps(ops);
}

/**
 * Returns a similarity score between 0 and 1 based on token equality.
 *
 * When both inputs are empty the similarity is 1.
 */
export function similarity(a: string, b: string): number {
  const tokensA = tokenize(a);
  const tokensB = tokenize(b);
  if (tokensA.length === 0 && tokensB.length === 0) return 1;
  const equal = lcsLength(tokensA, tokensB);
  const denom = tokensA.length + tokensB.length;
  return denom === 0 ? 1 : (2 * equal) / denom;
}
