import { describe, it, beforeAll, afterAll, expect } from "bun:test";
import { db } from "../src/db";
import { users, sessions } from "../src/db/schema";
import { eq } from "drizzle-orm";

const BASE_URL = "http://localhost:3000";

describe("POST /api/users/login (Login)", () => {
  const testEmail = `login.test.${Date.now()}@test.com`;
  const testPassword = "password123";
  const testName = "Login Test User";

  beforeAll(async () => {
    // Setup: daftarkan user untuk test login
    await fetch(`${BASE_URL}/api/users`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: testName,
        email: testEmail,
        password: testPassword,
      }),
    });
  });

  afterAll(async () => {
    // Cleanup: hapus user dan session setelah semua test selesai
    const user = await db.select().from(users).where(eq(users.email, testEmail)).limit(1);
    if (user.length > 0) {
      await db.delete(sessions).where(eq(sessions.userId, user[0].id));
      await db.delete(users).where(eq(users.id, user[0].id));
    }
  });

  it("should return token when login with valid credentials", async () => {
    const response = await fetch(`${BASE_URL}/api/users/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: testEmail,
        password: testPassword,
      }),
    });

    const data = await response.json();
    
    expect(response.status).toBe(200);
    expect(data.data).toBeDefined();
    // Token should be a valid UUID format
    expect(data.data).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
  });

  it("should return error when email is not registered", async () => {
    const response = await fetch(`${BASE_URL}/api/users/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: `notexist.${Date.now()}@test.com`,
        password: testPassword,
      }),
    });

    const data = await response.json();
    
    expect(response.status).toBe(401);
    expect(data).toEqual({ error: "Email atau password salah" });
  });

  it("should return error when password is wrong", async () => {
    const response = await fetch(`${BASE_URL}/api/users/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: testEmail,
        password: "wrongpassword",
      }),
    });

    const data = await response.json();
    
    expect(response.status).toBe(401);
    expect(data).toEqual({ error: "Email atau password salah" });
  });

  it("should return error when email is missing", async () => {
    const response = await fetch(`${BASE_URL}/api/users/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        password: testPassword,
      }),
    });

    const data = await response.json();
    
    expect(response.status).toBeGreaterThanOrEqual(400);
  });

  it("should return error when password is missing", async () => {
    const response = await fetch(`${BASE_URL}/api/users/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: testEmail,
      }),
    });

    const data = await response.json();
    
    expect(response.status).toBeGreaterThanOrEqual(400);
  });

  it("should return error when both email and password are missing", async () => {
    const response = await fetch(`${BASE_URL}/api/users/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });

    const data = await response.json();
    
    expect(response.status).toBeGreaterThanOrEqual(400);
  });
});
