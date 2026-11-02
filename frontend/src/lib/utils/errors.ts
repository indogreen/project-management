type LaravelErrorValue = string | number | boolean | null | undefined | LaravelErrorValue[];
type LaravelErrorPayload = {
  message?: unknown;
  error?: unknown;
  errors?: unknown;
};

export const NETWORK_ERROR_MESSAGE =
  'Tidak dapat terhubung ke server. Periksa koneksi internet Anda.';
export const SERVER_UNAVAILABLE_MESSAGE =
  'Server sedang tidak dapat dihubungi. Coba lagi beberapa saat.';
export const FALLBACK_ERROR_MESSAGE = 'Terjadi kesalahan. Silakan coba lagi.';

/** Narrows unknown values to object records. */
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

/**
 * Checks if the error indicates a network failure or request timeout without a response
 * (e.g. browser offline, DNS failure, ERR_NETWORK, ECONNABORTED, timeout).
 */
function isNetworkOrTimeoutError(err: unknown): boolean {
  if (!isRecord(err)) return false;

  // If a response was received, this is not a no-response network failure
  if ('response' in err && err.response !== undefined && err.response !== null) {
    return false;
  }

  // Axios network error structure or standard network error indicators
  if (err.isAxiosError || err.name === 'AxiosError') {
    return true;
  }

  if ('request' in err && err.request !== undefined) {
    return true;
  }

  const code = typeof err.code === 'string' ? err.code.toUpperCase() : '';
  if (code === 'ERR_NETWORK' || code === 'ECONNABORTED' || code === 'ETIMEDOUT') {
    return true;
  }

  const message = typeof err.message === 'string' ? err.message.toLowerCase() : '';
  if (message.includes('network error') || message.includes('timeout')) {
    return true;
  }

  return false;
}

/**
 * Checks if the response status is 502 (Bad Gateway), 503 (Service Unavailable),
 * or 504 (Gateway Timeout), typically indicating that the backend or tunnel is down.
 */
function isServerUnavailableError(err: unknown): boolean {
  if (!isRecord(err) || !isRecord(err.response)) {
    return false;
  }

  const status = err.response.status;
  return status === 502 || status === 503 || status === 504;
}

/** Recursively stringifies Laravel validation error values. */
function stringifyErrorValue(value: LaravelErrorValue): string[] {
  if (Array.isArray(value)) {
    return value.flatMap((item) => stringifyErrorValue(item));
  }

  if (value === null || value === undefined || value === '') {
    return [];
  }

  return [String(value)];
}

/** Reads the Laravel response payload from axios-like errors. */
function extractResponseData(err: unknown): LaravelErrorPayload | undefined {
  if (!isRecord(err) || !isRecord(err.response)) {
    return undefined;
  }

  const { data } = err.response;
  return isRecord(data) ? data : undefined;
}

/** Flattens Laravel validation error bags into a newline-separated string. */
function extractValidationErrors(errors: unknown): string | undefined {
  if (!isRecord(errors)) {
    return undefined;
  }

  const messages = Object.values(errors).flatMap((value) =>
    stringifyErrorValue(value as LaravelErrorValue)
  );

  return messages.length > 0 ? messages.join('\n') : undefined;
}

/** Returns non-empty string messages only. */
function extractStringMessage(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value : undefined;
}

/**
 * Extracts a user-readable message from Laravel or generic JavaScript errors.
 * Categorizes errors into:
 * a) No response (ERR_NETWORK/timeout): "Tidak dapat terhubung ke server. Periksa koneksi internet Anda."
 * b) 502/503/504 (backend or tunnel down): "Server sedang tidak dapat dihubungi. Coba lagi beberapa saat."
 * c) Other: validation bags, server-provided messages, or fallback.
 */
export function extractApiErrors(err: unknown): string {
  // Case a: Request failed without response (network offline / timeout)
  if (isNetworkOrTimeoutError(err)) {
    return NETWORK_ERROR_MESSAGE;
  }

  // Case b: Server gateway or service unavailable (502 / 503 / 504)
  if (isServerUnavailableError(err)) {
    return SERVER_UNAVAILABLE_MESSAGE;
  }

  // Case c: Other errors (validation errors, API messages, Error instances, or fallback)
  const responseData = extractResponseData(err);
  const validationMessage = extractValidationErrors(responseData?.errors);

  return (
    validationMessage ??
    extractStringMessage(responseData?.message) ??
    extractStringMessage(responseData?.error) ??
    (err instanceof Error ? err.message : undefined) ??
    FALLBACK_ERROR_MESSAGE
  );
}
