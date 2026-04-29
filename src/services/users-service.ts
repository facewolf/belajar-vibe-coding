import { db } from "../db";
import { users, sessions } from "../db/schema";
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

  async login(payload: any) {
    const { email, password } = payload;

    // 1. Cari user berdasarkan email
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (!user) {
      throw new Error("Email atau password salah");
    }

    // 2. Verifikasi password
    const isPasswordCorrect = await Bun.password.verify(password, user.password);

    if (!isPasswordCorrect) {
      throw new Error("Email atau password salah");
    }

    // 3. Buat token UUID baru
    const token = crypto.randomUUID();

    // 4. Simpan ke tabel sessions
    await db.insert(sessions).values({
      token,
      userId: user.id,
    });

    return { data: token };
  },

  async getCurrentUser(token: string) {
    // 1. Cari session beserta data usernya menggunakan join
    const sessionRecord = await db
      .select({
        user: {
          id: users.id,
          name: users.name,
          email: users.email,
          createdAt: users.createdAt,
        },
      })
      .from(sessions)
      .innerJoin(users, eq(sessions.userId, users.id))
      .where(eq(sessions.token, token))
      .limit(1);

    if (sessionRecord.length === 0) {
      throw new Error("Unauthorized");
    }

    // Mengembalikan data user tanpa password
    return { data: sessionRecord[0].user };
  },
};
