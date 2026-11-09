import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { verifyRecaptcha } from "@/lib/recaptcha";

describe("verifyRecaptcha", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  it("should bypass and return success if NODE_ENV is test", async () => {
    process.env.NODE_ENV = "test";
    process.env.RECAPTCHA_SECRET_KEY = "dummy-secret";

    const result = await verifyRecaptcha(null);
    expect(result.success).toBe(true);
  });

  it("should bypass and return success if RECAPTCHA_SECRET_KEY is empty", async () => {
    process.env.NODE_ENV = "production";
    delete process.env.RECAPTCHA_SECRET_KEY;

    const result = await verifyRecaptcha(null);
    expect(result.success).toBe(true);
  });

  it("should fail if secret key is present but token is missing", async () => {
    process.env.NODE_ENV = "production";
    process.env.RECAPTCHA_SECRET_KEY = "secret-key-123";

    const result = await verifyRecaptcha(null);
    expect(result.success).toBe(false);
    expect(result.message).toContain("wajib dicentang");
  });

  it("should return success when Google returns success: true", async () => {
    process.env.NODE_ENV = "production";
    process.env.RECAPTCHA_SECRET_KEY = "secret-key-123";

    vi.spyOn(global, "fetch").mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    } as unknown as Response);

    const result = await verifyRecaptcha("valid-token");
    expect(result.success).toBe(true);
  });

  it("should return failure when Google returns success: false", async () => {
    process.env.NODE_ENV = "production";
    process.env.RECAPTCHA_SECRET_KEY = "secret-key-123";

    vi.spyOn(global, "fetch").mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: false }),
    } as unknown as Response);

    const result = await verifyRecaptcha("invalid-token");
    expect(result.success).toBe(false);
    expect(result.message).toContain("tidak valid atau kedaluwarsa");
  });

  it("should handle network failure gracefully", async () => {
    process.env.NODE_ENV = "production";
    process.env.RECAPTCHA_SECRET_KEY = "secret-key-123";

    vi.spyOn(global, "fetch").mockRejectedValueOnce(new Error("Network offline"));

    const result = await verifyRecaptcha("any-token");
    expect(result.success).toBe(false);
    expect(result.message).toContain("kesalahan");
  });
});
