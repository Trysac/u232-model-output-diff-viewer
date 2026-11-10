import { describe, expect, it } from "vitest";
import * as api from "../src/index.js";

describe("public API", () => {
  it("exports all required functions and types", () => {
    expect(typeof api.wordDiff).toBe("function");
    expect(typeof api.similarity).toBe("function");
    expect(typeof api.parseComparison).toBe("function");
    expect(typeof api.renderHtml).toBe("function");
    expect(typeof api.run).toBe("function");
    expect(typeof api.ViewerError).toBe("function");
  });
});
