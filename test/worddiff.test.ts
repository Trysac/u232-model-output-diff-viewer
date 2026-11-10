import { describe, expect, it } from "vitest";
import { similarity, ViewerError, wordDiff } from "../src/index.js";

describe("wordDiff", () => {
  it("matches the acceptance example", () => {
    expect(wordDiff("the cat sat", "the dog sat")).toEqual([
      { op: "equal", text: "the " },
      { op: "delete", text: "cat" },
      { op: "insert", text: "dog" },
      { op: "equal", text: " sat" },
    ]);
  });

  it("returns an empty array for two empty strings", () => {
    expect(wordDiff("", "")).toEqual([]);
  });

  it("handles one empty side with a single insert/delete", () => {
    expect(wordDiff("", "hello")).toEqual([{ op: "insert", text: "hello" }]);
    expect(wordDiff("hello", "")).toEqual([{ op: "delete", text: "hello" }]);
  });

  it("keeps unicode combining marks intact as a single token", () => {
    const s = "a\u0301b";
    expect(wordDiff(s, s)).toEqual([{ op: "equal", text: s }]);
  });

  it("merges adjacent equal tokens", () => {
    expect(wordDiff("same", "same")).toEqual([{ op: "equal", text: "same" }]);
  });

  it("skips the full diff when token product exceeds maxCells", () => {
    const a = "x ".repeat(1000);
    const b = "x ".repeat(1000);
    expect(wordDiff(a, b)).toEqual([{ op: "equal", text: a }]);
    const bigA = `${"x ".repeat(1000)}y`;
    expect(wordDiff(bigA, b)).toEqual([
      { op: "delete", text: bigA },
      { op: "insert", text: b },
    ]);
  });

  it("respects a custom maxCells", () => {
    expect(wordDiff("ab", "cd", { maxCells: 3 })).toEqual([
      { op: "delete", text: "ab" },
      { op: "insert", text: "cd" },
    ]);
  });

  it("throws ViewerError for invalid maxCells", () => {
    expect(() => wordDiff("a", "b", { maxCells: 0 })).toThrow(ViewerError);
    expect(() => wordDiff("a", "b", { maxCells: -1 })).toThrow(ViewerError);
    expect(() => wordDiff("a", "b", { maxCells: 1.5 })).toThrow(ViewerError);
  });
});

describe("similarity", () => {
  it("returns 0.8 for the acceptance example", () => {
    expect(similarity("the cat sat", "the dog sat")).toBeCloseTo(0.8);
  });

  it("returns 1 for two empty strings", () => {
    expect(similarity("", "")).toBe(1);
  });

  it("returns 1 for identical strings", () => {
    expect(similarity("same", "same")).toBe(1);
  });

  it("returns 0 when no tokens match", () => {
    expect(similarity("abc", "def")).toBe(0);
  });
});
