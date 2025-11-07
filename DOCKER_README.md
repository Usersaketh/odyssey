# Docker setup for Odyssey

This repository contains a Docker configuration to run Odyssey (frontend + backend + MySQL) locally or in a small production setup.

Files added:
- `odyssey-backend/Dockerfile` - Multi-stage Dockerfile to build the Spring Boot backend and run it on OpenJDK 17
- `odyssey-frontend/Dockerfile` - Multi-stage Dockerfile to build the Vite React app and serve via nginx
- `docker-compose.yml` - Compose file to run `db` (MySQL), `backend`, and `frontend` together
- `.dockerignore` files for each service to reduce image size

Quick start (development)

1. Create a `.env` file at repo root with secrets (recommended) or export environment variables:

```powershell
# Example .env
MYSQL_ROOT_PASSWORD=replace_me
MYSQL_DATABASE=odyssey
MYSQL_USER=odyssey
MYSQL_PASSWORD=replace_me
```

2. Build and run with docker-compose:

```powershell
docker compose up --build
```

3. Open the frontend at `http://localhost` and backend APIs at `http://localhost:9090`.

Notes & Next steps
- Rotate any secrets that were previously committed to the Git history. Removing them from history and rotating keys is still recommended.
- For production, replace `mysql` with a managed database or configure appropriate persistent storage and backups.
- Use a proper image registry and CI pipeline to build and push images.
- Secure environment variables with your cloud provider's secret manager or CI/CD pipeline.

If you'd like, I can add an Nginx reverse-proxy configuration, systemd unit examples, or a CI pipeline (GitHub Actions) to build and push images.
