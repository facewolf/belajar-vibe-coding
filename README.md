# Belajar Vibe Coding

REST API untuk autentikasi user menggunakan Bun, Elysia, dan Drizzle ORM dengan database MySQL.

## Technology Stack

- **Runtime**: [Bun](https://bun.com) v1.3+
- **Framework**: [Elysia](https://elysia.js.org/) - Framework HTTP untuk Bun
- **ORM**: [Drizzle ORM](https://orm.drizzle.team/) - Type-safe ORM untuk MySQL
- **Database**: MySQL
- **Language**: TypeScript

## Library yang Digunakan

| Library | Versi | Deskripsi |
|---------|-------|----------|
| elysia | ^1.4.28 | HTTP framework |
| drizzle-orm | ^0.45.2 | Database ORM |
| mysql2 | ^3.22.3 | MySQL driver |
| dotenv | ^17.4.2 | Environment variable |

## Arsitektur Project

```
src/
├── index.ts              # Entry point aplikasi
├── db/
│   ├── index.ts         # Konfigurasi koneksi database
│   └── schema.ts        # Definisi schema database
├── routes/
│   └── users-route.ts   # Routing untuk API user
└── services/
    └── users-service.ts # Logic bisnis untuk user

test/
├── register.test.ts     # Unit test untuk register
├── login.test.ts        # Unit test untuk login
├── current.test.ts      # Unit test untuk get current user
└── logout.test.ts       # Unit test untuk logout
```

### Struktur File

- **Routes**: Menggunakan format `nama-route.ts` (contoh: `users-route.ts`)
- **Services**: Menggunakan format `nama-service.ts` (contoh: `users-service.ts`)
- **Test**: Menggunakan format `nama.test.ts` (contoh: `register.test.ts`)

## Database Schema

### Tabel `users`

| Kolom | Tipe | Constraint | Deskripsi |
|-------|------|-----------|-----------|
| id | INT | PRIMARY KEY, AUTO_INCREMENT | ID user |
| name | VARCHAR(255) | NOT NULL | Nama user |
| email | VARCHAR(255) | NOT NULL, UNIQUE | Email user |
| password | VARCHAR(255) | NOT NULL | Password (hashed) |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Tanggal pembuatan |

### Tabel `sessions`

| Kolom | Tipe | Constraint | Deskripsi |
|-------|------|-----------|-----------|
| id | INT | PRIMARY KEY, AUTO_INCREMENT | ID session |
| token | VARCHAR(255) | NOT NULL | Token UUID untuk autentikasi |
| user_id | INT | FOREIGN KEY → users.id | Relasi ke user |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Tanggal pembuatan |

## API Endpoints

### 1. POST /api/users (Register)

Mendaftarkan user baru.

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

**Response Sukses (200):**
```json
{
  "data": "OK"
}
```

**Response Error (400):**
```json
{
  "error": "Email sudah terdaftar"
}
```

### 2. POST /api/users/login (Login)

Login dan mendapatkan token autentikasi.

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response Sukses (200):**
```json
{
  "data": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Response Error (401):**
```json
{
  "error": "Email atau password salah"
}
```

### 3. GET /api/users/current (Get Current User)

Mendapatkan data user yang sedang login berdasarkan token.

**Request Headers:**
```
Authorization: Bearer <token>
```

**Response Sukses (200):**
```json
{
  "data": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**Response Error (401):**
```json
{
  "error": "Unauthorized"
}
```

### 4. DELETE /api/users/logout (Logout)

Menghapus session dan logout user.

**Request Headers:**
```
Authorization: Bearer <token>
```

**Response Sukses (200):**
```json
{
  "data": "OK"
}
```

**Response Error (401):**
```json
{
  "error": "Unauthorized"
}
```

## Setup Project

### 1. Install Dependencies

```bash
bun install
```

### 2. Setup Environment Variable

Buat file `.env` di root project:

```env
DATABASE_URL=mysql://user:password@localhost:3306/database_name
```

### 3. Setup Database

Pastikan MySQL sudah running dan buat database:

```sql
CREATE DATABASE database_name;
```

### 4. Generate Migration (Optional)

Jika menggunakan Drizzle Kit untuk generate schema:

```bash
bunx drizzle-kit generate
```

### 5. Push Schema ke Database (Optional)

```bash
bunx drizzle-kit push
```

## Cara Menjalankan Aplikasi

### Development Mode (dengan hot reload)

```bash
bun run dev
# atau
npm run dev
```

Server akan running di `http://localhost:3000`

### Production Mode

```bash
bun run src/index.ts
```

## Cara Menjalankan Unit Test

Pastikan server aplikasi running di background, lalu jalankan:

```bash
bun test
```

Test menggunakan [Bun Test](https://bun.sh/docs/runtime/test) dan mencakup 26 test cases untuk semua API endpoints.

### Menjalankan Test Tertentu

```bash
bun test test/register.test.ts
```

## Fitur

- [x] Registrasi user dengan password hashing (bcrypt)
- [x] Login dengan token-based authentication
- [x] Get current user profile
- [x] Logout (hapus session)
- [x] Validasi input (panjang karakter)
- [x] Unit test untuk semua API

## License

MIT
