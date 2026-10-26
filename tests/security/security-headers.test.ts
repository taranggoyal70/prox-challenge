import { describe, expect, it } from "vitest";

import {
  buildContentSecurityPolicy,
  getStableSecurityHeaders,
} from "@/security/headers";

describe("security headers", () => {
  it("builds a request-scoped production CSP without unsafe script execution", () => {
    const policy = buildContentSecurityPolicy({
      nonce: "abc123",
      development: false,
    });

    expect(policy).toContain("default-src 'self'");
    expect(policy).toContain("script-src 'self' 'nonce-abc123' 'strict-dynamic'");
    expect(policy).toContain("object-src 'none'");
    expect(policy).toContain("frame-ancestors 'none'");
    expect(policy).toContain("upgrade-insecure-requests");
    expect(policy).not.toContain("'unsafe-eval'");
  });

  it("permits only the development evaluator needed by Next HMR", () => {
    const policy = buildContentSecurityPolicy({
      nonce: "abc123",
      development: true,
    });

    expect(policy).toContain("'unsafe-eval'");
    expect(policy).not.toContain("upgrade-insecure-requests");
  });

  it("sets clickjacking, MIME, referrer, feature, and isolation headers", () => {
    expect(getStableSecurityHeaders()).toMatchObject({
      "X-Frame-Options": "DENY",
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "no-referrer",
      "Cross-Origin-Opener-Policy": "same-origin",
      "Cross-Origin-Resource-Policy": "same-origin",
    });
    expect(getStableSecurityHeaders()["Permissions-Policy"]).toContain("camera=()");
  });
});
