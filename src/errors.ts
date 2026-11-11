/**
 * Error codes for the model output diff viewer.
 */
export type ViewerErrorCode =
  | "invalid_json"
  | "invalid_comparison"
  | "input_too_large"
  | "unknown_baseline"
  | "too_many_models"
  | "too_many_cases";

/**
 * Base error class with a stable machine-readable code.
 */
export class ViewerError extends Error {
  readonly code: ViewerErrorCode;

  constructor(code: ViewerErrorCode, message: string) {
    super(message);
    this.name = "ViewerError";
    this.code = code;
  }
}
