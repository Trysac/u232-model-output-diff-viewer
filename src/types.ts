/** A single diff operation. */
export interface DiffOp {
  op: "equal" | "delete" | "insert";
  text: string;
}

/** One prompt case with model outputs keyed by model identifier. */
export interface ComparisonCase {
  id: string;
  prompt: string;
  outputs: Record<string, string>;
}

/** Parsed comparison structure. */
export interface Comparison {
  title?: string;
  baseline: string;
  cases: ComparisonCase[];
}
