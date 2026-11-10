# @trysac/model-output-diff-viewer

Render outputs of several models for the same prompts as one static, script-free HTML page with word-level diffs against a baseline model and similarity scores.

## Installation

```bash
npm install @trysac/model-output-diff-viewer
```

## Usage

```ts
import { readFile } from "node:fs/promises";
import { parseComparison, renderHtml } from "@trysac/model-output-diff-viewer";

const json = await readFile("comparison.json", "utf8");
const comparison = parseComparison(json);
const html = renderHtml(comparison, { title: "Prompt eval" });
console.log(html);
```

The input file is a JSON object with optional `title`, a `baseline` model name and a `cases` array. Each case has a string `id`, a string `prompt` and an `outputs` object mapping model names to string outputs. `parseComparison` validates that shape and the limits below before any HTML is rendered.

## API

The public entry point is `src/index.ts`.

- `wordDiff(a: string, b: string, opts?: { maxCells?: number }): DiffOp[]` returns ordered `{ op: "equal" | "delete" | "insert"; text: string }` operations. Tokens are whitespace runs and non-whitespace runs. The default `maxCells` is `4_000_000`; when the product of token counts exceeds it, the result is one delete of `a` and one insert of `b` (empty sides are omitted). An invalid `maxCells` throws `ViewerError` with code `invalid_comparison`.
- `similarity(a: string, b: string): number` returns `2 * equalTokens / (tokensA + tokensB)`, `1` when both sides are empty. It has no cell budget.
- `parseComparison(json: string, opts?: { maxBytes?: number }): Comparison` parses and validates the document. The default byte limit is `10_000_000` UTF-8 bytes; there are at most `5_000` cases and at most `8` distinct models. If there is at least one case, the baseline must appear in some case output.
- `renderHtml(c: Comparison, opts?: { title?: string }): string` returns one self-contained HTML document. Models are columns in first-seen order with the baseline first. The renderer uses a fixed `4_000_000` token-product budget per cell; above it the cell shows `diff skipped: too large` and `similarity skipped: too large` instead of a diff and score. A case missing the baseline output renders its other outputs without diffs and a `no baseline output` row.
- `run(argv: string[], io: { stdout: { write(s: string): void }; stderr: { write(s: string): void } }): Promise<number>` reads exactly one file path with `node:fs/promises`, writes HTML to `io.stdout` and returns `0`. A usage error, file error or parse error writes to `io.stderr` and returns `2`.
- `ViewerError` extends `Error` with `readonly code` one of `invalid_json`, `invalid_comparison`, `input_too_large`, `unknown_baseline`, `too_many_models`, `too_many_cases`.

## Why not git diff or a dashboard

`git diff` and similar line-based tools do not align multiple model outputs against a baseline, and they show line changes rather than word changes in prose. A dashboard needs a server. This library produces a single escaped HTML file with word-level, multi-model, baseline-relative diffs.

## Security

See [docs/SECURITY.md](docs/SECURITY.md).
