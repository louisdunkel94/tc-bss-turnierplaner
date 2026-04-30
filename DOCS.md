# Technische Dokumentation – Turnierplaner

## Architektur

Reine Frontend-App ohne Build-Schritt. Alle Abhängigkeiten via CDN.

```
index.html          Login / Passwortschutz
dashboard.html      Turnier-Dashboard
dashboard.js        Gesamte Dashboard-Logik
tournament.html     Spielplan-App (HTML + JS in einer Datei)
config.js           Konfiguration (gitignored, nicht auf GitHub)
```

### Abhängigkeiten (CDN)
| Bibliothek | Zweck |
|---|---|
| Tailwind CSS | Styling |
| Material Symbols | Icons |
| Lexend / Plus Jakarta Sans | Schriften |
| PocketBase SDK | Datenbankanbindung (aktuell ungenutzt) |
| SheetJS (XLSX) | Excel-Import/-Export |

---

## Authentifizierung

Aktuell **Demo-Modus** (kein Backend):
- Passwort: `tcbss` (hardcoded in `index.html`)
- Auth-State: `sessionStorage.getItem('tc_auth') === '1'`
- Jede Seite prüft am Anfang: `if(sessionStorage.getItem('tc_auth') !== '1') redirect('index.html')`

Für echten Backend-Betrieb: `config.js` mit echter `POCKETBASE_URL` befüllen. Die App erkennt automatisch ob Demo- oder PocketBase-Modus aktiv ist.

---

## Datenspeicherung (Demo-Modus)

Alle Daten im `localStorage` des Browsers.

### Struktur `tc_tourneys` (Array)
```json
[
  {
    "id": "t_1234567890",
    "name": "Sommerturnier 2025",
    "date": "2025-07-15",
    "game_mode": "geloste_paarungen",
    "num_rounds": 5,
    "num_courts": 6,
    "max_participants": 24,
    "status": "running",
    "created_at": "2025-07-01T10:00:00Z",
    "state": { /* vollständiger S-Zustand aus tournament.html */ }
  }
]
```

### Struktur `tc_regs` (Array)
```json
[
  {
    "tournament_id": "t_1234567890",
    "user_id": "admin",
    "display_name": "Max Mustermann",
    "gender": "herr"
  }
]
```

### Turnier-State `S` (in `tc_tourneys[i].state`)
```json
{
  "mode": "geloste_paarungen",
  "step": "tournament",
  "view": "plan",
  "herren": ["Max", "Felix", "Tobias"],
  "damen": ["Anna", "Laura", "Sarah"],
  "numRounds": 5,
  "numCourts": 3,
  "currentRound": 2,
  "done": false,
  "schedule": [
    {
      "round": 1,
      "matches": [
        {
          "herr1": "Max", "dame1": "Anna",
          "herr2": "Felix", "dame2": "Laura",
          "result": "team1",
          "court": 1
        }
      ],
      "byePairs": []
    }
  ],
  "loserSchedule": [],
  "groups": [],
  "koPhase": null
}
```

---

## Spielmodi – Technische Details

### Geloste Paarungen (`geloste_paarungen`)
- Nur Runde 1 wird beim Start ausgelost
- Jede weitere Runde wird erst ausgelost wenn die vorherige vollständig abgeschlossen ist
- Algorithmus: Greedy-Zuweisung nach Paarungshistorie (jeder Mann bekommt bevorzugt die Frau, mit der er bisher am wenigsten gespielt hat; bei Gleichstand zufällig)
- Keine feste Rundenzahl – Turnier wird manuell beendet
- Relevante Funktionen: `drawGeloste()`, `nextGelosteRound()`, `finishTournament()`

### Americano (`americano`)
- Alle Runden werden beim Start ausgelost
- Gleicher Algorithmus wie Geloste Paarungen (Wiederholungsminimierung)
- Unterschied: feste Rundenzahl, alle Runden vorab generiert
- Relevante Funktionen: `drawAmericano()`

### Jeder gegen jeden (`round_robin`)
- Vollständiger Plan via Round-Robin-Rotation (Berger-System)
- Bei ungerader Spieleranzahl: Freilos rotiert
- Alle Runden vorab generiert
- Relevante Funktionen: `generateRoundRobin()`

### Schweizer System (`schweizer_system`)
- Eine Runde nach der anderen
- Paarungen nach aktuellem Punktestand (beste gegen beste, keine Wiederholungen)
- "Nächste Runde"-Button nach jeder fertigen Runde
- Relevante Funktionen: `generateSwissRound()`, `nextSwissRound()`

### Einfaches KO (`einfaches_ko`)
- Klassisches Bracket, Verlierer scheidet aus
- Automatisches Weiterkommen nach Ergebniseingabe
- Visuelle Bracket-Darstellung
- Relevante Funktionen: `generateKO()`, `advanceKO()`

### Doppeltes KO (`doppeltes_ko`)
- Winners Bracket + Losers Bracket
- Nach erster Niederlage: Wechsel in Losers Bracket
- Zweite Niederlage: Ausscheiden
- Relevante Funktionen: `generateDoubleKO()`, `advanceDoubleKO()`

### Gruppenphase + KO (`gruppenphase_ko`)
- Automatische Gruppenbildung (4er-Gruppen wenn möglich)
- Jeder-gegen-jeden innerhalb der Gruppe
- Nach Abschluss aller Gruppenspiele: automatische KO-Generierung aus Gruppenersten
- Relevante Funktionen: `generateGruppenphase()`, `generateKOFromGroups()`

---

## Dashboard-Logik (`dashboard.js`)

### Turnier-Status-Fluss
```
draft → open → running → closed
```

| Status | Bedeutung |
|---|---|
| `draft` | Entwurf, nicht sichtbar für Mitglieder |
| `open` | Anmeldungen möglich |
| `running` | Turnier läuft, Spielplan aktiv |
| `closed` | Beendet, im Archiv |

### Archiv
- `closed`-Turniere werden in `renderVeranstalter()` separiert
- Toggle `_showArchive` (globale Variable) steuert Sichtbarkeit
- Archivierte Turniere können read-only über „Ergebnisse"-Button geöffnet werden

---

## tournament.html – Render-Pipeline

```
render()
  └── updateChrome()          Header-Badge, Reset-Button, Nav-Tabs
  └── app.innerHTML =
        renderSpieler()       Spieler-Tab
      | renderPlan()
          ├── renderMixedPlan()     Geloste / Americano
          ├── renderSwissPlan()     Schweizer System
          ├── renderRRPlan()        Jeder gegen jeden
          ├── renderKOPlan()        Einfaches / Doppeltes KO
          └── renderGroupPlan()     Gruppenphase
      | renderTabelle()       Tabelle mit Export-Buttons
      └── renderPaarungen()   Paarungsstatistik
```

### Read-only Modus (`S.done === true`)
Wenn `S.done` gesetzt:
- Reset-Button ausgeblendet
- Header zeigt „Abgeschlossen"-Badge
- Ergebnis-Buttons in allen Match-Karten ausgeblendet
- Spieler-Eingabefelder ausgeblendet
- Start/Weiter-Button ausgeblendet

---

## Backup & Export

### Excel-Export (`exportTournament()`)
- Sheet „Tabelle": Endrangliste
- Sheet „Spielplan": Alle Runden mit Ergebnissen
- Sheet „Gruppen": Gruppenspiele (nur Gruppenphase-Modus)
- Dateiname: `<Turniername>_Ergebnisse.xlsx`

### JSON-Backup (`backupTournament()`)
Exportiert den vollständigen `S`-State als JSON:
```json
{
  "_backup": true,
  "_version": 1,
  "_title": "Sommerturnier",
  "state": { /* vollständiger S-State */ }
}
```

### Reimport (`importBackup()`)
- Liest `.json`-Datei, validiert `_backup`-Flag
- Überschreibt aktuellen `S`-State nach Bestätigung
- Speichert via `save()` in localStorage

---

## Deployment

GitHub Pages aus `main`-Branch.

```
main    → https://louisdunkel94.github.io/tc-bss-turnierplaner/
dev     → lokale Tests, kein automatisches Deployment
```

`config.js` ist in `.gitignore` – wird nie gepusht. Auf GitHub Pages greift der Fallback auf Demo-Modus.

---

## Offene Punkte

| Thema | Status |
|---|---|
| Geräteübergreifende Synchronisation | Offen – Firebase oder PocketBase auf Hetzner evaluiert |
| Americano-Wertung nach Punkten (statt Sieg/Niederlage) | Offen |
| Druckansicht Spielplan | Offen |
| Check-in via QR-Code vollständig einbinden | Teilweise implementiert (`checkin.html`) |
