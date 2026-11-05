# G-PLAN Digital Empire — Foundation Repository

**Status:** Milestone 1 foundation scaffold. This is a working development starting point, not a launched production service.

## Included in this milestone

- Next.js public corporate website with responsive service and product sections.
- Express API with health, readiness, service catalogue and validated enquiry endpoints.
- PostgreSQL Prisma schema for users, organisations, memberships, enquiries, projects, brand profiles, leads, AI jobs, subscriptions, invoices and audit logs.
- Docker Compose for local PostgreSQL and Redis.
- GitHub Codespaces devcontainer configuration.
- Environment variable template and basic security middleware.

## Not yet implemented

Authentication and session management, role enforcement, client portal, admin console, payment processing, AI provider calls, social platform OAuth, file uploads, email delivery, production privacy/consent workflow, automated tests and production deployment are future milestones. API keys in `.env.example` are placeholders; no external integration is active by default.

## Requirements

- Node.js 20.11+
- npm 10+
- Docker / Docker Compose (for local database and Redis)

## Quick start in GitHub Codespaces

1. Upload or push this repository to GitHub.
2. Open the repository and choose **Code → Codespaces → Create codespace**. The devcontainer installs Node dependencies.
3. Copy `.env.example` to `.env` and replace secrets before use:

   ```bash
   cp .env.example .env
   ```

4. Start local infrastructure:

   ```bash
   docker compose up -d
   ```

5. Install dependencies if they were not installed automatically:

   ```bash
   npm install
   ```

6. Generate the Prisma client and create local tables:

   ```bash
   npm run db:generate
   npm run db:push
   ```

7. Start website and API:

   ```bash
   npm run dev
   ```

8. Open forwarded port **3000** for the website. API runs on port **4000**.

## Useful endpoints

- `GET http://localhost:4000/api/v1/health` — API liveness.
- `GET http://localhost:4000/api/v1/ready` — database readiness.
- `GET http://localhost:4000/api/v1/services` — current service catalogue.
- `POST http://localhost:4000/api/v1/enquiries` — persist an enquiry.

Example enquiry:

```bash
curl -X POST http://localhost:4000/api/v1/enquiries \
  -H 'Content-Type: application/json' \
  -d '{"name":"Ada Example","email":"ada@example.com","company":"Example Ltd","service":"AI Marketing","message":"We need help planning a marketing campaign."}'
```

## Environment configuration

The API reads the root `.env` through `dotenv`. Next.js reads `NEXT_PUBLIC_API_URL` for browser-exposed configuration and `API_URL` for server-side calls. Never prefix secrets with `NEXT_PUBLIC_`. Never commit `.env`.

## Database workflow

For local prototyping, `npm run db:push` synchronises the Prisma schema. For shared environments, use reviewed migrations (`npm run db:migrate`) and never run schema push against production.

## Production deployment notes

Deploy the web and API as separate services or containers. Provision managed PostgreSQL and Redis, private object storage, TLS, secret management, backups, monitoring and CI/CD. Set `CORS_ORIGIN`, `APP_URL`, `API_URL` and database credentials for each environment. Restrict database network access. Add rate limiting, spam prevention, privacy notice/consent, email verification and security tests before opening the enquiry endpoint publicly.

## Repository layout

```text
apps/
  api/
    prisma/schema.prisma
    src/server.ts
  web/
    src/app/
packages/
  config/
.devcontainer/
docker-compose.yml
.env.example
README.md
```

## Honest delivery status

The code in this milestone has been scaffolded but has not been installed, compiled, integration-tested, deployed or security-audited in your GitHub account. Run the commands above and complete the verification checklist before treating it as operational.
