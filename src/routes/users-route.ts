import { Elysia, t } from "elysia";
import { usersService } from "../services/users-service";

export const usersRoute = new Elysia({ prefix: "/api/users" }).post(
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
);
