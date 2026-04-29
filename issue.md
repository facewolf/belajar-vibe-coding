# Fitur Get Current User

Dokumen ini berisi panduan teknis (planning) untuk mengimplementasikan fitur pengambilan data user yang sedang login saat ini (Get Current User). Panduan ini dirancang untuk diikuti langkah demi langkah oleh programmer junior atau model AI agent.

## Spesifikasi API

Buat endpoint API untuk mendapatkan data profil user berdasarkan token otentikasi.

*   **Endpoint**: `GET /api/users/current`

**Request Headers:**

*   `Authorization`: `Bearer <token>`
    *(Keterangan: `<token>` adalah token UUID yang dikembalikan saat proses login dan tersimpan di tabel `sessions`. Token ini terhubung dengan pengguna di tabel `users`)*

**Response Body (Success):**

```json
{
    "data": {
        "id": 1,
        "name": "admin",
        "email": "admin@localhost",
        "created_at": "timestamp"
    }
}
```
*(Catatan: Jangan pernah mengembalikan field `password` di dalam payload response untuk alasan keamanan)*

**Response Body (Error - Jika Token Tidak Valid / Tidak Ada):**

```json
{
    "error": "Unauthorized"
}
```

## Standar Struktur Folder dan File

Pekerjaan ini tidak membuat file baru, melainkan hanya akan memodifikasi file yang sudah ada:

1.  **Folder `src/routes`**: Tambahkan definisi route baru di dalam file `users-route.ts`.
2.  **Folder `src/services`**: Tambahkan fungsi logika bisnis baru di dalam file `users-service.ts`.

## Tahapan Implementasi

Ikuti tahapan berikut secara berurutan:

1.  **Implementasi Business Logic (Service)**
    *   Buka file `src/services/users-service.ts`.
    *   Tambahkan fungsi baru, misalnya `getCurrentUser(token: string)`.
    *   **Langkah Logika**:
        1. Lakukan query (select) ke tabel `sessions` berdasarkan nilai `token` menggunakan Drizzle ORM.
        2. Karena Anda memerlukan data profil penggunanya, lakukan operasi *Join* tabel (atau bisa juga query terpisah ke tabel `users` berdasarkan `user_id` yang didapat dari tabel `sessions`).
        3. Jika token tidak ditemukan di database, atau user-nya tidak ada, lempar (*throw*) error atau *return* dengan pesan "Unauthorized".
        4. Jika data berhasil ditemukan, rangkai objek kembalian yang memuat id, name, email, dan created_at. **Pastikan field password dibuang/tidak disertakan**.
        5. Kembalikan response sukses dengan format `{"data": { ... }}`.

2.  **Implementasi Routing (Route)**
    *   Buka file `src/routes/users-route.ts`.
    *   Tambahkan *handler* baru menggunakan metode `.get("/current", ...)` di dalam instance Elysia `usersRoute`.
    *   Di dalam fungsi *handler*, akses object request headers (biasanya tersedia dari object context: `headers`).
    *   Ekstrak token dari header `Authorization`:
        *   Jika header kosong atau formatnya salah (tidak diawali "Bearer "), lempar error "Unauthorized".
        *   Jika ada, parsing string tersebut untuk mendapatkan teks murni dari `<token>`-nya (hilangkan kata "Bearer ").
    *   Panggil fungsi `getCurrentUser` dari `users-service.ts` dan lemparkan nilai token tersebut.
    *   Lakukan *Error Handling*: Tangkap error jika operasi gagal dan kembalikan *error response* berformat JSON `{"error": "Unauthorized"}` disertai HTTP Status Code `401 Unauthorized`.
    *   Jika operasi berhasil, kembalikan response datanya secara langsung.

3.  **Pengujian**
    *   Jalankan server aplikasi di mode development (`bun run dev`).
    *   Gunakan HTTP Client (Postman/cURL/Insomnia).
    *   Lakukan uji coba mengakses `GET http://localhost:3000/api/users/current` **tanpa** memberikan header `Authorization`. Pastikan responnya adalah error `401 Unauthorized`.
    *   Uji kembali endpoint dengan memberikan header token fiktif (`Authorization: Bearer token_asal_asalan`). Pastikan responnya tetap `401 Unauthorized`.
    *   Lakukan request login di endpoint `POST /api/users/login` untuk mendapatkan token asli.
    *   Gunakan token asli tersebut pada header request `Authorization: Bearer <token_asli>`, lalu tembak endpoint `GET /api/users/current`. Verifikasi bahwa balikan mengembalikan data profil user dengan lengkap namun tanpa password.
