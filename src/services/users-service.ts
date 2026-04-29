import { db } from "../db";
import { users } from "../db/schema";
import { eq } from "drizzle-orm";

export const usersService = {
  async register(payload: any) {
    const { name, email, password } = payload;

    // 1. Cek apakah email sudah ada
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existingUser.length > 0) {
      throw new Error("Email sudah terdaftar");
    }

    // 2. Hash password menggunakan Bun.password (bcrypt)
    const hashedPassword = await Bun.password.hash(password, {
      algorithm: "bcrypt",
      cost: 10,
    });

    // 3. Simpan user baru
    await db.insert(users).values({
      name,
      email,
      password: hashedPassword,
    });

    return { data: "OK" };
  },
};
