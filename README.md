# FamilyFlow - Family Task Planning Board

A self-hosted web application for managing children's tasks with Kanban boards and automatic recurring tasks.

[![Build and Push Docker Images](https://github.com/MarcoDroll/familyflow/actions/workflows/docker-build.yml/badge.svg)](https://github.com/MarcoDroll/familyflow/actions/workflows/docker-build.yml)

## ✨ Features

- 🎯 **Kanban Board** with three columns: "To Do", "Doing", "Done"
- 👨‍👩‍👧‍👦 **Multiple Children** - Each child has their own board
- 🔄 **Automatic Recurring Tasks** - Daily, weekly, monthly, or specific date
- 🔒 **PIN-Protected Parent Dashboard** - Secure admin access (default PIN: 8956)
- 🎨 **Modern Dark Theme** - Beautiful UI with teal accents and Manrope font
- 🐳 **Docker Ready** - Pre-built images with semantic versioning
- 📦 **GitHub Actions** - Automated builds on every release
- 🇩🇪 **German Interface**

## 🚀 Quick Start

### Deploy on Asustor NAS with Portainer

```bash
# In Portainer: Stacks → Add Stack → Repository
Repository URL: https://github.com/MarcoDroll/familyflow
Compose path: docker-compose.yml
```

**Or via command line:**
```bash
wget https://raw.githubusercontent.com/MarcoDroll/familyflow/main/docker-compose.yml
docker-compose up -d
```

Access at: `http://your-nas-ip`
PIN: `8956`

📖 **Full deployment guide**: See [DEPLOYMENT.md](DEPLOYMENT.md)

## 📦 Pre-built Images

Docker images are automatically built via GitHub Actions and published to GitHub Container Registry:

- **Backend**: `ghcr.io/marcodroll/familyflow-backend:latest`
- **Frontend**: `ghcr.io/marcodroll/familyflow-frontend:latest`

### Creating a New Release

```bash
# Tag a new version (semantic versioning)
git tag v1.0.0
git push origin v1.0.0

# GitHub Actions will automatically:
# ✅ Build Docker images
# ✅ Push to ghcr.io
# ✅ Tag as version and 'latest'
```

View builds: [GitHub Actions](https://github.com/MarcoDroll/familyflow/actions)

## 🛠️ Technology Stack

- **Frontend**: Angular 18 with TypeScript, standalone components
- **Backend**: Node.js with Express and TypeScript
- **Database**: SQLite (persistent volume)
- **Reverse Proxy**: Nginx
- **CI/CD**: GitHub Actions
- **Container Registry**: GitHub Container Registry (ghcr.io)
- **Containerization**: Docker & Docker Compose

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
