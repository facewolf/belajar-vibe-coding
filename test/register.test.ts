import { describe, it, beforeAll, afterAll, expect } from "bun:test";
import { db } from "../src/db";
import { users, sessions } from "../src/db/schema";
import { eq } from "drizzle-orm";

const BASE_URL = "http://localhost:3000";

describe("POST /api/users (Register)", () => {
  const testEmail = `register.test.${Date.now()}@test.com`;
  const testPassword = "password123";

  afterAll(async () => {
    // Cleanup: hapus user dan session setelah semua test selesai
    const user = await db.select().from(users).where(eq(users.email, testEmail)).limit(1);
    if (user.length > 0) {
      await db.delete(sessions).where(eq(sessions.userId, user[0].id));
      await db.delete(users).where(eq(users.id, user[0].id));
    }
  });

  it("should return OK when registering with valid data", async () => {
    const timestamp = Date.now();
    const uniqueEmail = `valid.${timestamp}@test.com`;
    
    const response = await fetch(`${BASE_URL}/api/users`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Test User",
        email: uniqueEmail,
        password: testPassword,
      }),
    });

    const data = await response.json();
    
    expect(response.status).toBe(200);
    expect(data).toEqual({ data: "OK" });

    // Cleanup test user
    const user = await db.select().from(users).where(eq(users.email, uniqueEmail)).limit(1);
    if (user.length > 0) {
      await db.delete(sessions).where(eq(sessions.userId, user[0].id));
      await db.delete(users).where(eq(users.id, user[0].id));
    }
  });

  it("should return error 'Email sudah terdaftar' when email already exists", async () => {
    // First registration
    await fetch(`${BASE_URL}/api/users`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Duplicate Test",
        email: testEmail,
        password: testPassword,
      }),
    });

    // Second registration with same email
    const response = await fetch(`${BASE_URL}/api/users`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Duplicate Test 2",
        email: testEmail,
        password: testPassword,
      }),
    });

    const data = await response.json();
    
    expect(response.status).toBe(400);
    expect(data).toEqual({ error: "Email sudah terdaftar" });
  });

  it("should return error when name is more than 255 characters", async () => {
    const longName = "A".repeat(300);
    
    const response = await fetch(`${BASE_URL}/api/users`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: longName,
        email: `longname.${Date.now()}@test.com`,
        password: testPassword,
      }),
    });

    const data = await response.json();
    
    expect(response.status).toBe(400);
    expect(data.error).toContain("Nama tidak boleh lebih dari 255 karakter");
  });

  it("should return error when email is more than 255 characters", async () => {
    const longEmail = `a${"a".repeat(250)}@test.com`;
    
    const response = await fetch(`${BASE_URL}/api/users`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Test User",
        email: longEmail,
        password: testPassword,
      }),
    });

    const data = await response.json();
    
    expect(response.status).toBe(400);
    expect(data.error).toContain("Email tidak boleh lebih dari 255 karakter");
  });

  it("should return error when name is missing", async () => {
    const response = await fetch(`${BASE_URL}/api/users`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: `noname.${Date.now()}@test.com`,
        password: testPassword,
      }),
    });

    const data = await response.json();
    
    // Should return validation error
    expect(response.status).toBeGreaterThanOrEqual(400);
  });

  it("should return error when email is missing", async () => {
    const response = await fetch(`${BASE_URL}/api/users`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Test User",
        password: testPassword,
      }),
    });

    const data = await response.json();
    
    expect(response.status).toBeGreaterThanOrEqual(400);
  });

  it("should return error when password is missing", async () => {
    const response = await fetch(`${BASE_URL}/api/users`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Test User",
        email: `nopass.${Date.now()}@test.com`,
      }),
    });

    const data = await response.json();
    
    expect(response.status).toBeGreaterThanOrEqual(400);
  });

  it("should return error when email format is invalid", async () => {
    const invalidEmails = ["test@", "@test.com", "test", "test@test"];
    
    for (const email of invalidEmails) {
      const response = await fetch(`${BASE_URL}/api/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Test User",
          email: email,
          password: testPassword,
        }),
      });

      const data = await response.json();
      
      // Should return validation error
      expect(response.status).toBeGreaterThanOrEqual(400);
    }
  });
});
