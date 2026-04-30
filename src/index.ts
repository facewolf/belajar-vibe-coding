import { Elysia } from "elysia";
import swagger from "@elysiajs/swagger";
import { db } from "./db";
import { users } from "./db/schema";
import { usersRoute } from "./routes/users-route";

const app = new Elysia()
  .use(swagger({
    documentation: {
      info: {
        title: "Belajar Vibe Coding API",
        version: "1.0.0",
        description: "REST API untuk autentikasi user",
      },
      tags: [
        {
          name: "Users",
          description: "Endpoints untuk operasi user",
        },
      ],
    },
  }))
  .get("/", () => "Hello Elysia with Bun!")
  .get("/users", async () => {
    try {
      const allUsers = await db.select().from(users);
      return allUsers;
    } catch (error) {
      return { error: "Failed to fetch users. Is MySQL running?", details: error };
    }
  })
  .use(usersRoute)
  .listen(3000);

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);
