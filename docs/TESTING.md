# Testing

The test files use [Vitest](https://vitest.dev). They live under `test/` and import the public API from `../src/index.js`.

## Layout

| File | Covers |
|---|---|
| `test/worddiff.test.ts` | Acceptance example, empty inputs, one empty side, combining marks, merged equal tokens, default and custom `maxCells`, invalid `maxCells`, and `similarity` cases. |
| `test/compare.test.ts` | Valid comparison parsing, every `ViewerError` code, byte limit, model and case limits, and bad shapes for root, baseline, id, prompt and outputs. |
| `test/html.test.ts` | Diff markup and `80%` label, baseline cell without diff markup, escaping and CSP, skipped diff/similarity for large cells, missing baseline note, and byte-identical golden output. |
| `test/cli.test.ts` | `run` success exit `0` and stdout HTML, usage exit `2` with no argument, missing file exit `2` naming the path, and invalid JSON exit `2`. |
| `test/index.test.ts` | The public API exports `wordDiff`, `similarity`, `parseComparison`, `renderHtml`, `run` and `ViewerError`. |
| `test/fixtures/golden.html` | Expected byte-identical output for `renderHtml(basicComparison, { title: "Golden" })`. |

## How to add a test

- Add a `*.test.ts` file under `test/` and import from `../src/index.js`, as the existing tests do, so the public surface stays covered.
- Use fixed inputs. The current suite needs no clocks, network access or randomness.
- If rendered HTML changes on purpose, update `test/fixtures/golden.html` from `renderHtml(basicComparison, { title: "Golden" })` and review the diff before committing.

## Edge cases that must stay covered

- Empty output on one side (a single `insert` or `delete` op).
- Unicode text with combining marks kept intact as one token.
- Identical outputs (one `equal` op and `100%`).
- A prompt containing `</pre>`.
- A cell above the `maxCells` budget, which renders `diff skipped: too large` and `similarity skipped: too large`.

## Other gates

The provided code and tests do not define coverage thresholds or additional CI gates.
