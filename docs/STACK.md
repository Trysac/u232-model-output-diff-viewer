# Stack

## Runtime

- **Node.js 20+**: the package is ES modules and uses only `node:buffer` and `node:fs/promises` from the standard library.
- **TypeScript**: the implementation and public types are written in TypeScript under `src/` and exported through `src/index.ts`.
- **No runtime dependencies**: rendering is string concatenation and the diff uses plain arrays and loops.

## Development tools

| Tool | Why |
|---|---|
| Vitest | Test runner imported by every `test/*.test.ts` file. |
| TypeScript | Source language for the API and implementation. |

## Considered and discarded

- **git diff or other line-based diff tools**: line diffs hide word changes in prose and do not align multiple models against a baseline.
- **A dashboard or server**: the deliverable is a file to attach to a pull request; no server is required.
- **Character-level or semantic diff libraries**: explicitly out of scope.
- **Runtime template engines**: the renderer is string concatenation with one escaping function; no template dependency is present.
