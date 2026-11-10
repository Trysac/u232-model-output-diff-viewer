# Security practices

## Threat model

### Defended

- HTML injection from prompts, outputs, model names and titles: every text value is escaped before interpolation, and the page carries `default-src 'none'; style-src 'unsafe-inline'`.
- Loading of external scripts, styles, fonts, images or other resources: the CSP has `default-src 'none'`, and the renderer emits no `<script` elements, no `on*` attributes and no remote URLs.
- Unbounded LCS work during rendering: `renderHtml` skips a diff when the product of token counts exceeds `4_000_000` and does not compute a similarity score for that cell.
- Oversized comparison documents: `parseComparison` enforces `10_000_000` UTF-8 bytes by default, at most `5_000` cases and at most `8` distinct models before rendering.
- Runtime supply-chain risk: the package has no runtime dependencies.

### Not defended

- The CLI does not sandbox file access. `run` reads the path it is given with `node:fs/promises` under the permissions of the calling process.
- The public `similarity` function has no `maxCells` guard; a caller can pass inputs large enough to make its LCS computation expensive.
- The `maxBytes` option of `parseComparison` can be raised by the caller; the default limit is not a hard cap for code that overrides it.
- The library does not verify the truth, authorship or quality of model outputs.
- The generated file can still be large up to the accepted input size; the limits bound work, not the file size on disk.

## Escaping

Every prompt, output, model name and title is passed through `escapeHtml` before interpolation: `&` becomes `&amp;`, `<` becomes `&lt;`, `>` becomes `&gt;`, `"` becomes `&quot;` and `'` becomes `&#39;`. The renderer does not build HTML attributes from input; style attributes and table cell attributes are constants.

## No script, no external resources

The page contains no `<script` element and no event-handler attribute. It uses inline styles only and has no remote stylesheets, fonts or images. The document includes:

`<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'">`

## Bounded work

`parseComparison` rejects input above `10_000_000` UTF-8 bytes, more than `5_000` cases and more than `8` distinct models. `wordDiff` defaults to `maxCells = 4_000_000`; above that budget it returns one delete and one insert. `renderHtml` uses the same `4_000_000` cell budget, renders `diff skipped: too large` for a skipped cell and does not call `similarity` for it.

## Dependencies

There are no runtime dependencies. The implementation uses `node:buffer`, `node:fs/promises` and string operations from the standard library.

## Reporting

Do not open a public issue for a vulnerability. Use the repository's private security advisory form.
