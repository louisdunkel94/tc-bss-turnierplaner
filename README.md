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

### Phase 5 – Gamification

Langfristige Motivation über einzelne Turniere hinaus: individuelle Karriereprofile, vereinsweites Ranking und soziale Features.

Abhängigkeit: Phase 1 (echte Benutzeraccounts) muss abgeschlossen sein, damit Spielerdaten persistent einem Account zugeordnet werden können. Die meisten Features der Gruppe A lassen sich bereits im Demo-Modus aus den vorhandenen `tc_tourneys`-Daten berechnen.

---

#### Gruppe A – Sofort umsetzbar (nur Datenauswertung, kein Backend nötig)

Diese Features erweitern die bestehende `stats.html` und brauchen keine neue Infrastruktur. Alle nötigen Daten liegen bereits in `tc_tourneys`.

**A1 – Karriere-Übersicht**

Eine Zusammenfassungs-Card ganz oben in `stats.html`, die auf einen Blick zeigt wer der Spieler ist:

| Kennzahl | Berechnung |
|---|---|
| Turniere gespielt | Anzahl Turniere mit min. 1 Eintrag in `schedule` |
| Turniertitel | Turniere wo Spieler auf Platz 1 der Abschlusstabelle steht |
| Beste Platzierung | Niedrigstes `rank` über alle abgeschlossenen Turniere |
| Erstes Turnier | Frühestes `start_at` Datum aus `tc_tourneys` |
| Letztes Turnier | Aktuellstes Datum |
| Gesamt-Spiele | Bereits in stats.html vorhanden |

Umsetzung: Erweiterung von `collectStats()` um Turnier-Ebene + neues `<div>` am Seitenanfang.

---

**A2 – Siegesserie (Streak)**

Zeigt die aktuelle und längste Siegesserie des gewählten Spielers.

Berechnung: Alle Matches des Spielers chronologisch sortieren (nach `t.start_at` und `round`-Index), dann von hinten durchlaufen und konsekutive Siege zählen.

```
Aktuelle Serie:  🔥 5 Siege in Folge
Längste Serie:   ⭐ 9 Siege (Juli 2025)
```

Anzeige als Highlight-Badge in `stats.html`. Falls aktuelle Serie ≥ 5: grüne Hervorhebung.

Randfall: Matchreihenfolge innerhalb eines Turniertags ist über `round`-Index bestimmbar. Turnier-übergreifend gilt das `start_at`-Datum des Turniers als Zeitstempel.

---

**A3 – Nemesis & Lieblingspartner**

Zwei Highlight-Cards in `stats.html` mit den markantesten Beziehungen:

| Card | Definition | Mindestspiele |
|---|---|---|
| **Nemesis** | Gegner mit der schlechtesten persönlichen Win-Rate | mind. 3 Begegnungen |
| **Angstgegner vermieden** | Gegner mit der besten Win-Rate | mind. 3 Begegnungen |
| **Lieblingspartner** | Partner (Mixed) mit den meisten gemeinsamen Siegen | mind. 3 Partien |
| **Bestes Duo** | Partner + eigene Win-Rate zusammen | mind. 3 Partien |

Werden bereits aus den `partners`- und `opponents`-Maps in `collectStats()` berechnet – nur noch als Card rendern.

---

**A4 – Formkurve**

Die letzten 10 gespielten Matches als visueller Mini-Graph direkt unter den Summary-Kacheln in `stats.html`.

```
◉ ◉ ○ ◉ ◉ ◉ ○ ○ ◉ ◉
W  W  L  W  W  W  L  L  W  W    → Trend: ↑
```

Umsetzung: SVG-Pfad oder einfache farbige Punkte (grün/rot/grau für Sieg/Niederlage/Unentschieden). Trend-Pfeil aus Vergleich der ersten vs. zweiten Hälfte der letzten 10 Spiele.

---

#### Gruppe B – Mittlerer Aufwand (braucht PocketBase)

**B1 – ELO-Rating**

Vereinsweites, kontinuierliches Spieler-Ranking über alle Turniere hinweg. Das ELO-System stammt aus dem Schach und ist ideal für paarweise Matches.

**Grundprinzip:**
- Jeder Spieler startet mit Rating **1000**
- Nach jedem Match: Sieger gewinnt Punkte, Verlierer verliert Punkte
- Gewinn hängt von der Ratingdifferenz ab: Sieg gegen stärkeren Gegner = mehr Punkte
- K-Faktor: `32` für < 30 Spiele, `16` für ≥ 30 Spiele (Stabilität für erfahrene Spieler)

**Formel:**
```
Erwarteter Sieg (E) = 1 / (1 + 10^((Rating_Gegner - Rating_Spieler) / 400))
Neues Rating = Altes Rating + K × (Ergebnis - E)
Ergebnis: Sieg = 1.0, Unentschieden = 0.5, Niederlage = 0.0
```

**Mixed-Modus:** Team-ELO = Durchschnitt beider Spieler-Ratings. Beide Teammitglieder gewinnen/verlieren gleichviel.

**Datenmodell:**
```
Collection: player_ratings
  user_id       Text (→ users)
  rating        Number (default 1000)
  games_played  Number
  updated_at    DateTime
```

**Berechnung:** PocketBase JS-Hook `onRecordAfterUpdateRequest` auf `tournaments`-Collection: wenn `status` auf `closed` wechselt → alle Matches der Endrunde durchlaufen und Ratings aktualisieren. Alternativ: einmalige Batch-Berechnung über alle historischen Matches beim ersten Start.

**UI:** Neue Seite `leaderboard.html` oder eigener Tab im Dashboard mit Rangliste (Name, Rating, Trend ↑↓, letzte 5 Spiele als Mini-Streak). Link aus Header-Leiste.

---

**B2 – Saisonrangliste**

Ergänzend zum ELO (das kontinuierlich ist): eine jährliche Wertung, bei der Turnier-Platzierungen Punkte bringen. Motiviert zur Teilnahme an möglichst vielen Turnieren.

**Punkteschema (konfigurierbar durch Admin):**

| Platzierung | Punkte |
|---|---|
| 1. Platz | 100 |
| 2. Platz | 70 |
| 3. Platz | 50 |
| 4. Platz | 35 |
| 5.–8. Platz | 20 |
| Teilnahme | 10 |

**Datenmodell:**
```
Collection: season_points
  user_id        Text
  tournament_id  Text
  season_year    Number (z.B. 2025)
  placement      Number
  points         Number

Collection: season_config
  year           Number
  points_1st     Number
  points_2nd     Number
  ... (ein Datensatz pro Saison, editierbar durch Admin)
```

**Berechnung:** Wenn ein Turnier auf `closed` gesetzt wird, liest ein PocketBase-Hook die Abschlusstabelle aus `t.state`, ermittelt die Platzierungen und schreibt Punkte in `season_points`.

**UI:** Tab „Saison 2025" auf `leaderboard.html` – sortierte Tabelle mit kumulierten Punkten, Anzahl Turniere, letzter Platzierung. Saison-Dropdown für Vorjahre.

---

**B3 – Achievements / Badges**

Freigeschaltete Abzeichen erscheinen auf der Profilseite des Spielers und als kleines Icon-Grid in `stats.html`.

**Definierte Achievements:**

| Badge | Icon | Bedingung |
|---|---|---|
| **Erster Schritt** | `sports_tennis` | Erstes Spiel gespielt |
| **Erster Sieg** | `emoji_events` | Erstes Match gewonnen |
| **Auf Kurs** | `local_fire_department` | 5 Siege in Folge |
| **Unaufhaltbar** | `whatshot` | 10 Siege in Folge |
| **Veteran** | `military_tech` | 50 Spiele gespielt |
| **Legende** | `workspace_premium` | 100 Spiele gespielt |
| **Teamplayer** | `diversity_3` | Mit 10 verschiedenen Partnern gespielt |
| **Vielreisender** | `calendar_month` | An 5 Turnieren teilgenommen |
| **Donatocup-Sieger** | `trophy` | Turnier gewonnen (1. Platz) |
| **Wiederholungstäter** | `repeat` | 3 Turniersiege |
| **Revanche** | `swords` | Gegen jemanden gewonnen, gegen den man zuvor verloren hatte |
| **Unbesiegbar** | `shield` | Ein Turnier ohne eine einzige Niederlage abgeschlossen |
| **Frühaufsteher** | `wb_sunny` | Am ersten Turnier des Vereins teilgenommen |

Alle Bedingungen lassen sich aus den bestehenden `tc_tourneys`-Daten + `player_ratings` berechnen, ohne eigene Collection. Einzige Ausnahme: persistente Speicherung des Unlock-Datums (wann wurde ein Badge erstmals freigeschaltet).

**Datenmodell (optional, für Unlock-Datum):**
```
Collection: user_badges
  user_id      Text
  badge_id     Text
  unlocked_at  DateTime
```

**UI:** Badge-Grid in `stats.html` unter den Tabellen. Gesperrte Badges ausgegraut mit Tooltip zur Bedingung. Neu freigeschaltete Badges erscheinen als Toast-Benachrichtigung nach dem Turnierende.

---

#### Gruppe C – Aufwändig (Echtzeit + Spieler-Interaktion)

**C1 – Herausforderungssystem**

Mitglieder können sich gegenseitig zu informellen Matches außerhalb von Turnieren herausfordern. Ergebnisse fließen in die ELO-Wertung ein.

**Ablauf:**
1. Spieler A öffnet Profil von Spieler B → „Herausfordern"-Button
2. Spieler B erhält Benachrichtigung (PocketBase Realtime oder E-Mail)
3. B akzeptiert / lehnt ab
4. Match wird gespielt, beide tragen das Ergebnis ein (Gegenseitige Bestätigung nötig)
5. ELO wird aktualisiert, Ergebnis erscheint in `stats.html`

**Datenmodell:**
```
Collection: challenges
  challenger_id    Text (→ users)
  challenged_id    Text (→ users)
  status           Text (pending / accepted / declined / played / disputed)
  proposed_date    DateTime
  result_winner    Text (→ users, nach dem Spiel)
  confirmed_by_a   Bool
  confirmed_by_b   Bool
  created_at       DateTime
```

**UI:** Neue Seite `challenges.html` mit offenen Herausforderungen (eingehend / ausgehend), Verlauf abgeschlossener Matches. Button auf Spielerprofilen / in `stats.html` für anderen Spieler.

**Technische Besonderheit:** Doppelte Bestätigung verhindert Manipulation. Wenn beide Seiten unterschiedliche Ergebnisse eintragen, wechselt Status auf `disputed` und ein Admin entscheidet.

---

**C2 – Anzeigetafel-Highlights**

`display.html` zeigt während eines laufenden Turniers automatisch generierte Fun-Facts und Live-Highlights als Laufband oder Wechselanzeige.

**Mögliche Highlights:**
```
🔥 Max Müller hat heute 4 Siege in Folge – Siegesserie läuft!
👑 Anna Schmidt & Felix Wagner: 3 gemeinsame Siege heute
📊 Spannstes Spiel: Tobias Klein vs. Jonas Becker – 3 Mal gegeneinander
🏆 Neuer Tabellenführer: Stefan Braun überholt Laura Fischer
```

**Berechnung:** Rein clientseitig aus dem aktuellen Tournament-State. Kein Backend nötig.
- Streak-Highlights: Spieler mit ≥ 3 Siegen in Folge in diesem Turnier
- Duo-Highlights: Partnerpaar mit 100% Gewinnquote und mind. 3 Partien
- Rivalitäts-Highlights: Paarung die heute zum 3. Mal gegeneinander spielt
- Tabellenwechsel: wird beim Laden erkannt und 30 Sekunden hervorgehoben

**UI:** Unterhalb der aktuellen Runde in `display.html` als dezentes Laufband oder als Wechsel-Card mit Fade-Animation.

---

**C3 – Wochenchallenge**

Vorstand oder Admin setzt wöchentliche Aufgaben für alle Mitglieder. Wer die Challenge schafft, bekommt einen temporären Badge und ggf. einen kleinen Saisonpunkt-Bonus.

**Beispiel-Challenges:**
- „Gewinne diese Woche 3 Spiele"
- „Spiele mit mindestens 4 verschiedenen Partnern"
- „Gewinne ein Match gegen einen Spieler mit höherem ELO"
- „Nimm an einem Turnier teil"

**Datenmodell:**
```
Collection: weekly_challenges
  title          Text
  description    Text
  criteria_type  Text (wins_count / partners_count / elo_upset / tournament_attendance)
  criteria_value Number (z.B. 3 für „3 Siege")
  week_start     DateTime
  week_end       DateTime
  bonus_points   Number (Saisonpunkte bei Erfolg)
  created_by     Text (→ users, nur vorstand/admin)
```

**Fortschritts-Tracking:** Wird clientseitig aus den Turnierdaten der laufenden Woche berechnet. Kein eigener Tracker nötig.

**UI:** Card im Dashboard (unter Turnieren) mit aktiver Challenge, Fortschrittsbalken und Ablaufdatum. Vorstand-Bereich: Formular zum Erstellen neuer Challenges.

---

### Abhängigkeitsgraph Gamification

```
stats.html (vorhanden)
  └── A1 Karriere-Übersicht       (nur JS, sofort)
  └── A2 Siegesserie              (nur JS, sofort)
  └── A3 Nemesis & Partner        (nur JS, sofort)
  └── A4 Formkurve                (nur JS, sofort)

PocketBase + echte Accounts (Phase 1)
  └── B1 ELO-Rating               → player_ratings Collection
  │     └── C1 Herausforderungen  → challenges Collection, Realtime
  └── B2 Saisonrangliste          → season_points + season_config
  │     └── C3 Wochenchallenge    → weekly_challenges Collection
  └── B3 Achievements / Badges   → user_badges Collection (optional)
        └── C2 Display-Highlights → clientseitig aus Tournament-State
```

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
| Gamification Gruppe A (stats.html Erweiterungen) | ⏳ Geplant (Phase 5A) |
| ELO-Rating + Saisonrangliste | ⏳ Geplant (Phase 5B, nach Phase 1) |
| Achievements / Herausforderungen / Highlights | ⏳ Geplant (Phase 5B–C, nach Phase 1) |

---

## Technische Dokumentation

Detaillierte technische Dokumentation (Architektur, Datenmodell, Algorithmen): [`DOCS.md`](DOCS.md)
