import { isTransientNetworkError } from "./dns-fix";

type AirtableLikeError = {
  message?: string;
  error?: string | { type?: string; message?: string };
  statusCode?: number;
  code?: string;
};

export function getErrorMessage(err: unknown): string {
  if (!err || typeof err !== "object") {
    return typeof err === "string" ? err : "Unexpected error";
  }

  const e = err as AirtableLikeError;

  if (isTransientNetworkError(err)) {
    return "Could not reach Airtable (temporary DNS/network issue). Please try again in a moment.";
  }

  if (typeof e.error === "object" && e.error?.message) {
    return e.error.message;
  }

  if (e.message) {
    // Airtable SDK: Insufficient permissions to create new select option ""auth""
    const selectMatch = e.message.match(
      /create new select option ""([^"]+)""/i,
    );
    if (selectMatch) {
      return `“${selectMatch[1]}” is not an allowed option in Airtable. Use an existing choice for that field (or add it in Airtable first).`;
    }
    if (/select option/i.test(e.message)) {
      return `${e.message}. Add that choice in Airtable, then try again.`;
    }
    return e.message;
  }

  return "Unexpected error";
}

export function getErrorStatus(err: unknown): number {
  if (!err || typeof err !== "object") return 500;
  const e = err as AirtableLikeError & { statusCode?: number };
  if (typeof e.statusCode === "number") return e.statusCode;
  if (isTransientNetworkError(err)) return 503;

  const message = getErrorMessage(err);
  if (/not found/i.test(message)) return 404;
  if (/already exists|already on the team/i.test(message)) return 409;
  if (/authentication|invalid email or password|invalid or expired/i.test(message)) {
    return 401;
  }
  if (/required|missing|invalid|permission|select option|not an allowed|read-only|invite/i.test(message)) {
    return 400;
  }
  return 500;
}
