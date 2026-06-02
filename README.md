<div align="center">

<img src="https://raw.githubusercontent.com/rakalivestrong/mangazen/main/public/logo.png" width="80" alt="MangaZen Logo" />

# MangaZen

**Platform baca manga modern dengan AI — dibuat oleh [@rakalivestrong](https://github.com/rakalivestrong)**

[![Vercel](https://img.shields.io/badge/deployed%20on-Vercel-black?logo=vercel&logoColor=white)](https://mangazen.vercel.app)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![TailwindCSS](https://img.shields.io/badge/Tailwind-v4-38BDF8?logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![Supabase](https://img.shields.io/badge/Supabase-Database-3ECF8E?logo=supabase&logoColor=white)](https://supabase.com)
[![Gemini AI](https://img.shields.io/badge/Gemini-AI-4285F4?logo=google&logoColor=white)](https://ai.google.dev)

> 🚧 **Solo dev project** — masih dalam pengembangan aktif. Update dilakukan sesering mungkin!

</div>

---

## ✨ Fitur Utama

| Fitur | Keterangan |
|---|---|
| 📖 **Baca Manga** | Langsung dari MangaDex dengan image fallback otomatis |
| 🤖 **AI Vibe Check** | Gemini AI menganalisis vibe & mood setiap manga |
| 🌐 **AI Translate** | Terjemahkan sinopsis ke Bahasa Indonesia, Inggris, atau Pinyin |
| 📚 **Library Pribadi** | Tandai status baca: Reading / Completed / Want to Read |
| ⭐ **Rating & Tags** | Beri rating dan buat tag personal untuk setiap manga |
| 👤 **Profil Publik** | Lihat koleksi dan aktivitas sesama pengguna |
| 💬 **Komentar** | Diskusi per chapter dengan sesama pembaca |
| 🔍 **Filter Canggih** | Filter berdasarkan origin (Manga/Manhwa/Manhua), genre, dan waktu |
| 🖼️ **Hero Section** | Auto-rotate hero banner dengan info manga trending |

---

## 🛠️ Tech Stack

```
Frontend   →  React 19 + TypeScript + Vite 6
Styling    →  Tailwind CSS v4 + Motion (Framer Motion)
Backend    →  Express.js (API proxy)
Database   →  Supabase (PostgreSQL)
AI         →  Google Gemini AI (@google/genai)
Source     →  MangaDex API + Jikan (MyAnimeList)
Deploy     →  Vercel
```

---

## 🚀 Cara Menjalankan di Localhost

### Prasyarat

Pastikan sudah terinstall di komputer kamu:

- [Node.js](https://nodejs.org) versi **18 ke atas**
- [Git](https://git-scm.com)
- Akun [Supabase](https://supabase.com) (gratis)
- API Key dari [Google AI Studio](https://aistudio.google.com) (gratis)

---

### Langkah 1 — Clone Repository

```bash
git clone https://github.com/rakalivestrong/mangazen.git
cd mangazen
```

### Langkah 2 — Install Dependencies

```bash
npm install
```

### Langkah 3 — Buat File `.env`

Buat file `.env` di root folder proyek (satu level dengan `package.json`):

```bash
# Salin dari template
cp .env.example .env
```

Kemudian isi nilainya:

```env
# Gemini AI — dapatkan di: https://aistudio.google.com/app/apikey
GEMINI_API_KEY="isi_api_key_gemini_kamu"

# Supabase — dapatkan di: https://app.supabase.com → Project Settings → API
VITE_SUPABASE_URL="https://xxxxxxxxxxxx.supabase.co"
VITE_SUPABASE_ANON_KEY="isi_anon_key_supabase_kamu"
```

### Langkah 4 — Setup Database Supabase

Di Supabase, buka **SQL Editor** dan jalankan query berikut untuk membuat tabel yang dibutuhkan:

```sql
-- Tabel user profiles
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  username text unique not null,
  email text,
  bio text,
  avatar_photo text,
  created_at timestamp with time zone default now()
);

-- Tabel library (status baca)
create table public.user_manga_tags (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade,
  manga_id text not null,
  status text,
  rating integer,
  tags text[] default '{}',
  updated_at timestamp with time zone default now(),
  unique(user_id, manga_id)
);

-- Tabel komentar
create table public.comments (
  id uuid default gen_random_uuid() primary key,
  chapter_id text not null,
  user_id uuid references public.profiles(id) on delete cascade,
  content text not null,
  created_at timestamp with time zone default now()
);
```

### Langkah 5 — Jalankan Development Server

```bash
npm run dev
```

Buka browser dan akses: **[http://localhost:3000](http://localhost:3000)**

---

## 📁 Struktur Proyek

```
mangazen/
├── api/                  # Serverless functions (Vercel)
├── public/               # Aset publik (logo, dll)
├── src/
│   ├── components/       # Komponen UI yang reusable
│   │   ├── Avatar.tsx
│   │   ├── CommentSection.tsx
│   │   ├── MangaCard.tsx
│   │   ├── Navbar.tsx
│   │   └── UserPanel.tsx
│   ├── context/          # React Context (Auth)
│   ├── lib/              # Utility & service layer
│   │   ├── api.ts        # MangaDex & Jikan API
│   │   ├── gemini.ts     # Google Gemini AI
│   │   ├── storage.ts    # Local reading history
│   │   └── tags.ts       # Supabase tag & library
│   ├── pages/            # Halaman utama
│   │   ├── Home.tsx
│   │   ├── MangaDetail.tsx
│   │   ├── ReaderPage.tsx
│   │   ├── ProfilePage.tsx
│   │   └── AuthPage.tsx
│   └── index.css         # Global styles + Tailwind
├── server.ts             # Express dev server
├── vite.config.ts
└── vercel.json           # Konfigurasi deploy
```

---

## 🌐 Demo Live

Aplikasi sudah live di Vercel:

**[→ mangazen.vercel.app](https://mangazen.vercel.app)**
