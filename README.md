# VZ-Karte (Supabase DB) – Vercel-ready

## Rollen (keine Registrierung)
- admin: erstellen/bearbeiten + **löschen**
- creator: erstellen/bearbeiten, **kein löschen**
- spectator: nur ansehen

## Neu
- **Mobile Beschilderung**: „temporär“ mit **Ablaufdatum** → wechselt automatisch zu `expired` (wird nicht gelöscht)
- **Default-Stadt**: Admin setzt Standard-Stadt (Name + Lat/Lng + Zoom) – Default: **Duisburg**

## Supabase Setup
1) Projekt erstellen  
2) SQL Editor → `supabase/schema.sql` ausführen  
3) Settings → API:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY` (Server only)

## Vercel Setup
Env Vars:
- JWT_SECRET
- ADMIN_USER/ADMIN_PASS
- CREATOR_USER/CREATOR_PASS
- SPECTATOR_USER/SPECTATOR_PASS
- SUPABASE_URL
- SUPABASE_SERVICE_ROLE_KEY
