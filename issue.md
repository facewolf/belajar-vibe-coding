# Fitur Login User

Dokumen ini berisi panduan teknis (planning) untuk mengimplementasikan fitur login pengguna. Panduan ini dirancang untuk diikuti langkah demi langkah oleh programmer junior atau model AI agent.

## Spesifikasi Database

Tambahkan definisi tabel baru yaitu `sessions` ke dalam file schema Drizzle (misalnya di `src/db/schema.ts`). Struktur kolomnya adalah sebagai berikut:

*   `id`: integer, auto increment, primary key
*   `token`: varchar(255), not null (nanti akan diisi dengan UUID sebagai token sesi user)
*   `user_id`: integer, foreign key yang merujuk pada kolom `id` di tabel `users`
*   `created_at`: timestamp, default current_timestamp

Setelah menambahkan schema `sessions`, pastikan tabel ini diaplikasikan ke database MySQL melalui proses migrasi yang biasa digunakan di project ini (menggunakan Drizzle Kit).

## Spesifikasi API

Buat endpoint API untuk menangani proses otentikasi login.

*   **Endpoint**: `POST /api/users/login`

**Request Body:**

```json
{
    "email": "admin@localhost",
    "password": "rahasia"
}
```

**Response Body (Success):**

```json
{
    "data": "token_uuid_string_disini"
}
```

**Response Body (Error - Email/Password Salah):**

```json
{
    "error": "Email atau password salah"
}
```

## Standar Struktur Folder dan File

Pekerjaan ini tidak membuat file baru, melainkan akan memodifikasi struktur file yang sudah ada:

1.  **Folder `src/routes`**: Tambahkan route baru di dalam file `users-route.ts`.
2.  **Folder `src/services`**: Tambahkan fungsi bisnis baru di dalam file `users-service.ts`.

## Tahapan Implementasi

Ikuti tahapan berikut secara berurutan:

1.  **Update Schema Database**
    *   Buka file `src/db/schema.ts`.
    *   Definisikan tabel `sessions` menggunakan sintaks Drizzle ORM.
    *   Gunakan fungsi referensi Drizzle untuk menambahkan relasi *Foreign Key* dari `sessions.user_id` ke tabel `users.id` (contoh: `references(() => users.id)`).

2.  **Sinkronisasi / Migrasi Database**
    *   Jalankan perintah sinkronisasi Drizzle (misalnya `bunx drizzle-kit push`) untuk menerapkan pembuatan tabel `sessions` secara langsung ke database MySQL Anda.

3.  **Implementasi Business Logic (Service)**
    *   Buka file `src/services/users-service.ts`.
    *   Tambahkan fungsi baru, misalnya `login(payload)`.
    *   **Langkah Logika**:
        1. Lakukan query (select) ke tabel `users` berdasarkan input `email`.
        2. Jika user tidak ditemukan, lempar (*throw*) error atau *return* dengan pesan "Email atau password salah". (Hindari memberitahu spesifik bahwa email tidak ada).
        3. Jika user ditemukan, verifikasi password-nya menggunakan utilitas Bun: `await Bun.password.verify(inputPassword, hashedPasswordDariDB)`.
        4. Jika verifikasi gagal, *throw* error "Email atau password salah".
        5. Jika verifikasi berhasil, buatlah token UUID baru (Anda bisa menggunakan fitur native JavaScript `crypto.randomUUID()`).
        6. Lakukan insert data sesi baru ke tabel `sessions` yang berisi `token` dan `user_id`.
        7. Kembalikan response sukses berformat `{"data": "isi_tokennya_disini"}`.

4.  **Implementasi Routing (Route)**
    *   Buka file `src/routes/users-route.ts`.
    *   Tambahkan metode `.post("/login", ...)` di dalam instance Elysia `usersRoute` yang sudah ada.
    *   Lakukan validasi body request (gunakan `t.Object` dari Elysia) untuk memastikan field `email` dan `password` bertipe string dan wajib dikirim.
    *   Di dalam handler endpoint, panggil fungsi `login` dari `users-service.ts` dan teruskan data body-nya.
    *   Lakukan *Error Handling*: Tangkap error jika terjadi kesalahan (khususnya untuk pesan "Email atau password salah") dan kembalikan response error tersebut dengan format JSON `{"error": "Email atau password salah"}` menggunakan HTTP Status Code `401 Unauthorized`. Jika sukses, teruskan response balikan dari service.

5.  **Pengujian**
    *   Pastikan server development berjalan (`bun run dev`).
    *   Gunakan HTTP Client (Postman/cURL/Insomnia) untuk mengirim request `POST http://localhost:3000/api/users/login`.
    *   Uji menggunakan kredensial yang salah dan pastikan mendapat *error response* yang tepat.
    *   Uji menggunakan kredensial yang benar (gunakan data user yang dibuat dari fitur registrasi sebelumnya), pastikan menerima response data token, lalu cek tabel `sessions` di database untuk memastikan token dan user_id terkait berhasil disimpan.
