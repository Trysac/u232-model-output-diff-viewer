# Documentation

Everything you need to use, test and extend `@trysac/model-output-diff-viewer`.

- [Architecture](ARCHITECTURE.md): modules, data flow and boundaries.
- [Testing](TESTING.md): test suites, golden fixture and coverage rules.
- [Security](SECURITY.md): escaping, CSP and input limits.
- [Project](PROJECT.md): objective, scope and project record.
- [Stack](STACK.md): tools used and discarded.
- [Decisions](decisions/0001-record-architecture-decisions.md): architecture decision records.
- [Demo](example/comparison.json): a small comparison input and the [generated page](example/comparison.html).

## Run the demo

```ts
import { readFile } from 'node:fs/promises';
import { parseComparison, renderHtml } from '@trysac/model-output-diff-viewer';

const json = await readFile('docs/example/comparison.json', 'utf8');
const html = renderHtml(parseComparison(json));
console.log(html);
```

The committed `docs/example/comparison.html` is exactly that output, so it doubles as a visual
reference and as a smoke check for the renderer.
