import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createCookieSessionStorage } from "@remix-run/node";
import {
  getUserSession,
  createUserSession,
  destroyUserSession,
  requireAuth,
  updateUserSession,
  isAdmin,
  getSessionId,
  validateSessionConfig,
  sessionSecurity,
} from "../session.server";

// Mock the Remix node module
vi.mock("@remix-run/node", () => ({
  createCookieSessionStorage: vi.fn(),
  redirect: vi.fn((url, options) => ({
    status: 302,
    headers: new Map(Object.entries(options?.headers || {})),
    url,
  })),
}));

describe("Session Management", () => {
  let mockSessionStorage: any;
  let mockSession: any;

  beforeEach(() => {
    // Reset environment
    process.env.NODE_ENV = "test";
    process.env.SESSION_SECRET = "test-secret-key-that-is-at-least-32-characters-long";

    // Create mock session
    mockSession = {
      get: vi.fn(),
      set: vi.fn(),
      id: "test-session-id",
    };

    // Create mock session storage
    mockSessionStorage = {
      getSession: vi.fn().mockResolvedValue(mockSession),
      commitSession: vi.fn().mockResolvedValue("mock-cookie-header"),
      destroySession: vi.fn().mockResolvedValue("mock-destroy-cookie-header"),
    };

    (createCookieSessionStorage as any).mockReturnValue(mockSessionStorage);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("getUserSession", () => {
    it("should return null when no session exists", async () => {
      mockSession.get.mockReturnValue(null);
      
      const request = new Request("http://localhost", {
        headers: { Cookie: "__session=invalid" },
      });

      const result = await getUserSession(request);
      expect(result).toBeNull();
    });

    it("should return null when session data is invalid", async () => {
      mockSession.get.mockReturnValue({ invalid: "data" });
      
      const request = new Request("http://localhost", {
        headers: { Cookie: "__session=invalid" },
      });

      const result = await getUserSession(request);
      expect(result).toBeNull();
    });

    it("should return null when session has expired", async () => {
      const expiredSession = {
        userId: "123",
        email: "test@example.com",
        role: "user",
        expiresAt: Date.now() - 1000, // Expired
        createdAt: Date.now() - 10000,
      };
      mockSession.get.mockReturnValue(expiredSession);

      const request = new Request("http://localhost");
      const result = await getUserSession(request);
      expect(result).toBeNull();
    });

    it("should return valid session data", async () => {
      const validSession = {
        userId: "123",
        email: "test@example.com",
        role: "user",
        expiresAt: Date.now() + 10000, // Not expired
        createdAt: Date.now() - 1000,
      };
      mockSession.get.mockReturnValue(validSession);

      const request = new Request("http://localhost");
      const result = await getUserSession(request);
      expect(result).toEqual(validSession);
    });

    it("should handle errors gracefully", async () => {
      mockSession.get.mockImplementation(() => {
        throw new Error("Session error");
      });

      const request = new Request("http://localhost");
      const result = await getUserSession(request);
      expect(result).toBeNull();
    });
  });

  describe("createUserSession", () => {
    it("should create a new session with user data", async () => {
      const userData = {
        userId: "123",
        email: "test@example.com",
        role: "admin" as const,
      };

      const result = await createUserSession(userData, "/dashboard");

      expect(mockSession.set).toHaveBeenCalledWith("user", expect.objectContaining({
        userId: "123",
        email: "test@example.com",
        role: "admin",
        expiresAt: expect.any(Number),
        createdAt: expect.any(Number),
      }));

      expect(result.status).toBe(302);
      expect(result.url).toBe("/dashboard");
    });

    it("should use default role when not provided", async () => {
      const userData = {
        userId: "123",
        email: "test@example.com",
      };

      await createUserSession(userData, "/dashboard");

      expect(mockSession.set).toHaveBeenCalledWith("user", expect.objectContaining({
        role: "user",
      }));
    });
  });

  describe("destroyUserSession", () => {
    it("should destroy the current session", async () => {
      const request = new Request("http://localhost", {
        headers: { Cookie: "__session=valid" },
      });

      const result = await destroyUserSession(request, "/login");

      expect(mockSessionStorage.getSession).toHaveBeenCalledWith("__session=valid");
      expect(mockSessionStorage.destroySession).toHaveBeenCalledWith(mockSession);
      expect(result.status).toBe(302);
      expect(result.url).toBe("/login");
    });

    it("should use default redirect URL", async () => {
      const request = new Request("http://localhost");

      const result = await destroyUserSession(request);

      expect(result.url).toBe("/login");
    });
  });

  describe("requireAuth", () => {
    it("should return user data when authenticated", async () => {
      const validSession = {
        userId: "123",
        email: "test@example.com",
        role: "user",
        expiresAt: Date.now() + 10000,
        createdAt: Date.now(),
      };
      mockSession.get.mockReturnValue(validSession);

      const request = new Request("http://localhost");
      const result = await requireAuth(request);

      expect(result).toEqual(validSession);
      expect(mockSession.set).toHaveBeenCalledWith("user", expect.objectContaining({
        expiresAt: expect.any(Number),
      }));
    });

    it("should throw redirect when not authenticated", async () => {
      mockSession.get.mockReturnValue(null);

      const request = new Request("http://localhost");
      
      await expect(requireAuth(request)).rejects.toMatchObject({
        status: 302,
        url: "/login",
      });
    });

    it("should throw redirect to custom URL", async () => {
      mockSession.get.mockReturnValue(null);

      const request = new Request("http://localhost");
      
      await expect(requireAuth(request, "/custom-login")).rejects.toMatchObject({
        status: 302,
        url: "/custom-login",
      });
    });
  });

  describe("updateUserSession", () => {
    it("should update session data", async () => {
      const currentData = {
        userId: "123",
        email: "test@example.com",
        role: "user",
        expiresAt: Date.now() + 10000,
        createdAt: Date.now(),
      };
      mockSession.get.mockReturnValue(currentData);

      const request = new Request("http://localhost");
      const result = await updateUserSession(request, { role: "admin" });

      expect(mockSession.set).toHaveBeenCalledWith("user", expect.objectContaining({
        role: "admin",
        expiresAt: expect.any(Number),
      }));
      expect(result).toEqual({
        "Set-Cookie": "mock-cookie-header",
      });
    });

    it("should throw error when no active session", async () => {
      mockSession.get.mockReturnValue(null);

      const request = new Request("http://localhost");
      
      await expect(updateUserSession(request, { role: "admin" }))
        .rejects.toThrow("No active session to update");
    });
  });

  describe("isAdmin", () => {
    it("should return true for admin users", async () => {
      const adminSession = {
        userId: "123",
        email: "admin@example.com",
        role: "admin" as const,
        expiresAt: Date.now() + 10000,
        createdAt: Date.now(),
      };
      mockSession.get.mockReturnValue(adminSession);

      const request = new Request("http://localhost");
      const result = await isAdmin(request);

      expect(result).toBe(true);
    });

    it("should return false for regular users", async () => {
      const userSession = {
        userId: "123",
        email: "user@example.com",
        role: "user" as const,
        expiresAt: Date.now() + 10000,
        createdAt: Date.now(),
      };
      mockSession.get.mockReturnValue(userSession);

      const request = new Request("http://localhost");
      const result = await isAdmin(request);

      expect(result).toBe(false);
    });

    it("should return false when no session exists", async () => {
      mockSession.get.mockReturnValue(null);

      const request = new Request("http://localhost");
      const result = await isAdmin(request);

      expect(result).toBe(false);
    });
  });

  describe("getSessionId", () => {
    it("should return session ID when available", async () => {
      const request = new Request("http://localhost");
      const result = await getSessionId(request);

      expect(result).toBe("test-session-id");
    });

    it("should return null when session ID is not available", async () => {
      mockSession.id = undefined;

      const request = new Request("http://localhost");
      const result = await getSessionId(request);

      expect(result).toBeNull();
    });

    it("should handle errors gracefully", async () => {
      mockSessionStorage.getSession.mockRejectedValue(new Error("Session error"));

      const request = new Request("http://localhost");
      const result = await getSessionId(request);

      expect(result).toBeNull();
    });
  });

  describe("validateSessionConfig", () => {
    it("should validate valid configuration", () => {
      const config = {
        cookieName: "custom_session",
        cookieSecret: "valid-secret-key-that-is-long-enough-for-security",
        maxAge: 3600,
        secure: true,
        httpOnly: true,
        sameSite: "strict" as const,
        path: "/api",
      };

      const result = validateSessionConfig(config);
      expect(result).toEqual(config);
    });

    it("should validate with defaults", () => {
      const config = {
        cookieSecret: "valid-secret-key-that-is-long-enough-for-security",
      };

      const result = validateSessionConfig(config);
      expect(result.cookieName).toBe("__session");
      expect(result.maxAge).toBe(60 * 60 * 24 * 7);
    });

    it("should throw error for invalid configuration", () => {
      const config = {
        cookieSecret: "short", // Too short
      };

      expect(() => validateSessionConfig(config)).toThrow();
    });
  });

  describe("sessionSecurity", () => {
    describe("generateSecret", () => {
      it("should generate a secret of specified length", () => {
        const secret = sessionSecurity.generateSecret(64);
        expect(secret).toHaveLength(64);
      });

      it("should generate a secret with default length", () => {
        const secret = sessionSecurity.generateSecret();
        expect(secret).toHaveLength(64);
      });

      it("should generate different secrets each time", () => {
        const secret1 = sessionSecurity.generateSecret();
        const secret2 = sessionSecurity.generateSecret();
        expect(secret1).not.toBe(secret2);
      });

      it("should contain only valid characters", () => {
        const secret = sessionSecurity.generateSecret();
        expect(secret).toMatch(/^[A-Za-z0-9\-_.~]+$/);
      });
    });

    describe("validateSessionData", () => {
      it("should validate correct session data", () => {
        const validData = {
          userId: "123",
          email: "test@example.com",
          role: "user",
          expiresAt: Date.now() + 10000,
          createdAt: Date.now(),
        };

        expect(sessionSecurity.validateSessionData(validData)).toBe(true);
      });

      it("should reject invalid session data", () => {
        const invalidData = {
          userId: 123, // Should be string
          email: "invalid-email",
          role: "invalid-role",
        };

        expect(sessionSecurity.validateSessionData(invalidData)).toBe(false);
      });

      it("should reject null/undefined", () => {
        expect(sessionSecurity.validateSessionData(null)).toBe(false);
        expect(sessionSecurity.validateSessionData(undefined)).toBe(false);
      });
    });

    describe("sanitizeForLogging", () => {
      it("should sanitize sensitive information", () => {
        const sessionData = {
          userId: "1234567890",
          email: "user@example.com",
          role: "admin" as const,
          expiresAt: 1234567890,
          createdAt: 1234567890,
        };

        const sanitized = sessionSecurity.sanitizeForLogging(sessionData);

        expect(sanitized.userId).toBe("12345678...");
        expect(sanitized.email).toBe("us***@example.com");
        expect(sanitized.role).toBe("admin");
        expect(sanitized.expiresAt).toBe(1234567890);
      });
    });
  });

  describe("Integration tests", () => {
    it("should create, retrieve, and destroy a complete session flow", async () => {
      // Create session
      const userData = { userId: "123", email: "test@example.com" };
      const createResponse = await createUserSession(userData, "/dashboard");
      expect(createResponse.status).toBe(302);

      // Mock the cookie header from create response
      const cookieHeader = createResponse.headers.get("Set-Cookie") || "";

      // Retrieve session
      const retrieveRequest = new Request("http://localhost", {
        headers: { Cookie: cookieHeader },
      });

      const retrievedSession = await getUserSession(retrieveRequest);
      expect(retrievedSession).toEqual(expect.objectContaining({
        userId: "123",
        email: "test@example.com",
      }));

      // Destroy session
      const destroyResponse = await destroyUserSession(retrieveRequest, "/login");
      expect(destroyResponse.status).toBe(302);

      // Verify session is destroyed
      const destroyedRequest = new Request("http://localhost", {
        headers: { Cookie: destroyResponse.headers.get("Set-Cookie") || "" },
      });

      const finalSession = await getUserSession(destroyedRequest);
      expect(finalSession).toBeNull();
    });
  });
});