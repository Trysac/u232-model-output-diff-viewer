# Project record

## Objective

Give teams a way to compare the outputs of several models for the same prompts without reading a JSON file by hand: one static, script-free HTML page with word-level diffs against a chosen baseline and a similarity score per cell.

## Scope

In scope:

- Parsing and validating `{ title?: string, baseline: string, cases: [{ id: string, prompt: string, outputs: Record<string, string> }] }`.
- Token-level diff over whitespace runs and non-whitespace runs with a deterministic LCS walk.
- Similarity scoring from the equal tokens of that diff.
- Input limits: `10_000_000` UTF-8 bytes by default, at most `5_000` cases and at most `8` distinct models.
- A self-contained, escaped HTML document with inline styles only and a `default-src 'none'; style-src 'unsafe-inline'` Content-Security-Policy.
- A `run(argv, io)` entry point that reads one comparison file and writes the HTML document to stdout.

Out of scope:

- Character-level or semantic diffs.
- Judging which output is better or verifying scoring correctness.
- Markdown rendering of outputs.
- Interactive filtering or any behavior that needs JavaScript in the generated page.
- A server, dashboard, network access or persistence.

## Milestones

The specification records no dates. The delivered code contains these pieces:

- tokenizer, LCS diff and similarity (`src/worddiff.ts`);
- validation and stable `ViewerError` codes (`src/compare.ts`, `src/errors.ts`);
- HTML renderer with escaping, CSP and a golden fixture (`src/html.ts`, `test/fixtures/golden.html`);
- CLI runner and public exports (`src/cli.ts`, `src/index.ts`).

## Effort

| Item | Value |
|---|---|
| Implementation effort | pending measurement |

## Factory run u232 (measured from API usage)

| Date (UTC) | Phase | Model | Batch | Input | Output | Cache write | Cache read | Cost (USD) |
|---|---|---|---|---|---|---|---|---|
| 2026-11-10 | generation | deepseek-v4-pro | yes | 1501 | 23496 | 0 | 3584 | 0.0476 |
| 2026-11-10 | fix-1 | deepseek-flash | no | 19384 | 16611 | 0 | 237440 | 0.0136 |
| 2026-11-10 | audit | deepseek-flash | no | 18402 | 16930 | 0 | 316544 | 0.0139 |
| 2026-11-10 | fix-2 | deepseek-flash | no | 15720 | 12200 | 0 | 233344 | 0.0104 |
| 2026-11-10 | docs | deepseek-flash | no | 13970 | 15413 | 0 | 256 | 0.0113 |

Total: $0.0968. Prices: deepseek line, as measured by its adapter. Providers serve the current version of each model id, so the date tells which version answered; versions, launch stages and price sources per line are in the factory's model register (docs/MODELS.md).
