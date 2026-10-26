const sensitiveKey =
  /(?:authorization|cookie|credential|password|passphrase|secret|token|api[_-]?key|image|photo|file[_-]?data)/i;
const secretValue = /(?:sk-ant-[A-Za-z0-9_-]{6,}|Bearer\s+\S+)/gi;
const dataImage = /^data:image\/[a-z0-9.+-]+;base64,/i;
const absoluteUserPath = /\/(?:Users|home)\/[^/\s]+\//g;
const nonPrintingAndBidi =
  /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F\u202A-\u202E\u2066-\u2069]/g;

export function sanitizeUserFacingText(value: string, maxLength = 20_000): string {
  return value.normalize("NFC").replace(nonPrintingAndBidi, "").slice(0, maxLength);
}

export function redactSensitive(value: unknown): unknown {
  return redact(value, new WeakSet<object>());
}

function redact(value: unknown, seen: WeakSet<object>): unknown {
  if (typeof value === "string") {
    if (dataImage.test(value)) return "[REDACTED_IMAGE]";
    return value
      .replace(secretValue, "[REDACTED]")
      .replace(absoluteUserPath, "/[REDACTED_USER]/");
  }

  if (value === null || typeof value !== "object") return value;
  if (seen.has(value)) return "[CIRCULAR]";
  seen.add(value);

  if (Array.isArray(value)) return value.map((item) => redact(item, seen));

  const output: Record<string, unknown> = {};
  for (const [key, nested] of Object.entries(value)) {
    output[key] = sensitiveKey.test(key)
      ? typeof nested === "string" && dataImage.test(nested)
        ? "[REDACTED_IMAGE]"
        : "[REDACTED]"
      : redact(nested, seen);
  }
  return output;
}
