import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { run } from "../src/index.js";

function makeIo() {
  const stdout: string[] = [];
  const stderr: string[] = [];
  return {
    io: {
      stdout: { write: (s: string) => stdout.push(s) },
      stderr: { write: (s: string) => stderr.push(s) },
    },
    stdout,
    stderr,
  };
}

describe("run", () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = await mkdtemp(join(tmpdir(), "model-diff-"));
  });

  afterEach(async () => {
    await rm(tmpDir, { recursive: true, force: true });
  });

  it("writes HTML to stdout and resolves 0 on success", async () => {
    const file = join(tmpDir, "cmp.json");
    await writeFile(
      file,
      JSON.stringify({
        baseline: "m1",
        cases: [{ id: "c1", prompt: "p", outputs: { m1: "a", m2: "b" } }],
      }),
    );
    const { io, stdout, stderr } = makeIo();
    const code = await run([file], io);
    expect(code).toBe(0);
    expect(stdout.join("")).toContain("<!doctype html>");
    expect(stderr).toHaveLength(0);
  });

  it("writes usage and returns 2 when no file is given", async () => {
    const { io, stderr } = makeIo();
    const code = await run([], io);
    expect(code).toBe(2);
    expect(stderr.join("")).toContain("Usage:");
  });

  it("returns 2 and names the path for a missing file", async () => {
    const missing = join(tmpDir, "missing.json");
    const { io, stderr } = makeIo();
    const code = await run([missing], io);
    expect(code).toBe(2);
    expect(stderr.join("")).toContain(missing);
  });

  it("returns 2 for invalid JSON", async () => {
    const file = join(tmpDir, "bad.json");
    await writeFile(file, "{");
    const { io, stderr } = makeIo();
    const code = await run([file], io);
    expect(code).toBe(2);
    expect(stderr.join("")).toContain("invalid JSON");
  });
});
