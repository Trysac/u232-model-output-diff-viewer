import { describe, expect, it } from "vitest";
import { parseComparison } from "../src/index.js";

describe("parseComparison", () => {
  it("parses a valid comparison", () => {
    const json = JSON.stringify({
      title: "Test",
      baseline: "m1",
      cases: [
        {
          id: "c1",
          prompt: "hello",
          outputs: { m1: "a", m2: "b" },
        },
      ],
    });
    const c = parseComparison(json);
    expect(c.title).toBe("Test");
    expect(c.baseline).toBe("m1");
    expect(c.cases).toHaveLength(1);
    expect(c.cases[0]?.outputs).toEqual({ m1: "a", m2: "b" });
  });

  it("throws invalid_json for malformed input", () => {
    expect(() => parseComparison("{")).toThrowError(
      expect.objectContaining({ code: "invalid_json" }),
    );
  });

  it("throws input_too_large when byte length exceeds maxBytes", () => {
    const huge = " ".repeat(10_000_001);
    expect(() => parseComparison(huge)).toThrowError(
      expect.objectContaining({ code: "input_too_large" }),
    );
  });

  it("throws unknown_baseline when baseline is not present", () => {
    const json = JSON.stringify({
      baseline: "m9",
      cases: [{ id: "c1", prompt: "p", outputs: { m1: "a" } }],
    });
    expect(() => parseComparison(json)).toThrowError(
      expect.objectContaining({ code: "unknown_baseline" }),
    );
  });

  it("throws too_many_models when more than 8 distinct models", () => {
    const outputs: Record<string, string> = {};
    for (let i = 1; i <= 9; i++) {
      outputs[`m${i}`] = "x";
    }
    const json = JSON.stringify({
      baseline: "m1",
      cases: [{ id: "c1", prompt: "p", outputs }],
    });
    expect(() => parseComparison(json)).toThrowError(
      expect.objectContaining({ code: "too_many_models" }),
    );
  });

  it("throws too_many_cases when cases exceed 5000", () => {
    const cases = Array.from({ length: 5001 }, (_, i) => ({
      id: `c${i}`,
      prompt: "p",
      outputs: { m1: "a" },
    }));
    const json = JSON.stringify({ baseline: "m1", cases });
    expect(() => parseComparison(json)).toThrowError(
      expect.objectContaining({ code: "too_many_cases" }),
    );
  });

  it("throws invalid_comparison for bad shapes", () => {
    expect(() => parseComparison("{}")).toThrowError(
      expect.objectContaining({ code: "invalid_comparison" }),
    );
    expect(() => parseComparison('{"baseline":"m1","cases":[]}')).not.toThrow(); // empty cases okay
    expect(() => parseComparison('{"baseline":1,"cases":[]}')).toThrowError(
      expect.objectContaining({ code: "invalid_comparison" }),
    );
    expect(() =>
      parseComparison('{"baseline":"m1","cases":[{"id":1,"prompt":"p","outputs":{}}]}'),
    ).toThrowError(expect.objectContaining({ code: "invalid_comparison" }));
    expect(() =>
      parseComparison('{"baseline":"m1","cases":[{"id":"c1","prompt":"p","outputs":"bad"}]}'),
    ).toThrowError(expect.objectContaining({ code: "invalid_comparison" }));
  });
});
