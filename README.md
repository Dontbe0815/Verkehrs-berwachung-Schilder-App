# Verkehrszeichen-Karte Pro (v3)

iPhone-taugliche PWA zur Dokumentation von Beschilderung:
- Karte (OSM/Leaflet) + Marker-Cluster
- Standorte + Schilder + Fotos
- Zonen (Polygon/Rechteck zeichnen)
- Filter/Suche
- Zulagen-Rechner
- **Freigabeprozess**: Registrierung möglich, Nutzung erst nach Admin-Freigabe
- Supabase Auth + RLS

## 1) Supabase Setup

1. Supabase Projekt erstellen
2. SQL Editor: `supabase/schema.sql` komplett ausführen
3. **Admin bootstrap** (wichtig):
   - In SQL Editor:
     ```sql
     insert into public.admin_whitelist(email) values ('DEINADMIN@MAIL.DE');
     ```
4. Storage:
   - Bucket `sign-photos` anlegen (empfohlen: Public für Start)

## 2) Lokal starten

```bash
npm install
cp .env.example .env.local
# .env.local befüllen (URL + ANON KEY)
npm run dev
```

## 3) Freigabe-Workflow

- User registriert sich unter `/auth`
- User kann sich einloggen, ist aber **gesperrt** (approved=false)
- Admin (Email in `admin_whitelist`) besucht `/admin` und gibt Nutzer frei
- Erst danach funktionieren Reads/Writes auf Locations/Signs/Zones/Photos (RLS)

## 4) GitHub + Vercel (easy)

1. Repo erstellen, Code pushen
2. Vercel importieren
3. Env Vars in Vercel setzen:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - optional `NEXT_PUBLIC_APP_NAME`
   - optional `NEXT_PUBLIC_PHOTO_BUCKET`

Deploy.

## 5) Hinweise

- Offline: zuletzt geladene Daten werden in LocalStorage gespiegelt und bei fehlender Verbindung angezeigt.
- OSM Tiles offline sind begrenzt (3rd party, CORS/Caching).
