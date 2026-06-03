# TC Bad Soden-Salmünster – Turnierplaner

Web-App zur Verwaltung von Vereinsturnieren. Läuft vollständig im Browser, kein Server oder Installation nötig.

**Live:** `https://louisdunkel94.github.io/tc-bss-turnierplaner/`  
**Passwort:** `tcbss`

> **Hinweis:** Daten werden lokal im Browser gespeichert. Regelmäßige Backups empfohlen.

---

## Inhalt

1. [Schnellstart](#schnellstart)
2. [Nutzungsanleitung](#nutzungsanleitung)
   - [Login](#login)
   - [Dashboard](#dashboard)
   - [Turnier erstellen](#turnier-erstellen)
   - [Spieler erfassen](#spieler-erfassen)
   - [Turnier starten](#turnier-starten)
   - [Ergebnisse eintragen](#ergebnisse-eintragen)
   - [Nächste Runde](#nächste-runde)
   - [Tabelle & Auswertung](#tabelle--auswertung)
   - [Spielstände (optional)](#spielstände-optional)
   - [Öffentliche Anzeigetafel](#öffentliche-anzeigetafel)
   - [KO-Bracket](#ko-bracket)
   - [Backup & Export](#backup--export)
3. [Spielmodi](#spielmodi)
4. [Dateien](#dateien)
5. [Datenspeicherung](#datenspeicherung)
6. [Technische Dokumentation](#technische-dokumentation)

---

## Spielerstatistiken

Die Seite `stats.html` zeigt spielerbezogene Auswertungen über alle Turniere hinweg.

**Aufruf:** Dashboard → **Statistiken**-Button (oben rechts)

**Funktionen:**
- Spieler aus Dropdown wählen (alle die je in einem Turnier eingetragen wurden)
- Zeitfilter: Jahr und/oder Monat
- **Zusammenfassung:** Spiele gesamt, Siege, Niederlagen, Gewinnquote
- **Partnertabelle** (nur Mixed-Turniere): mit wem wie oft gespielt, gemeinsame Bilanz, Gewinnrate als Balken
- **Gegnertabelle:** Head-to-Head-Bilanz gegen jeden Gegner, sortiert nach Häufigkeit

Im **PocketBase-Modus** wird der eingeloggte Benutzer automatisch vorausgewählt.

---

## Schnellstart

```
index.html öffnen → Passwort eingeben → Dashboard → Turnier erstellen → loslegen
```

---

## Nutzungsanleitung

### Login

Die Seite `index.html` fragt nach dem Vereinspasswort. Nach erfolgreichem Login wird der Zugang für die aktuelle Browser-Sitzung gespeichert (kein erneutes Einloggen bei Seitenwechsel).

- Passwort: **tcbss**
- Beim Schließen des Browsers muss erneut eingeloggt werden

---

### Dashboard

Das Dashboard (`dashboard.html`) zeigt alle Turniere in einer Übersicht.

**Status-Symbole:**
| Status | Bedeutung |
|---|---|
| Entwurf | Turnier vorbereitet, noch nicht gestartet |
| Offen | Anmeldungen möglich (Check-in aktiv) |
| Läuft | Turnier aktiv, Spielplan wird geführt |
| Abgeschlossen | Archiviert, nur noch lesbar |

**Aktionen im Dashboard:**
- **Neu erstellen** – Turnier anlegen (Formular am Anfang der Seite)
- **Öffnen** – Spielplan für ein Turnier starten/fortführen
- **Archiv** – abgeschlossene Turniere ausblenden/einblenden

---

### Turnier erstellen

Im Dashboard das Formular oben ausfüllen:

| Feld | Beschreibung |
|---|---|
| **Name** | Turnierbezeichnung (z.B. „Sommerturnier 2025") |
| **Datum** | Turnierdatum |
| **Spielmodus** | Auswahl des gewünschten Modus (siehe [Spielmodi](#spielmodi)) |
| **Runden** | Anzahl der Runden (wo zutreffend) |
| **Plätze** | Anzahl verfügbarer Tennisplätze |
| **Max. Teilnehmer** | Maximale Teilnehmerzahl |

Nach dem Erstellen erscheint das Turnier im Dashboard und kann mit **Öffnen** gestartet werden.

---

### Spieler erfassen

Im Reiter **Spieler** werden die Teilnehmer eingetragen.

**Mixed-Modi (Balanced Draw, Americano):**
- Herren und Damen werden getrennt eingetragen
- Mindestanzahl: je nach Modus 4 Herren + 4 Damen
- Spieler können per Klick auf „×" wieder entfernt werden
- **Pause-Funktion:** Spieler können für einzelne Runden pausiert werden (Spieler-Chip → Uhr-Symbol)

**Einzel-Modi (Jeder gegen jeden, Schweizer System, KO):**
- Alle Spieler in einer gemeinsamen Liste

**Tipp:** Spielernamen werden automatisch für spätere Auswertungen gespeichert.

---

### Turnier starten

Nach der Spieler-Erfassung erscheint der **„Starten"**-Button (oder „Auslosung"). 

- Beim ersten Klick wird der Spielplan generiert
- Bei manchen Modi (Schweizer System, Balanced Draw) wird nur die erste Runde ausgelost
- Bei anderen Modi (Americano, Jeder gegen jeden) werden alle Runden vorab generiert

**Optionale Einstellung vor dem Start:**
- **„Spielstände eintragen"** – aktiviert die Score-Eingabe (z.B. 6:3) statt nur Sieg/Niederlage

---

### Ergebnisse eintragen

Im Reiter **Plan** wird der aktuelle Spielplan angezeigt.

**Standard (Sieg/Unentschieden/Niederlage):**
- Jede Match-Karte zeigt die Spieler und den Platz
- Buttons **1** / **½** / **2** → Ergebnis eintragen
- Bei Mixed: **Team 1** / **Unentschieden** / **Team 2**

**Mit Spielständen (wenn aktiviert):**
- Zwei Felder für den genauen Spielstand (z.B. 6 : 3)
- Ergebnis wird automatisch abgeleitet (höhere Zahl = Sieger)
- Unentschieden möglich (gleiche Zahl)

**Ergebnis korrigieren:** Einfach einen anderen Button drücken oder Zahlen überschreiben – der letzte Eintrag gilt.

---

### Nächste Runde

Je nach Modus:

| Modus | Weiter zur nächsten Runde |
|---|---|
| Balanced Draw | Automatisch nach letztem Ergebnis der Runde + Button „Nächste Runde" |
| Americano | Automatisch nach allen Ergebnissen |
| Jeder gegen jeden | Alle Runden werden vorab angezeigt |
| Schweizer System | Button „Nächste Runde" nach vollständiger Runde |
| KO-Modi | Automatisches Weiterkommen nach Ergebnis-Eintrag |

**Turnier beenden:** Button **„Turnier abschließen"** erscheint wenn alle Spiele abgeschlossen sind. Danach ist der Plan read-only und die Endauswertung wird gesperrt.

---

### Tabelle & Auswertung

Im Reiter **Tabelle** wird die aktuelle Rangliste angezeigt.

**Spalten:**
- **Pl.** – Aktueller Tabellenplatz
- **Spieler** – Name
- **Sp** – Gespielte Partien
- **S / U / N** – Siege / Unentschieden / Niederlagen
- **Pkt** – Punkte (3 pro Sieg, 1 pro Unentschieden)
- **G** – Games-Bilanz (nur wenn „Spielstände eintragen" aktiv)

**Sortierung:**
1. Punkte
2. Siege
3. Games-Differenz (nur wenn Spielstände aktiviert)
4. Niederlagen

Im Reiter **Paarungen** werden alle bisherigen Gegner- und Partnerkombinationen angezeigt (nützlich für Balanced Draw zur Kontrolle der Wiederholungen).

---

### Spielstände (optional)

Diese Funktion erlaubt die Eingabe exakter Spielergebnisse statt nur Sieg/Niederlage.

**Aktivieren:**
1. Im Reiter **Spieler** (vor dem Turnierstart) den Toggle **„Spielstände eintragen"** aktivieren
2. Daran ist kein späteres Deaktivieren möglich ohne Reset

**Nutzung:**
- In jeder Match-Karte erscheinen zwei Zahlenfelder
- Eintrag: z.B. `6` und `3` → Team 1 gewinnt 6:3
- Bei Gleichstand (z.B. 4:4) → Unentschieden
- Die Tabelle zeigt zusätzlich die Games-Bilanz (`12:8 G`)
- Excel-Export enthält Spalten für Score 1 und Score 2

---

### Öffentliche Anzeigetafel

Die Seite `display.html` zeigt den aktuellen Turnierstand ohne Login – ideal für einen Beamer oder Bildschirm im Vereinsheim.

**URL-Format:**
```
display.html?t=<Turnier-ID>
```

Die Turnier-ID ist die interne ID aus dem localStorage. Im Browser-Tab des Turnierplaners kann die ID aus der URL abgelesen werden oder in der Adresszeile des Dashboards.

**Funktionen der Anzeigetafel:**
- Aktuelle Runde mit allen Matches (groß, gut lesbar)
- Aktuelle Tabelle (Top 15)
- Automatische Aktualisierung alle 30 Sekunden
- Vollbild-Modus (Schaltfläche oben rechts)
- Zeigt Zeitstempel der letzten Aktualisierung

**Wichtig:** Im Demo-Modus (ohne Backend) funktioniert die Anzeigetafel nur auf **demselben Gerät und Browser** wie der Turnierleiter, da beide auf denselben localStorage zugreifen.

---

### KO-Bracket

Bei **Einfachem KO**, **Doppeltem KO** und **Gruppenphase + KO** wird im Reiter **Plan** ein visuelles Bracket-Diagramm angezeigt.

- Matches als Karten mit Verbindungslinien
- Rundenbezeichnungen: Viertelfinale / Halbfinale / Finale
- Ergebnisse direkt in der Bracket-Ansicht eintragbar
- Horizontales Scrollen bei vielen Runden
- Gewinner/Verlierer werden automatisch in die nächste Runde gesetzt

Bei **Doppeltem KO:** Winners Bracket (oben) und Losers Bracket (unten) werden separat angezeigt.

---

### Backup & Export

Im Reiter **Tabelle** stehen drei Buttons bereit:

| Button | Funktion |
|---|---|
| **Excel** | Exportiert Tabelle + Spielplan als `.xlsx`-Datei |
| **Backup** | Exportiert den vollständigen Spielstand als `.json`-Datei |
| **Wiederherstellen** | Lädt ein `.json`-Backup und stellt den Spielstand wieder her |

**Empfehlung:** Nach jedem Turniertag ein Backup erstellen. Die Daten im Browser können bei Cache-Löschung verloren gehen.

**Excel-Inhalt:**
- Sheet „Tabelle": Endrangliste mit Punkten (und Games wenn aktiviert)
- Sheet „Spielplan": Alle Runden mit Ergebnissen (und Scores wenn aktiviert)
- Sheet „Gruppen": Gruppenspiele (nur Gruppenphase-Modus)

---

## Spielmodi

| Modus | Typ | Beschreibung |
|---|---|---|
| **Balanced Draw** | Mixed-Doppel | Paare werden jede Runde neu ausgelost. Algorithmus minimiert Wiederholungen bei Partner und Gegner. Runden werden manuell beendet. |
| **Americano** | Mixed-Doppel | Wie Balanced Draw, aber alle Runden werden vorab ausgelost. |
| **Jeder gegen jeden** | Einzel/Doppel | Vollständiger Round-Robin-Plan, alle Matches vorab generiert (Berger-System). |
| **Schweizer System** | Einzel/Doppel | Runde für Runde, Paarungen nach aktuellem Tabellenstand. Keine Wiederholungen. |
| **Einfaches KO** | Einzel/Doppel | Klassisches Knockout-Bracket. Verlierer scheidet aus. |
| **Doppeltes KO** | Einzel/Doppel | Zweite Chance nach erster Niederlage (Winners + Losers Bracket). |
| **Gruppenphase + KO** | Einzel/Doppel | Automatische Gruppenbildung → Jeder-gegen-jeden → KO aus Gruppenersten. |

---

## Dateien

| Datei | Beschreibung |
|---|---|
| `index.html` | Login-Seite |
| `dashboard.html` / `dashboard.js` | Turnier-Übersicht und Verwaltung |
| `tournament.html` | Spielplan, Auslosung, Ergebnisse, Tabelle |
| `display.html` | Öffentliche Anzeigetafel (ohne Login) |
| `stats.html` | Spielerstatistiken (Partner- und Gegnerauswertung) |
| `checkin.html` | QR-Code Check-in für Teilnehmer |
| `anleitung.html` | In-App Kurzanleitung |
| `config.js` | Konfiguration (lokal, nicht im Repository) |
| `logo.png` | Vereinslogo |
| `impressum.html` / `datenschutz.html` | Rechtliche Seiten |

---

## Datenspeicherung

**Demo-Modus** (Standard): alle Daten im `localStorage` des Browsers.

| localStorage-Key | Inhalt |
|---|---|
| `tc_tourneys` | Alle Turniere inkl. vollständigem Spielstand |
| `tc_regs` | Teilnehmer-Anmeldungen |

⚠️ Daten gehen verloren wenn der Browser-Cache geleert wird. **Backup-Funktion regelmäßig verwenden.**

---

## Branch-Strategie

| Branch | Zweck |
|---|---|
| `main` | Produktiv – deployed via GitHub Pages |
| `dev` | Entwicklung & Tests |

---

## Roadmap

Die App läuft aktuell im **Demo-Modus** (alle Daten nur lokal im Browser). Die nachfolgende Roadmap beschreibt die geplante Weiterentwicklung zum vollwertigen Vereinssystem mit Backend, Benutzerverwaltung, Platzbuchung und Zahlungsabwicklung.

Issues werden auf GitHub unter [louisdunkel94/tc-bss-turnierplaner](https://github.com/louisdunkel94/tc-bss-turnierplaner/issues) verfolgt.

---

### Phase 0 – Server-Setup (manuell, einmalig)

Voraussetzung für alle weiteren Phasen. Muss vom Administrator direkt auf dem Hetzner-Server ausgeführt werden.

| # | Aufgabe | Beschreibung |
|---|---|---|
| [#7](https://github.com/louisdunkel94/tc-bss-turnierplaner/issues/7) | PocketBase installieren | Binary herunterladen, systemd-Service unter `/opt/pocketbase/` einrichten (Port 8090) |
| [#8](https://github.com/louisdunkel94/tc-bss-turnierplaner/issues/8) | Nginx + SSL | Reverse-Proxy auf `turniere.tennisclub-bss.de`, Let's Encrypt HTTPS |
| [#9](https://github.com/louisdunkel94/tc-bss-turnierplaner/issues/9) | Collections anlegen | `users`, `tournaments`, `participants` mit API-Regeln laut POCKETBASE_SETUP.md |
| [#10](https://github.com/louisdunkel94/tc-bss-turnierplaner/issues/10) | config.js befüllen | `POCKETBASE_URL: 'https://turniere.tennisclub-bss.de'` – schaltet Demo-Modus ab |

---

### Phase 1 – Echtes Benutzer-Management

Aktuell ist das Login nur ein einfaches Vereinspasswort (`tcbss`). Ziel: individuelle Accounts mit Rollen.

| # | Aufgabe | Beschreibung |
|---|---|---|
| [#11](https://github.com/louisdunkel94/tc-bss-turnierplaner/issues/11) | Login & Registrierung | `index.html`: E-Mail/Passwort-Formular statt Passwort-Only. Selbst-Registrierung für Mitglieder (landen als Rolle `mitglied`) |
| [#12](https://github.com/louisdunkel94/tc-bss-turnierplaner/issues/12) | Dashboard Auth + Routing | `dashboard.js`: echtes `boot()` via PocketBase Auth, `render()` leitet je nach Rolle (`mitglied` / `veranstalter` / `vorstand` / `admin`) weiter, `dbMembers()` ergänzen |
| [#13](https://github.com/louisdunkel94/tc-bss-turnierplaner/issues/13) | tournament.html Auth-Check | Redirect auf `index.html` wenn nicht eingeloggt |
| [#24](https://github.com/louisdunkel94/tc-bss-turnierplaner/issues/24) | Rolle „Vorstand" | Neue Rolle zwischen `veranstalter` und `admin`: Turniere leiten + Buchungsregeln konfigurieren |

**Rollenhierarchie nach Abschluss:**

| Rolle | Turniere | Platzbuchung | Buchungsregeln konfigurieren | Mitglieder verwalten |
|---|---|---|---|---|
| `mitglied` | sehen / anmelden | buchen | — | — |
| `veranstalter` | erstellen / leiten | buchen | — | — |
| `vorstand` | erstellen / leiten | buchen | ✓ | — |
| `admin` | alles | alles | ✓ | ✓ Rollen vergeben |

---

### Phase 2 – E-Mail & Selbstverwaltung

| # | Aufgabe | Beschreibung |
|---|---|---|
| [#14](https://github.com/louisdunkel94/tc-bss-turnierplaner/issues/14) | SMTP konfigurieren | PocketBase Admin-Panel: SMTP-Zugangsdaten des Vereins eintragen |
| [#15](https://github.com/louisdunkel94/tc-bss-turnierplaner/issues/15) | E-Mail-Hook | PocketBase JS-Hook `routerAdd('/api/send-email')`: sendet Info-Mails an alle Turnierteilnehmer |
| [#16](https://github.com/louisdunkel94/tc-bss-turnierplaner/issues/16) | Passwort vergessen | Link auf `index.html` → PocketBase Reset-Flow (`requestPasswordReset`), Nutzer bekommt E-Mail |
| [#17](https://github.com/louisdunkel94/tc-bss-turnierplaner/issues/17) | Profil-Einstellungen | Modal im Dashboard: Name, E-Mail und Passwort selbst ändern (`pb.collection('users').update()`) |

---

### Phase 3 – Platzbuchungssystem

Unabhängig von Turnieren. Mitglieder buchen 60-Minuten-Slots, Gäste können mitgebracht werden.

| # | Aufgabe | Beschreibung |
|---|---|---|
| [#18](https://github.com/louisdunkel94/tc-bss-turnierplaner/issues/18) | `bookings` Collection | PocketBase Collection mit Feldern: `court`, `start_time`, `end_time`, `booked_by`, `guest_name`, `guest_fee_paid` |
| [#19](https://github.com/louisdunkel94/tc-bss-turnierplaner/issues/19) | bookings.html | Wochenraster-Ansicht (Mo–So, Stunden-Slots), Buchungsformular, Stornierung eigener Buchungen |
| [#20](https://github.com/louisdunkel94/tc-bss-turnierplaner/issues/20) | Dashboard-Link | „Platzbuchung"-Button im Dashboard für alle eingeloggten Benutzer |
| [#25](https://github.com/louisdunkel94/tc-bss-turnierplaner/issues/25) | `booking_config` Collection | Einzeldatensatz mit Buchungsregeln: Öffnungszeiten, Gastgebühr, max. Buchungen/Woche, Vorausbuchungsfenster |
| [#26](https://github.com/louisdunkel94/tc-bss-turnierplaner/issues/26) | Einstellungen für Vorstand | Zahnrad-Modal in `bookings.html` (nur für `vorstand` / `admin`): Öffnungszeiten, Gastgebühr, Wochenlimit, Buchungsfenster konfigurieren |

**Buchungsregeln (konfigurierbar durch Vorstand):**
- Öffnungszeiten: z.B. 08:00–22:00 Uhr
- Gastgebühr: fixer Betrag pro Gast-Buchung
- Max. Buchungen pro Woche pro Mitglied: z.B. 3
- Vorausbuchungsfenster: z.B. max. 7 Tage im Voraus

---

### Phase 4 – Zahlungsabwicklung

Zuerst Barzahlung-Tracking, dann optional Online-Zahlung via Stripe.

| # | Aufgabe | Beschreibung |
|---|---|---|
| [#21](https://github.com/louisdunkel94/tc-bss-turnierplaner/issues/21) | Datenmodell Zahlungen | `guest_fee` und `fee_paid` Felder in `bookings` und `participants`; `entry_fee` in `tournaments` |
| [#22](https://github.com/louisdunkel94/tc-bss-turnierplaner/issues/22) | Zahlungsübersicht Admin | Tabellenansicht im Admin-Bereich: wer hat bezahlt, wer nicht, manuelle Quittierung |
| [#23](https://github.com/louisdunkel94/tc-bss-turnierplaner/issues/23) | Stripe Online-Zahlung | PocketBase-Hook erstellt Stripe Checkout Session; Webhook setzt `fee_paid = true` nach erfolgreichem Payment |

---

### Bereits umgesetzt

| Feature | Status |
|---|---|
| Turnierverwaltung (alle 7 Spielmodi) | ✅ Fertig |
| Öffentliche Anzeigetafel (`display.html`) | ✅ Fertig |
| Spielstände (6:3 statt nur Sieg/Niederlage) | ✅ Fertig |
| KO-Bracket Visualisierung | ✅ Fertig |
| Balanced Draw (Wiederholungsminimierung) | ✅ Fertig |
| Pause-Funktion für einzelne Spieler | ✅ Fertig |
| QR-Code Check-in (`checkin.html`) | ✅ Fertig |
| Excel- und JSON-Export / Backup | ✅ Fertig |
| Spielerstatistiken (`stats.html`) | ✅ Fertig |
| PocketBase Dual-Mode-Architektur | ✅ Vorbereitet (URL fehlt) |
| E-Mail-Versand (Info-Mail an Teilnehmer) | ⏳ Hook fehlt (Issue #15) |
| Echtes User-Management | ⏳ Server fehlt (Issues #7–#13) |
| Platzbuchungssystem | ⏳ Geplant (Issues #18–#20, #25–#26) |
| Online-Zahlung (Stripe) | ⏳ Geplant (Issues #21–#23) |

---

## Technische Dokumentation

Detaillierte technische Dokumentation (Architektur, Datenmodell, Algorithmen): [`DOCS.md`](DOCS.md)
