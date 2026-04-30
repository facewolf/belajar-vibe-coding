import { describe, it, beforeAll, afterAll, expect } from "bun:test";
import { db } from "../src/db";
import { users, sessions } from "../src/db/schema";
import { eq } from "drizzle-orm";

const BASE_URL = "http://localhost:3000";

describe("GET /api/users/current (Get Current User)", () => {
  const testEmail = `current.test.${Date.now()}@test.com`;
  const testPassword = "password123";
  const testName = "Current Test User";
  let token: string;

  beforeAll(async () => {
    // Setup: daftarkan user dan login untuk mendapatkan token
    await fetch(`${BASE_URL}/api/users`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: testName,
        email: testEmail,
        password: testPassword,
      }),
    });

    const loginResponse = await fetch(`${BASE_URL}/api/users/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: testEmail,
        password: testPassword,
      }),
    });

    const loginData = await loginResponse.json();
    token = loginData.data;
  });

  afterAll(async () => {
    // Cleanup: hapus user dan session setelah semua test selesai
    const user = await db.select().from(users).where(eq(users.email, testEmail)).limit(1);
    if (user.length > 0) {
      await db.delete(sessions).where(eq(sessions.userId, user[0].id));
      await db.delete(users).where(eq(users.id, user[0].id));
    }
  });

  it("should return user data when token is valid", async () => {
    const response = await fetch(`${BASE_URL}/api/users/current`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`,
      },
    });

    const data = await response.json();
    
    expect(response.status).toBe(200);
    expect(data.data).toBeDefined();
    expect(data.data.id).toBeDefined();
    expect(data.data.name).toBe(testName);
    expect(data.data.email).toBe(testEmail);
    expect(data.data.createdAt).toBeDefined();
    // Password should not be included
    expect(data.data.password).toBeUndefined();
  });

  it("should return error when Authorization header is missing", async () => {
    const response = await fetch(`${BASE_URL}/api/users/current`, {
      method: "GET",
    });

    const data = await response.json();
    
    expect(response.status).toBe(401);
    expect(data).toEqual({ error: "Unauthorized" });
  });

  it("should return error when Authorization format is wrong", async () => {
    const response = await fetch(`${BASE_URL}/api/users/current`, {
      method: "GET",
      headers: {
        "Authorization": token, // Without "Bearer " prefix
      },
    });

    const data = await response.json();
    
    expect(response.status).toBe(401);
    expect(data).toEqual({ error: "Unauthorized" });
  });

  it("should return error when token is fake/non-existent", async () => {
    const fakeToken = "00000000-0000-0000-0000-000000000000";
    
    const response = await fetch(`${BASE_URL}/api/users/current`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${fakeToken}`,
      },
    });

    const data = await response.json();
    
    expect(response.status).toBe(401);
    expect(data).toEqual({ error: "Unauthorized" });
  });

  it("should return error when token is empty", async () => {
    const response = await fetch(`${BASE_URL}/api/users/current`, {
      method: "GET",
      headers: {
        "Authorization": "Bearer ",
      },
    });

    const data = await response.json();
    
    expect(response.status).toBe(401);
    expect(data).toEqual({ error: "Unauthorized" });
  });

  it("should return error when user is deleted after login", async () => {
    // First, verify current user works
    const currentResponse = await fetch(`${BASE_URL}/api/users/current`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`,
      },
    });
    
    expect(currentResponse.status).toBe(200);

    // Delete the user
    const user = await db.select().from(users).where(eq(users.email, testEmail)).limit(1);
    if (user.length > 0) {
      await db.delete(sessions).where(eq(sessions.userId, user[0].id));
      await db.delete(users).where(eq(users.id, user[0].id));
    }

    // Now current should return unauthorized
    const afterDeleteResponse = await fetch(`${BASE_URL}/api/users/current`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`,
      },
    });

    const data = await afterDeleteResponse.json();
    
    expect(afterDeleteResponse.status).toBe(401);
    expect(data).toEqual({ error: "Unauthorized" });
  });
});
