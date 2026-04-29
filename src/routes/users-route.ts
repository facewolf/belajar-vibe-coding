import { Elysia, t } from "elysia";
import { usersService } from "../services/users-service";

export const usersRoute = new Elysia({ prefix: "/api/users" })
  .post(
    "/",
    async ({ body, set }) => {
      try {
        const result = await usersService.register(body);
        return result;
      } catch (error: any) {
        set.status = 400;
        if (error.message === "Email sudah terdaftar") {
          return { error: error.message };
        }
        return { error: "Internal Server Error", details: error.message };
      }
    },
    {
      body: t.Object({
        name: t.String(),
        email: t.String(),
        password: t.String(),
      }),
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
        email: t.String(),
        password: t.String(),
      }),
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
    }
  );
