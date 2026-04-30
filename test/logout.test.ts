import { describe, it, beforeAll, afterAll, expect } from "bun:test";
import { db } from "../src/db";
import { users, sessions } from "../src/db/schema";
import { eq } from "drizzle-orm";

const BASE_URL = "http://localhost:3000";

describe("DELETE /api/users/logout (Logout)", () => {
  const testEmail = `logout.test.${Date.now()}@test.com`;
  const testPassword = "password123";
  const testName = "Logout Test User";
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

  it("should return OK when logout with valid token", async () => {
    // Login untuk dapat token baru
    const loginResponse = await fetch(`${BASE_URL}/api/users/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: testEmail,
        password: testPassword,
      }),
    });

    const loginData = await loginResponse.json();
    const newToken = loginData.data;

    const response = await fetch(`${BASE_URL}/api/users/logout`, {
      method: "DELETE",
      headers: {
        "Authorization": `Bearer ${newToken}`,
      },
    });

    const data = await response.json();
    
    expect(response.status).toBe(200);
    expect(data).toEqual({ data: "OK" });
  });

  it("should return error when Authorization header is missing", async () => {
    const response = await fetch(`${BASE_URL}/api/users/logout`, {
      method: "DELETE",
    });

    const data = await response.json();
    
    expect(response.status).toBe(401);
    expect(data).toEqual({ error: "Unauthorized" });
  });

  it("should return error when Authorization format is wrong", async () => {
    const response = await fetch(`${BASE_URL}/api/users/logout`, {
      method: "DELETE",
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
    
    const response = await fetch(`${BASE_URL}/api/users/logout`, {
      method: "DELETE",
      headers: {
        "Authorization": `Bearer ${fakeToken}`,
      },
    });

    const data = await response.json();
    
    expect(response.status).toBe(401);
    expect(data).toEqual({ error: "Unauthorized" });
  });

  it("should return error when token is empty", async () => {
    const response = await fetch(`${BASE_URL}/api/users/logout`, {
      method: "DELETE",
      headers: {
        "Authorization": "Bearer ",
      },
    });

    const data = await response.json();
    
    expect(response.status).toBe(401);
    expect(data).toEqual({ error: "Unauthorized" });
  });

  it("should delete session after logout - verify with current endpoint", async () => {
    // Login untuk dapat token baru
    const loginResponse = await fetch(`${BASE_URL}/api/users/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: testEmail,
        password: testPassword,
      }),
    });

    const loginData = await loginResponse.json();
    const logoutToken = loginData.data;

    // Verify session exists
    const currentBefore = await fetch(`${BASE_URL}/api/users/current`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${logoutToken}`,
      },
    });
    
    expect(currentBefore.status).toBe(200);

    // Logout
    await fetch(`${BASE_URL}/api/users/logout`, {
      method: "DELETE",
      headers: {
        "Authorization": `Bearer ${logoutToken}`,
      },
    });

    // Verify session is deleted - current should return unauthorized
    const currentAfter = await fetch(`${BASE_URL}/api/users/current`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${logoutToken}`,
      },
    });

    const data = await currentAfter.json();
    
    expect(currentAfter.status).toBe(401);
    expect(data).toEqual({ error: "Unauthorized" });
  });
});
