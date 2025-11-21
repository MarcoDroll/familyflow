# FamPlan - Familienaufgabenplaner

Eine selbst gehostete Webanwendung zum Verwalten von Aufgaben für Kinder mit Kanban-Board und Wiederholungsfunktion.

## Features

- 🎯 **Kanban Board** mit drei Spalten: "Zu erledigen", "Mach ich gerade", "Erledigt"
- 👨‍👩‍👧‍👦 **Mehrere Kinder** - Jedes Kind hat sein eigenes Board
- 🔄 **Automatische Wiederholungen** - Aufgaben können täglich, wöchentlich, monatlich oder an einem bestimmten Datum zurückgesetzt werden
- 👥 **Eltern-Dashboard** - Zentrale Verwaltung aller Kinder und Aufgaben
- 🐳 **Docker-ready** - Einfache Bereitstellung mit Docker Compose
- 🇩🇪 **Deutsche Benutzeroberfläche**

## Technologie-Stack

- **Frontend**: Angular 17 mit TypeScript
- **Backend**: Node.js mit Express und TypeScript
- **Datenbank**: PostgreSQL
- **Reverse Proxy**: Nginx
- **Containerisierung**: Docker & Docker Compose

## Voraussetzungen

### Für Entwicklung
- Node.js 20+
- PostgreSQL 16+
- npm

### Für Docker-Deployment
- Docker
- Docker Compose

## Installation & Start

### Entwicklungsmodus (mit npm start)

1. **Projekt klonen und Abhängigkeiten installieren:**
   ```bash
   npm run install:all
   ```

2. **PostgreSQL-Datenbank erstellen:**
   ```bash
   # In PostgreSQL:
   CREATE DATABASE famplan;
   CREATE USER famplan WITH PASSWORD 'famplan_password';
   GRANT ALL PRIVILEGES ON DATABASE famplan TO famplan;
   ```

3. **Datenbank-Migration ausführen:**
   ```bash
   cd backend
   npm run migrate
   cd ..
   ```

4. **Anwendung starten:**
   ```bash
   npm start
   ```

   Dies startet:
   - Backend auf `http://localhost:3000`
   - Frontend auf `http://localhost:4200`

5. **Im Browser öffnen:**
   ```
   http://localhost:4200
   ```

### Produktion mit Docker Compose

1. **Docker Compose starten:**
   ```bash
   docker-compose up -d
   ```

2. **Datenbank-Migration ausführen:**
   ```bash
   docker-compose exec backend npm run migrate
   ```

3. **Im Browser öffnen:**
   ```
   http://localhost
   ```

Die Anwendung läuft auf Port 80 und ist über einen einzigen Zugriffspunkt erreichbar:
- Frontend: `http://localhost/`
- Backend-API: `http://localhost/api/`

### Docker-Befehle

```bash
# Alle Container starten
npm run docker:up

# Alle Container stoppen
npm run docker:down

# Images neu bauen
npm run docker:build

# Logs anzeigen
docker-compose logs -f

# Nur bestimmte Logs anzeigen
docker-compose logs -f backend
docker-compose logs -f frontend
```

## Projektstruktur

```
famplan/
├── backend/              # Node.js/Express Backend
│   ├── src/
│   │   ├── database/    # Datenbankverbindung und Migrationen
│   │   ├── models/      # Datenmodelle (Kid, Task)
│   │   ├── routes/      # API-Routen
│   │   ├── services/    # Dienste (Scheduler)
│   │   └── index.ts     # Haupteinstiegspunkt
│   ├── Dockerfile
│   └── package.json
│
├── frontend/            # Angular Frontend
│   ├── src/
│   │   ├── app/
│   │   │   ├── components/  # UI-Komponenten
│   │   │   ├── models/      # TypeScript-Interfaces
│   │   │   ├── services/    # API-Service
│   │   │   └── ...
│   │   └── environments/    # Umgebungskonfiguration
│   ├── Dockerfile
│   ├── nginx.conf
│   └── package.json
│
├── nginx/               # Nginx Reverse Proxy Config
│   └── nginx.conf
│
├── docker-compose.yml   # Docker Compose Konfiguration
├── package.json         # Root-Paket mit Skripten
└── README.md
```

## API-Endpunkte

### Kids
- `GET /api/kids` - Alle Kinder abrufen
- `GET /api/kids/:id` - Ein Kind abrufen
- `POST /api/kids` - Neues Kind erstellen
- `PUT /api/kids/:id` - Kind aktualisieren
- `DELETE /api/kids/:id` - Kind löschen

### Tasks
- `GET /api/tasks` - Alle Aufgaben abrufen
- `GET /api/tasks?kid_id=:id` - Aufgaben eines Kindes abrufen
- `GET /api/tasks/:id` - Eine Aufgabe abrufen
- `POST /api/tasks` - Neue Aufgabe erstellen
- `PUT /api/tasks/:id` - Aufgabe aktualisieren
- `PATCH /api/tasks/:id/status` - Aufgabenstatus ändern
- `DELETE /api/tasks/:id` - Aufgabe löschen

## Verwendung

### Eltern-Dashboard

1. Navigiere zu `http://localhost` (oder `http://localhost:4200` im Entwicklungsmodus)
2. Füge Kinder über den Button "Kind hinzufügen" hinzu
3. Wähle ein Kind aus der Seitenleiste aus
4. Erstelle Aufgaben über den Button "Aufgabe hinzufügen"
5. Konfiguriere Wiederholungen für Aufgaben:
   - **Keine Wiederholung**: Aufgabe wird nicht automatisch zurückgesetzt
   - **Täglich**: Wird jeden Tag zurückgesetzt
   - **Wöchentlich**: Wird jede Woche zurückgesetzt
   - **Monatlich**: Wird jeden Monat zurückgesetzt
   - **Bestimmtes Datum**: Wird an einem festgelegten Datum zurückgesetzt

### Kinder-Board

1. Klicke auf das Augen-Symbol 👁️ neben einem Kind im Dashboard
2. Das Kind sieht sein eigenes Kanban-Board
3. Aufgaben können per Drag & Drop zwischen den Spalten verschoben werden:
   - **Zu erledigen** → **Mach ich gerade** → **Erledigt**

### Automatisches Zurücksetzen

Der Backend-Scheduler prüft stündlich, ob Aufgaben zurückgesetzt werden müssen:
- Erledigte Aufgaben mit Wiederholungseinstellungen werden automatisch zurück zu "Zu erledigen" verschoben
- Dies basiert auf der konfigurierten Wiederholungsfrequenz

## Umgebungsvariablen

### Backend (.env)
```env
PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=famplan
DB_USER=famplan
DB_PASSWORD=famplan_password
NODE_ENV=development
```

## Troubleshooting

### PostgreSQL-Verbindungsfehler
- Stelle sicher, dass PostgreSQL läuft
- Überprüfe die Datenbank-Credentials in der `.env`-Datei
- Bei Docker: Warte, bis der Health-Check erfolgreich ist

### Angular Build-Fehler
- Lösche `node_modules` und führe `npm install` erneut aus
- Stelle sicher, dass Node.js Version 20+ installiert ist

### Docker-Port-Konflikte
- Wenn Port 80 bereits belegt ist, ändere den Port in `docker-compose.yml`:
  ```yaml
  nginx:
    ports:
      - "8080:80"  # Ändere 80 auf einen freien Port
  ```

## Entwicklung

### Backend entwickeln
```bash
cd backend
npm run dev  # Startet mit Hot-Reload
```

### Frontend entwickeln
```bash
cd frontend
npm start  # Startet auf Port 4200
```

### Datenbank-Schema ändern
1. Passe `backend/src/database/migrate.ts` an
2. Führe Migration aus: `npm run migrate`

## Lizenz

MIT

## Autor

Erstellt für die Verwaltung von Familienaufgaben.
