import { Elysia, t } from "elysia";
import { usersService } from "../services/users-service";

export const usersRoute = new Elysia({ prefix: "/api/users", tags: ["Users"] })
  .post(
    "/",
    async ({ body, set }) => {
      try {
        const result = await usersService.register(body);
        return result;
      } catch (error: any) {
        set.status = 400;

        // Handle validation errors
        if (error.message.includes("tidak boleh lebih dari")) {
          return { error: error.message };
        }

        // Handle duplicate email
        if (error.message === "Email sudah terdaftar") {
          return { error: error.message };
        }

        // Generic error
        return { error: "Internal Server Error", details: error.message };
      }
    },
    {
      body: t.Object({
        name: t.String({ minLength: 1, maxLength: 255 }),
        email: t.String({ format: "email", maxLength: 255 }),
        password: t.String({ minLength: 1 }),
      }),
      response: {
        200: t.Object({
          data: t.String({ example: "OK" }),
        }),
        400: t.Object({
          error: t.Union([t.String({ example: "Email sudah terdaftar" }), t.String({ example: "Nama tidak boleh lebih dari 255 karakter" }), t.String({ example: "Email tidak boleh lebih dari 255 karakter" })]),
        }),
      },
      detail: {
        summary: "Mendaftarkan user baru",
        description: "Registrasi user baru dengan name, email, dan password",
      },
    }
  )
  .post(
    "/login",
    async ({ body, set }) => {
      try {
        const result = await usersService.login(body);
        return result;
      } catch (error: any) {
        set.status = 401;
        if (error.message === "Email atau password salah") {
          return { error: error.message };
        }
        set.status = 500;
        return { error: "Internal Server Error", details: error.message };
      }
    },
    {
      body: t.Object({
        email: t.String({ format: "email" }),
        password: t.String(),
      }),
      response: {
        200: t.Object({
          data: t.String({ example: "550e8400-e29b-41d4-a716-446655440000" }),
        }),
        401: t.Object({
          error: t.String({ example: "Email atau password salah" }),
        }),
      },
      detail: {
        summary: "Login user",
        description: "Login dengan email dan password, mengembalikan token UUID",
      },
    }
  )
  .get(
    "/current",
    async ({ headers, set }) => {
      try {
        const authHeader = headers.authorization;
        
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
          throw new Error("Unauthorized");
        }

        const token = authHeader.replace("Bearer ", "").trim();
        if (!token) {
          throw new Error("Unauthorized");
        }

        const result = await usersService.getCurrentUser(token);
        return result;
      } catch (error: any) {
        set.status = 401;
        return { error: "Unauthorized" };
      }
    },
    {
      response: {
        200: t.Object({
          data: t.Object({
            id: t.Number({ example: 1 }),
            name: t.String({ example: "John Doe" }),
            email: t.String({ example: "john@example.com" }),
            createdAt: t.String({ example: "2024-01-01T00:00:00.000Z" }),
          }),
        }),
        401: t.Object({
          error: t.String({ example: "Unauthorized" }),
        }),
      },
      detail: {
        summary: "Get current user",
        description: "Mengambil data user yang sedang login berdasarkan token Bearer",
      },
    }
  )
  .delete(
    "/logout",
    async ({ headers, set }) => {
      try {
        const authHeader = headers.authorization;
        
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
          throw new Error("Unauthorized");
        }

        const token = authHeader.replace("Bearer ", "").trim();
        if (!token) {
          throw new Error("Unauthorized");
        }

        const result = await usersService.logoutUser(token);
        return result;
      } catch (error: any) {
        set.status = 401;
        return { error: "Unauthorized" };
      }
    },
    {
      response: {
        200: t.Object({
          data: t.String({ example: "OK" }),
        }),
        401: t.Object({
          error: t.String({ example: "Unauthorized" }),
        }),
      },
      detail: {
        summary: "Logout user",
        description: "Logout dan hapus session berdasarkan token Bearer",
      },
    }
  );
