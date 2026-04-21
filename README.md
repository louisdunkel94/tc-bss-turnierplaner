# TC Bad Soden-Salmünster – Turnierplaner

Web-App zur Verwaltung von Vereinsturnieren. Läuft vollständig im Browser, kein Build-Schritt nötig.

---

## Dateien

| Datei | Beschreibung |
|---|---|
| `index.html` | Login & Registrierung |
| `dashboard.html` | Rollenbasiertes Dashboard (Mitglied / Veranstalter / Admin) |
| `tournament.html` | Spielplan-App (Auslosung, Ergebnisse, Tabelle, Paarungsstatistik) |
| `logo.png` | Vereinslogo (transparent, wird von allen Seiten verwendet) |
| `SUPABASE_SETUP.sql` | Datenbankschema + RLS-Policies für Supabase |
| `supabase/functions/send-email/index.ts` | Edge Function zum Mailversand via Resend |

---

## Rollen

| Rolle | Rechte |
|---|---|
| **Mitglied** | Offene Turniere sehen und sich anmelden/abmelden |
| **Veranstalter** | Turniere erstellen, verwalten, Spielplan starten, Info-Mails senden |
| **Admin** | Alles vom Veranstalter + Mitgliederverwaltung (Rollen ändern) |

Neue Registrierungen erhalten automatisch die Rolle **Mitglied**.

---

## Turnier-Spielmodi

### Geloste Paarungen (Standard)
Jede Runde werden 3 Töpfe neu gemischt:
- **Topf 1** – alle Herren
- **Topf 2** – alle Damen
- **Topf 3** – alle Plätze (1–6)

Pro Ziehung: 1 Herr + 1 Dame = Mixed-Team. Je zwei Teams bilden ein Match auf einem zufällig gezogenen Platz. Maximal so viele Matches wie Plätze vorhanden. Übrige Paare erhalten ein Freilos.

### Ergebniseingabe
Jedes Match hat drei Schaltflächen: **◀ Team 1 gewinnt · = Unentschieden · Team 2 ▶**. Nochmaliges Klicken setzt das Ergebnis zurück.

### Wertung
| Ergebnis | Punkte |
|---|---|
| Sieg | 2 |
| Unentschieden | 1 |
| Niederlage | 0 |

---

## Einrichtung (einmalig)

### 1. Supabase-Projekt anlegen
1. Account unter [supabase.com](https://supabase.com) erstellen
2. Neues Projekt anlegen
3. Im **SQL-Editor** den Inhalt von `SUPABASE_SETUP.sql` ausführen
4. Unter *Settings → API*: `URL` und `anon key` kopieren

### 2. Credentials eintragen
In diesen drei Dateien `YOUR_SUPABASE_URL` und `YOUR_SUPABASE_ANON_KEY` ersetzen:
- `index.html`
- `dashboard.html`
- `tournament.html`

### 3. Ersten Admin anlegen
Nach erster Registrierung im Supabase **SQL-Editor**:
```sql
UPDATE profiles SET role = 'admin' WHERE email = 'deine@email.de';
```

### 4. E-Mail-Versand einrichten (Resend)
1. Account bei [resend.com](https://resend.com), eigene Domain verifizieren
2. API-Key erstellen
3. Supabase CLI installieren: `npm install -g supabase`
4. Edge Function deployen:
   ```bash
   supabase login
   supabase link --project-ref DEIN_PROJECT_REF
   supabase functions deploy send-email
   supabase secrets set RESEND_API_KEY=re_...
   ```
5. In `supabase/functions/send-email/index.ts` die `FROM_EMAIL`-Adresse anpassen

### 5. Logo
`logo.png` (Vereinslogo, transparenter Hintergrund) ins Projektverzeichnis legen – wird von allen Seiten automatisch eingebunden.

---

## Lokale Nutzung (ohne Supabase)

`tournament.html` funktioniert auch standalone ohne Backend – der Zustand wird in `localStorage` gespeichert. Login und Rollenverwaltung sind dann nicht verfügbar.

Einfach `tournament.html` im Browser öffnen.
