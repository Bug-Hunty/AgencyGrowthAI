# AgencyGrowthAI

AgencyGrowthAI is a secure, multi-tenant SaaS platform for financial and growth-oriented agencies. It combines lead management, recruiting, appointments, campaigns, content operations, analytics, AI-assisted workflows, compliance tooling, and public intake experiences in a single application.

The platform is built with a security-first architecture using Nhost Auth, Hasura GraphQL permissions, PostgreSQL, trusted server-side public intake routes, and strict tenant isolation.

Current status: Phase 3C verified. One-agent pilot approved for controlled use. General production readiness has not been declared.

## Overview

AgencyGrowthAI is designed to help agencies manage the full lifecycle of client acquisition, recruiting, engagement, and operational follow-up.

Core workflows include:

- Lead capture and qualification
- Financial Checkup intake
- Recruiting and candidate management
- Appointment scheduling
- Campaign management
- Content workflows
- Analytics and operational metrics
- AI-assisted workflows
- Consent and compliance records
- Audit visibility
- Multi-tenant agency isolation

The current pilot architecture supports a strict:

```
1 Auth user
→ 1 agent
→ 1 agency
```

membership model.

## Technology Stack

### Frontend

- Next.js
- React
- TypeScript
- Tailwind CSS
- Radix UI

### Forms and Validation

- React Hook Form
- Zod

### Authentication

- Nhost Auth
- Real JWT-based sessions
- Session restoration and logout
- JWT-to-user identity binding

### Database and API

- PostgreSQL
- Nhost
- Hasura GraphQL
- Next.js Route Handlers / API routes

### Analytics and Visualization

- Recharts

### Testing

- Playwright
- Axe accessibility testing
- Nhost runtime security suites
- Static authorization boundary guards
- Tenant-isolation adversarial tests
- Secret-safety checks

### Deployment

- Netlify
- HTTPS pilot deployment
- Netlify platform rate limiting for public intake

## Application Features

- **Dashboard** — agency metrics and activity
- **Agents** — agency personnel
- **Leads** — lead management and qualification
- **Appointments** — scheduling and follow-up
- **Recruiting** — candidate workflow
- **Campaigns** — outreach and marketing campaigns
- **Content** — content asset management
- **Analytics** — reporting and performance metrics
- **AI Assistant** — AI-assisted operational workflows
- **Compliance** — consent and audit visibility
- **Settings** — agency configuration

## Public Experience

Public routes include:

- `/`
- `/financial-checkup`
- `/career`
- Privacy and legal pages
- Trusted public intake endpoints under `/api/public/`

Public intake is processed through trusted server-side routes rather than direct anonymous GraphQL writes.

## Security Architecture

AgencyGrowthAI uses a deny-by-default multi-tenant security model.

### Authentication

Users authenticate through Nhost Auth using real JWT sessions.

```
Nhost Auth
    ↓
JWT
    ↓
x-hasura-user-id
    ↓
public.agents.user_id
    ↓
public.agents.agency_id
    ↓
tenant-owned data
```

### Tenant Isolation

```
MEMBERSHIP_MODEL=SINGLE_AGENCY
MEMBERSHIP_INVARIANT=UNIQUE(agents.user_id)
```

Each authenticated pilot user maps to one agent membership and one agency.

Hasura permissions enforce tenant-scoped row access using the authenticated user identity.

### Authorization

The primary runtime authorization boundary is:

```
Nhost Auth
+
Hasura row/column permissions
+
PostgreSQL membership constraints
```

The public role has no direct CRUD access to AgencyGrowthAI tenant tables.

Authenticated users receive only explicitly authorized operations.

### Trusted Public Intake

```
Anonymous Browser
      ↓
Next.js public API route
      ↓
strict validation
      ↓
server-side agency resolution
      ↓
server-side scoring / authority
      ↓
server-only administrative GraphQL operation
      ↓
Nhost / PostgreSQL
```

The browser is never authoritative for fields such as:

- agency_id
- user_id
- agent_id
- scoring
- privileged status
- audit actors
- tenant membership

### Public Intake Hardening

Current controls include:

- 32 KiB request-body limit
- Durable idempotency
- Conflict detection for reused idempotency keys
- Netlify rate limiting
- Sanitized public error responses
- Server-controlled tenant resolution
- Server-controlled scoring
- Cross-tenant reference validation
- Server-only administrative credentials

### Security Regression Coverage

Security tests verify:

- User A can access Agency A only
- User B can access Agency B only
- Known foreign IDs remain inaccessible
- Cross-tenant updates are blocked
- Row-transfer attacks are blocked
- Membership forgery is blocked
- Duplicate membership is blocked
- Role spoofing is blocked
- User-ID header spoofing is blocked
- Public GraphQL writes are blocked
- Direct authenticated INSERT is blocked
- Audit/event forgery is blocked
- Administrative secrets are absent from browser bundles

## Data Model

AgencyGrowthAI currently contains 15 application tables:

- agencies
- agents
- leads
- lead_events
- appointments
- candidates
- candidate_events
- campaigns
- campaign_events
- content_assets
- content_reviews
- ai_interactions
- consents
- audit_logs
- settings

The schema is tenant-aware and built around agency_id ownership.

## Repository Modes

AgencyGrowthAI supports explicit data repository modes:

- demo
- supabase
- nhost

The source-code fallback remains:

```
demo
```

The controlled pilot environment explicitly uses:

```
nhost
```

There is no silent Nhost-to-demo fallback when Nhost mode is explicitly selected.

### Nhost Repository

The application implements an IRepository abstraction.

Available implementations include:

- DemoRepository
- SupabaseRepository
- NhostRepository

The Nhost implementation supports tenant-scoped reads and approved authenticated updates using the user's real JWT.

Public creation flows are intentionally handled through trusted server routes instead of direct browser repository INSERTs.

## Public APIs

Trusted public routes include:

- `/api/public/leads`
- `/api/public/candidates`
- `/api/public/appointments`

These routes:

- validate request bodies
- resolve the target agency server-side
- reject unknown tenants
- reject cross-tenant references
- prevent client-authoritative tenant assignment
- apply durable idempotency
- enforce request-size limits
- operate behind Netlify rate limiting
- return sanitized errors

## Testing Strategy

AgencyGrowthAI uses layered verification rather than relying on a single test suite.

### Application Regression

- 43/43 E2E tests
- 9/9 SEO tests
- 11/11 accessibility routes

### Nhost Security

Dedicated suites cover:

- Authentication
- Real JWT binding
- Tenant-scoped reads
- Tenant-scoped updates
- Known-ID attacks
- Cross-tenant mutation attempts
- Membership attacks
- Role spoofing
- Identity spoofing
- Public-write denial
- Audit integrity
- Secret boundaries
- Trusted public write paths
- Idempotency
- Deployed pilot acceptance

### Test Fixtures

```
CREATE
→ TEST
→ CLEAN
```

Persistent synthetic business records are not required for routine security validation.

## Pilot Deployment

The controlled pilot is deployed at:

```
https://agencygrowthai.netlify.app/
```

Pilot configuration:

```
SOURCE DEFAULT REPOSITORY: demo
PILOT ENV REPOSITORY: nhost
```

Verified pilot capabilities include:

- HTTPS deployment
- Real Nhost authentication
- Session restoration
- Logout and protected routes
- Tenant-scoped dashboard reads
- Tenant-scoped authenticated updates
- Financial Checkup submission
- Lead persistence
- Candidate persistence
- Appointment persistence
- Server-side scoring
- Server-side agency resolution
- Durable idempotency
- Live rate limiting
- Cross-tenant isolation
- Secret-boundary verification

## Project Status

```
PHASE 1 CLASSIFICATION: VERIFIED
PHASE 2B CLASSIFICATION: VERIFIED
PHASE 3A CLASSIFICATION: VERIFIED
PHASE 3B CLASSIFICATION: VERIFIED
PHASE 3C CLASSIFICATION: VERIFIED
```

```
ONE-AGENT PILOT: GO
GENERAL PRODUCTION READINESS: NOT DECLARED
```

### Phase 4

The next operational-hardening phase focuses exclusively on:

- Database recovery
- Backup verification
- Safe restore testing
- Observability
  - Structured logging
  - Correlation IDs
  - Alerts
- Incident-response runbooks
- Deployment rollback procedures
- Secret-rotation procedures
- SLI/SLO definitions
- Error budgets
- Production-readiness reassessment

No multi-agency expansion or historical Supabase data import is part of this phase.

## Production Readiness

AgencyGrowthAI has passed the controlled one-agent pilot gate, but this does not mean the platform is generally production-ready.

Remaining operational topics include:

- Verified project-specific backup capabilities
- Restore validation
- RPO/RTO evidence
- Production observability
- Alert delivery
- Incident-response procedures
- Deployment rollback procedures
- SLO measurement
- Error-budget policy
- Broader operational access review

Production readiness will be reassessed after Phase 4.

## Supabase Status

Supabase remains preserved as a historical/reference implementation.

The historical Supabase backup has not been imported into Nhost.

```
SUPABASE BACKUP IMPORT: NOT RUN
SUPABASE BUSINESS DATA: NOT IMPORTED
```

Supabase-specific internal schemas such as Auth, Storage, Realtime, roles, grants, and migration internals are not intended to be restored directly into Nhost.

## Multi-Agency Status

The current pilot intentionally uses a single-agency membership model.

```
1 Auth user
→ 1 agent
→ 1 agency
```

Multi-agency support has not been implemented.

A future design should introduce an explicit membership model such as:

```
agency_memberships
```

rather than weakening the current `UNIQUE(agents.user_id)` invariant.

## Optional Integrations

### 21YunBox

```
PRESERVED
OPTIONAL
NON-BLOCKING
```

It is not part of the critical AgencyGrowthAI pilot path.

## Local Development

Install dependencies:

```bash
npm install
```

Run the development server:

```bash
npm run dev
```

Open:

```
http://localhost:3000
```

Use ignored local environment files for Nhost and test configuration.

Never commit:

- passwords
- access tokens
- refresh tokens
- JWTs
- Hasura administrative secrets
- Nhost administrative secrets
- PostgreSQL credentials
- local .env files containing secret values

## Quality Checks

Typical project checks include:

```bash
npm run lint
npx tsc --noEmit
npm run build
```

Nhost-specific security scripts are also available through the repository's npm scripts.

See:

- `tests-nhost/`
- `qa/`
- `nhost/`

for security evidence, migration artifacts, operational documentation, and test suites.

## Security

Security issues should not be reported publicly.

Please use GitHub Private Vulnerability Reporting / Security Advisories for this repository when available.

See:

- `SECURITY.md`

for the full disclosure policy.

## Repository Structure

```
app/              Next.js routes and dashboard
components/       UI and providers
lib/              repositories, Nhost integration, utilities
nhost/            migrations, metadata, and security documentation
tests-nhost/      Nhost runtime and boundary-security tests
qa/               recovery, operational, and readiness documentation
```

## Deployment

The pilot uses Netlify with Nhost as the explicitly selected backend.

```
source default = demo
pilot environment = nhost
```

Do not assume a deployment is using Nhost solely because it builds successfully. Deployment verification must confirm the environment mode and real authentication path.

## Contributing

Contributions should preserve the project's security boundaries.

Changes affecting:

- authentication
- Hasura permissions
- tenant ownership
- public intake
- administrative credentials
- membership
- audit records
- Nhost metadata
- trusted server routes

should include corresponding security regression tests.

Never weaken an authorization assertion simply to make a test pass.

## License

Add the project's chosen license here when finalized.

## Disclaimer

AgencyGrowthAI includes financial-agency workflow and Financial Checkup functionality. Public-facing outputs should remain educational and operational in nature and should not be interpreted as individualized investment, legal, tax, or financial advice unless appropriate licensed workflows and compliance requirements are separately implemented.

## Current Milestone

```
ONE-AGENT PILOT: GO
GENERAL PRODUCTION READINESS: NOT DECLARED
PHASE 4: OPERATIONAL HARDENING / READINESS REASSESSMENT
```

AgencyGrowthAI is currently progressing from a security-verified controlled pilot toward operational production readiness.
