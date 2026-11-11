# Word-level diff and self-contained HTML rendering

Status: accepted (generated, pending human review)

## Context

Teams compare model outputs for identical prompts and need a static, safe diff view. A JSON file with many outputs is hard to inspect; line diff tools are inadequate for prose. The utility must be deterministic, bounded in size, and produce a single file with no external resources or scripts.

## Decision

Implement a deterministic token-based diff using LCS over whitespace/non-whitespace tokens with a configurable maximum product of token counts. Render to HTML with baseline-first columns, inline styles only, a strict Content-Security-Policy, and full HTML escaping. Provide a CLI that reads JSON and writes the HTML.

## Consequences

The diff is word-level and stable. Large inputs beyond the cell product skip the full diff and are explicitly marked. The generated HTML is safe to open locally and attach to pull requests. No runtime dependencies are required.
