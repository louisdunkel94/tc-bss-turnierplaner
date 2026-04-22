# PocketBase Setup

## 1. PocketBase auf dem Server installieren

```bash
ssh user@dein-server.de

# PocketBase herunterladen (aktuelle Version: https://pocketbase.io/docs)
mkdir -p /opt/pocketbase && cd /opt/pocketbase
wget https://github.com/pocketbase/pocketbase/releases/latest/download/pocketbase_linux_amd64.zip
unzip pocketbase_linux_amd64.zip
chmod +x pocketbase
```

## 2. Als Systemd-Service einrichten (läuft nach Neustart automatisch)

```bash
sudo nano /etc/systemd/system/pocketbase.service
```

Inhalt:

```ini
[Unit]
Description=PocketBase
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/opt/pocketbase
ExecStart=/opt/pocketbase/pocketbase serve --http="0.0.0.0:8090"
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable pocketbase
sudo systemctl start pocketbase
```

PocketBase läuft jetzt auf Port **8090**.  
Admin-Panel erreichbar unter: `http://dein-server.de:8090/_/`

## 3. Reverse Proxy (Nginx) einrichten

Damit `turniere.tennisclub-bss.de` direkt auf PocketBase zeigt (Port 443 / HTTPS):

```nginx
server {
    server_name turniere.tennisclub-bss.de;

    location / {
        proxy_pass         http://127.0.0.1:8090;
        proxy_set_header   Host $host;
        proxy_set_header   X-Real-IP $remote_addr;
        proxy_set_header   X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto $scheme;
    }

    # SSL wird von Certbot automatisch ergänzt
}
```

```bash
sudo certbot --nginx -d turniere.tennisclub-bss.de
```

## 4. Collections im Admin-Panel anlegen

Öffne `https://turniere.tennisclub-bss.de/_/` und lege folgende Collections an:

---

### Collection: `users` (Auth-Collection — Typ: Auth)

Zusätzliche Felder:

| Feldname | Typ | Optionen |
|---|---|---|
| `display_name` | Text | required |
| `gender` | Select | Werte: `herr`, `dame` |
| `role` | Select | Werte: `mitglied`, `veranstalter`, `admin` · Default: `mitglied` |

API-Regeln:
- **List/Search**: leer lassen (nur Admins via API-Key)
- **View**: `@request.auth.id != ""`
- **Create**: leer lassen (Registrierung erlaubt)
- **Update**: `id = @request.auth.id || @request.auth.role = "admin"`
- **Delete**: `@request.auth.role = "admin"`

---

### Collection: `tournaments` (Typ: Base)

| Feldname | Typ | Optionen |
|---|---|---|
| `name` | Text | required, max 100 |
| `created_by` | Relation → users | required |
| `game_mode` | Select | Werte: `geloste_paarungen`, `americano`, `round_robin`, `gruppenphase_ko`, `einfaches_ko`, `doppeltes_ko`, `schweizer_system` |
| `gender_requirement` | Select | Werte: `mixed`, `herren`, `damen`, `offen` · Default: `mixed` |
| `skill_requirement` | Text | optional |
| `start_at` | Date | optional |
| `duration_hours` | Number | Default: 3 |
| `max_participants` | Number | Default: 30 |
| `num_courts` | Number | Default: 6 |
| `num_rounds` | Number | Default: 5 |
| `status` | Select | Werte: `draft`, `open`, `running`, `closed` · Default: `draft` |
| `state` | JSON | optional |

API-Regeln:
- **List/Search**: `status = "open" || status = "running" || status = "closed" || created_by = @request.auth.id || @request.auth.role = "admin" || @request.auth.role = "veranstalter"`
- **View**: gleiche Regel
- **Create**: `@request.auth.role = "veranstalter" || @request.auth.role = "admin"`
- **Update**: `created_by = @request.auth.id || @request.auth.role = "admin"`
- **Delete**: `created_by = @request.auth.id || @request.auth.role = "admin"`

---

### Collection: `participants` (Typ: Base)

| Feldname | Typ | Optionen |
|---|---|---|
| `tournament` | Relation → tournaments | required, Cascade delete |
| `user` | Relation → users | optional (für manuell hinzugefügte Spieler) |
| `display_name` | Text | optional (wird für manuelle Spieler verwendet) |
| `gender` | Select | Werte: `herr`, `dame` |
| `checked_in` | Bool | Default: false |
| `checked_in_at` | Date | optional |

API-Regeln:
- **List/Search**: `@request.auth.id != ""`
- **View**: `@request.auth.id != ""`
- **Create**: `@request.auth.id != ""`
- **Update**: `user = @request.auth.id || @collection.tournaments.created_by = @request.auth.id || @request.auth.role = "admin"`
- **Delete**: `user = @request.auth.id || @collection.tournaments.created_by = @request.auth.id || @request.auth.role = "admin"`

---

## 5. Ersten Admin anlegen

1. Über `index.html` registrieren
2. Im PocketBase Admin-Panel → Collections → `users` → eigenen Eintrag öffnen → `role` auf `admin` setzen

---

## 6. URL in den App-Dateien eintragen

In diesen Dateien `YOUR_POCKETBASE_URL` ersetzen:

- `dashboard.js` (Zeile 2)
- `index.html`
- `tournament.html`
- `checkin.html`

Wert: `https://turniere.tennisclub-bss.de`

---

## 7. Statische Dateien ausliefern

Die HTML/JS/CSS-Dateien können entweder:

**a) Direkt von PocketBase** ausgeliefert werden (einfachste Option):
```bash
cp -r /pfad/zu/donatocup/* /opt/pocketbase/pb_public/
```
Dann sind alle Seiten unter `https://turniere.tennisclub-bss.de/` erreichbar.

**b) Separat via Nginx** (wenn du den gleichen Server nutzt):
```nginx
location / {
    root /var/www/turniere;
    try_files $uri $uri/ /index.html;
}
location /api/ {
    proxy_pass http://127.0.0.1:8090;
}
```
