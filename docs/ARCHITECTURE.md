# Architecture

The library is a pure pipeline: JSON text in, one self-contained HTML document out. There is no runtime dependency, no network access and no persistence.

```
JSON text --parseComparison--> Comparison --renderHtml--> HTML string
                               ^
                    wordDiff / similarity (token level)
```

## Modules

| Module | Responsibility |
|---|---|
| `src/types.ts` | `DiffOp`, `ComparisonCase` and `Comparison` shapes. |
| `src/errors.ts` | `ViewerError` with the stable `code` union. |
| `src/worddiff.ts` | Tokenizer (`/\s+|\S+/gu`), LCS diff and similarity score. |
| `src/compare.ts` | Validation of the comparison JSON and its limits. |
| `src/html.ts` | Escaping, table rendering and the fixed `4_000_000` cell budget. |
| `src/cli.ts` | `run(argv, io)`: file reading, error mapping and exit codes. |
| `src/index.ts` | The only public entry point; re-exports the API surface. |

## Data flow and boundaries

`parseComparison` owns the input limits: `10_000_000` UTF-8 bytes by default (overridable with `opts.maxBytes`), at most `5_000` cases, at most `8` distinct models, and an `unknown_baseline` check when at least one case exists. Anything that does not match the comparison shape is rejected before rendering starts, so `renderHtml` only sees validated data from this path.

`wordDiff` is deterministic. It builds an LCS table over token suffixes only when `tokens(a) * tokens(b) <= maxCells` (default `4_000_000`); above that budget it returns one `delete` of `a` and one `insert` of `b`, omitting empty sides. An invalid `maxCells` throws `ViewerError` with code `invalid_comparison`.

`renderHtml` applies the same `4_000_000` cell budget per non-baseline cell. A skipped cell shows the escaped output, `diff skipped: too large` and `similarity skipped: too large`; no similarity score is computed. A case missing the baseline output renders its other outputs without diffs and adds a `no baseline output` row.

`similarity` computes `2 * equalTokens / (tokensA + tokensB)` over the token LCS and returns `1` when both sides are empty. It has no cell budget.

`renderHtml` is the only place that produces markup. Every user text value passes through `escapeHtml` (`&`, `<`, `>`, `"`, `'`) before interpolation, attributes are not built from input, and the page uses inline styles only. The document carries a `default-src 'none'; style-src 'unsafe-inline'` Content-Security-Policy and contains no script.

`run` is a thin shell around the pipeline: it reads the file with `node:fs/promises`, maps every failure to a stderr message and exit code `2`, and returns `0` on success.

## Non-goals

Character-level or semantic diffs, scoring correctness, Markdown rendering and interactive filtering (the page is deliberately script-free).
