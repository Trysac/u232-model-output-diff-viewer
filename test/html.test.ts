import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";
import { type Comparison, renderHtml } from "../src/index.js";

const basicComparison: Comparison = {
  baseline: "m1",
  cases: [
    {
      id: "c1",
      prompt: "the cat sat",
      outputs: {
        m1: "the cat sat",
        m2: "the dog sat",
      },
    },
  ],
};

describe("renderHtml", () => {
  it("renders diff markup and similarity label", () => {
    const html = renderHtml(basicComparison);
    expect(html).toContain("<del>cat</del><ins>dog</ins>");
    expect(html).toContain("80%");
    const row = html.slice(html.indexOf("<tbody>"), html.indexOf("</tr>", html.indexOf("<tbody>")));
    const cells = row.split("<td");
    const baselineCell = cells[2] ?? "";
    expect(baselineCell).not.toContain("<del>");
    expect(baselineCell).not.toContain("<ins>");
  });

  it("escapes HTML special characters and includes CSP", () => {
    const comparison: Comparison = {
      baseline: "m1",
      cases: [
        {
          id: "c1",
          prompt: "</pre>",
          outputs: {
            m1: '<b>x</b> & "y"',
            m2: "<b>x</b> & 'y'",
          },
        },
      ],
    };
    const html = renderHtml(comparison);
    expect(html).toContain("&lt;b&gt;x&lt;/b&gt; &amp; &quot;y&quot;");
    expect(html).toContain("&lt;/pre&gt;");
    expect(html).not.toContain("<script");
    expect(html).not.toMatch(/\son[a-z]+=/i);
    expect(html).toContain(
      `<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'">`,
    );
  });

  it("marks cells where diff was skipped due to size", () => {
    const a = "x ".repeat(1000);
    const bigA = `${"x ".repeat(1000)}y`;
    const comparison: Comparison = {
      baseline: "m1",
      cases: [
        {
          id: "c1",
          prompt: "large",
          outputs: {
            m1: bigA,
            m2: a,
          },
        },
      ],
    };
    const html = renderHtml(comparison);
    expect(html).toContain("diff skipped: too large");
    expect(html).toContain("similarity skipped: too large");
    const m2Cell = html.slice(html.indexOf("<tbody>"));
    expect(m2Cell).not.toContain("100%</div>");
  });

  it("renders note when baseline output is missing", () => {
    const comparison: Comparison = {
      baseline: "m1",
      cases: [
        {
          id: "c1",
          prompt: "p",
          outputs: {
            m2: "output without baseline",
          },
        },
      ],
    };
    const html = renderHtml(comparison);
    expect(html).toContain("no baseline output");
    expect(html).toContain("output without baseline");
    expect(html).not.toContain("<del>");
  });

  it("produces byte-identical output for the same input", async () => {
    const html = renderHtml(basicComparison, { title: "Golden" });
    const golden = await readFile(new URL("./fixtures/golden.html", import.meta.url), "utf8");
    expect(html).toBe(golden);
  });
});
