import { db } from "../db";
import { users, sessions } from "../db/schema";
import { eq } from "drizzle-orm";

/**
 * Service untuk menangani logic bisnis terkait user.
 * Berisi fungsi-fungsi untuk operasi CRUD user dan session.
 */
export const usersService = {

  /**
   * Mendaftarkan user baru ke database.
   * 
   * Fungsi ini melakukan:
   * 1. Validasi panjang input (name dan email maks 255 karakter)
   * 2. Pengecekan apakah email sudah terdaftar
   * 3. Hash password menggunakan bcrypt dengan cost 10
   * 4. Penyimpanan data user baru ke database
   * 
   * @param payload - Object berisi name, email, dan password user
   * @returns Object dengan format { data: "OK" } jika berhasil
   * @throws Error jika email sudah terdaftar atau input terlalu panjang
   */
  async register(payload: any) {
    const { name, email, password } = payload;

    // Validasi panjang input
    if (name && name.length > 255) {
      throw new Error("Nama tidak boleh lebih dari 255 karakter");
    }

    if (email && email.length > 255) {
      throw new Error("Email tidak boleh lebih dari 255 karakter");
    }

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

  /**
   * Melakukan autentikasi user dan membuat session baru.
   * 
   * Fungsi ini melakukan:
   * 1. Pengecekan apakah email ada di database
   * 2. Verifikasi password dengan bcrypt
   * 3. Generate UUID token untuk session
   * 4. Penyimpanan session ke database
   * 
   * @param payload - Object berisi email dan password user
   * @returns Object dengan format { data: "<token>" } jika berhasil login
   * @throws Error jika email/password salah
   */
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

  /**
   * Mengambil data user yang sedang login berdasarkan token session.
   * 
   * Fungsi ini melakukan:
   * 1. Pencarian session berdasarkan token menggunakan join dengan tabel users
   * 2. Pengembalian data user (tanpa password) jika session valid
   * 
   * @param token - UUID token dari header Authorization
   * @returns Object dengan format { data: { id, name, email, createdAt } }
   * @throws Error jika token tidak valid atau session tidak ditemukan
   */
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

  /**
   * Melakukan logout dengan menghapus session dari database.
   * 
   * Fungsi ini melakukan:
   * 1. Penghapusan record session berdasarkan token
   * 
   * @param token - UUID token dari header Authorization
   * @returns Object dengan format { data: "OK" }
   */
  async logoutUser(token: string) {
    // 1. Hapus session berdasarkan token
    await db.delete(sessions).where(eq(sessions.token, token));

    return { data: "OK" };
  },
};
