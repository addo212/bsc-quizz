/**
 * Menyalin `supabase/setup.sql` menjadi satu file migrasi Supabase CLI.
 *
 * Dengan begitu `supabase start` (mode lokal / Docker) langsung membuat
 * schema yang benar, tanpa harus copy-paste manual ke SQL Editor.
 *
 * Jalankan setiap kali `supabase/setup.sql` diubah:
 *   npm run db:sync
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const source = join(root, 'supabase', 'setup.sql')
const target = join(
  root,
  'supabase',
  'migrations',
  '20260101000000_bsc_quiz_setup.sql'
)

const header = `-- ============================================================================
--  FILE INI DI-GENERATE OTOMATIS — JANGAN DIEDIT LANGSUNG.
--
--  Sumber asli : supabase/setup.sql
--  Regenerate  : npm run db:sync
--
--  Dipakai oleh Supabase CLI saat menjalankan stack lokal:
--      npx supabase start     (butuh Docker Desktop)
--      npx supabase db reset
--
--  Untuk Supabase Cloud, copy-paste isi supabase/setup.sql ke SQL Editor.
-- ============================================================================

`

const sql = readFileSync(source, 'utf8')

mkdirSync(dirname(target), { recursive: true })
writeFileSync(target, header + sql, 'utf8')

console.log(`✔ Migrasi diperbarui: ${target.replace(root + '\\', '')}`)
