# TC Bad Soden-Salmünster – Turnierplaner

Web-App zur Verwaltung von Vereinsturnieren. Läuft vollständig im Browser, kein Build-Schritt nötig.

**Live:** `https://louisdunkel94.github.io/tc-bss-turnierplaner/`  
**Passwort:** `tcbss`

> **Beta** – Daten werden lokal im Browser gespeichert. Keine geräteübergreifende Synchronisation.

---

## Schnellstart

```
index.html → Passwort eingeben → Dashboard → Turnier erstellen → Spielplan starten
```

Alle Seiten funktionieren ohne Server – einfach `index.html` im Browser öffnen oder über GitHub Pages aufrufen.

---

## Dateien

| Datei | Beschreibung |
|---|---|
| `index.html` | Login-Seite (Passwortschutz) |
| `dashboard.html` / `dashboard.js` | Turnier-Übersicht, Verwaltung, Archiv |
| `tournament.html` | Spielplan, Auslosung, Ergebnisse, Tabelle |
| `checkin.html` | QR-Code Check-in-Seite |
| `anleitung.html` | Benutzeranleitung (Beta-Hinweise) |
| `impressum.html` / `datenschutz.html` | Rechtliche Seiten |
| `config.js` | Konfiguration (gitignored) |
| `logo.png` | Vereinslogo |

---

## Spielmodi

| Modus | Beschreibung |
|---|---|
| **Geloste Paarungen** | Mixed-Doppel, Paare werden jede Runde neu ausgelost (mit Wiederholungsminimierung). Unbegrenzte Runden, manuell beendet. |
| **Americano** | Wie Geloste Paarungen, Partner rotieren systematisch. |
| **Jeder gegen jeden** | Vollständiger Round-Robin-Plan, alle Matches im Voraus. |
| **Schweizer System** | Runde für Runde, Paarungen nach aktuellem Tabellenstand. |
| **Einfaches KO** | Klassisches Knockout-Bracket. |
| **Doppeltes KO** | Zweite Chance nach erster Niederlage (Winners/Losers Bracket). |
| **Gruppenphase + KO** | Automatische Gruppen → Jeder-gegen-jeden → KO aus Gruppenersten. |

---

## Datenspeicherung

Aktuell **Demo-Modus**: alle Daten im `localStorage` des Browsers.

| Key | Inhalt |
|---|---|
| `tc_tourneys` | Turniere inkl. gespeichertem Turnierstand (`state`) |
| `tc_regs` | Teilnehmer-Anmeldungen |
| `donatocup_v4` | Fallback-Spielstand (turnierseitig) |

⚠️ Daten gehen verloren wenn der Browser-Cache geleert wird. Backup-Funktion verwenden.

---

## Branch-Strategie

| Branch | Zweck |
|---|---|
| `main` | Produktiv – deployed via GitHub Pages |
| `dev` | Entwicklung & Tests – vor Merge in main prüfen |

---

## Backup & Export

Im Turnier unter **Tabelle**:
- **Excel** – Ergebnisse als `.xlsx` (Tabelle + Spielplan)
- **Backup** – Vollständiger Spielstand als `.json`
- **Wiederherstellen** – `.json`-Backup reimportieren

---

Detaillierte technische Dokumentation: [`DOCS.md`](DOCS.md)
