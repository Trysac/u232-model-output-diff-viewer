import type { Comparison } from "./types.js";
import { similarity, tokenize, wordDiff } from "./worddiff.js";

const DEFAULT_MAX_CELLS = 4_000_000;

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

interface DiffCell {
  html: string;
  skipped: boolean;
}

function renderDiff(baseline: string, modelOutput: string): DiffCell {
  const tokensA = tokenize(baseline);
  const tokensB = tokenize(modelOutput);
  if (tokensA.length * tokensB.length > DEFAULT_MAX_CELLS) {
    return {
      html: `${escapeHtml(modelOutput)}<div>diff skipped: too large</div>`,
      skipped: true,
    };
  }
  const ops = wordDiff(baseline, modelOutput);
  let html = "";
  for (const op of ops) {
    const escaped = escapeHtml(op.text);
    if (op.op === "equal") {
      html += escaped;
    } else if (op.op === "delete") {
      html += `<del>${escaped}</del>`;
    } else {
      html += `<ins>${escaped}</ins>`;
    }
  }
  return { html, skipped: false };
}

function collectModels(c: Comparison): string[] {
  const seen = new Set<string>();
  const order: string[] = [];
  for (const caseItem of c.cases) {
    for (const model of Object.keys(caseItem.outputs)) {
      if (!seen.has(model)) {
        seen.add(model);
        order.push(model);
      }
    }
  }
  if (!seen.has(c.baseline)) {
    order.unshift(c.baseline);
    seen.add(c.baseline);
  }
  return order;
}

/**
 * Renders a comparison to a self-contained HTML document.
 *
 * @param c - Validated comparison.
 * @param opts - Optional title override.
 * @returns Complete HTML string.
 */
export function renderHtml(c: Comparison, opts?: { title?: string }): string {
  const models = collectModels(c);
  const baselineFirst = [c.baseline, ...models.filter((m) => m !== c.baseline)];
  const title = opts?.title ?? c.title ?? "Model output comparison";
  const bodyRows: string[] = [];

  for (const caseItem of c.cases) {
    const baselineOutput = caseItem.outputs[c.baseline];
    const hasBaseline = baselineOutput !== undefined;
    const cells = baselineFirst
      .map((model) => {
        const output = caseItem.outputs[model] ?? "";
        const isBaseline = model === c.baseline;
        let content: string;
        if (!hasBaseline || isBaseline) {
          content = `<pre style="margin:0; white-space: pre-wrap; word-break: break-word;">${escapeHtml(output)}</pre>`;
        } else {
          const diff = renderDiff(baselineOutput, output);
          const note = diff.skipped
            ? "<div>similarity skipped: too large</div>"
            : `<div>${Math.round(100 * similarity(baselineOutput, output))}%</div>`;
          content = `<pre style="margin:0; white-space: pre-wrap; word-break: break-word;">${diff.html}</pre>${note}`;
        }
        return `<td style="border:1px solid #ccc; padding:8px; vertical-align:top;">${content}</td>`;
      })
      .join("");
    const promptCell = `<td style="border:1px solid #ccc; padding:8px; vertical-align:top;"><pre style="margin:0; white-space: pre-wrap; word-break: break-word;">${escapeHtml(caseItem.prompt)}</pre></td>`;
    bodyRows.push(`<tr>${promptCell}${cells}</tr>`);
    if (!hasBaseline) {
      bodyRows.push(
        `<tr><td colspan="${baselineFirst.length + 1}" style="border:1px solid #ccc; padding:8px; font-style: italic;">no baseline output</td></tr>`,
      );
    }
  }

  const headerCells = ["Prompt", ...baselineFirst]
    .map(
      (h) =>
        `<th style="border:1px solid #ccc; padding:8px; text-align:left;">${escapeHtml(h)}</th>`,
    )
    .join("");
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'">
<title>${escapeHtml(title)}</title>
</head>
<body style="font-family: sans-serif; margin: 20px;">
<h1>${escapeHtml(title)}</h1>
<table style="border-collapse: collapse; width: 100%;">
<thead><tr>${headerCells}</tr></thead>
<tbody>${bodyRows.join("\n")}</tbody>
</table>
</body>
</html>`;
}
