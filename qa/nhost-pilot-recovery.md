# Nhost one-agent pilot recovery procedure

Last verified: 2026-09-07

Scope: the controlled AgencyGrowthAI pilot at `https://agencygrowthai.netlify.app`.
This procedure does not declare general production readiness.

## Boundaries

- Source defaults to the demo repository. Only the Netlify production environment selects `NEXT_PUBLIC_DATA_MODE=nhost`.
- Nhost Auth users and the `UNIQUE(public.agents.user_id)` membership invariant must be preserved.
- Business-backup data from Supabase has not been imported.
- Hasura metadata and Nhost schema changes are source-controlled under `nhost/`.
- Secrets must remain in ignored local environment files and Netlify secret storage. Never copy them into tickets, logs, deploy output, or browser-visible variables.

## Application rollback

1. Freeze public intake and record the failing Netlify deploy ID, Git SHA, UTC time, affected route, and sanitized status code.
2. In Netlify, publish the last known-good deploy for the existing `agencygrowthai` site. Do not create or link a replacement site.
3. Confirm `/`, `/login`, `/financial-checkup`, and `/career` return over HTTPS and `/dashboard` remains protected from anonymous access.
4. Confirm the selected deploy has the intended repository mode. Do not assume a rollback preserves newly changed environment variables.
5. Run the deployed smoke and tenant-isolation tests before reopening the pilot.

## Database and metadata recovery

1. Stop writes before any database recovery operation.
2. Export current Hasura metadata and record its hash and consistency state.
3. Record table counts and identify affected rows using a provenance-bounded predicate. Never use a broad delete or restore as a diagnostic step.
4. Prefer a forward, reviewed migration when schema state is consistent. Every corrective migration must have a documented rollback and must preserve tenant isolation.
5. A database restore is a manual operator action. Before using it, verify the Nhost project's actual backup/PITR entitlement, available restore points, target database, and expected data-loss window in the Dashboard or with Nhost support.
6. Do not start a destructive restore drill against the pilot project. Restore into an isolated target first when that capability is available, validate Auth/schema/metadata, and obtain explicit operator approval before cutover.

## Current recovery capability classification

- Netlify deploy rollback: available through retained deploy history; production deployment and logs were accessed during Phase 3C.
- Hasura metadata recovery: reproducible source-controlled metadata is present; consistency and hash guards are part of the security suite.
- Nhost daily backups: not verified from project/account evidence.
- Nhost manual backups: not verified from project/account evidence.
- Nhost point-in-time recovery: not verified from project/account evidence.
- Nhost restore workflow and retention: not verified from project/account evidence.
- Pilot RPO/RTO: not asserted until the four Nhost capabilities above are confirmed.

This limitation is accepted only for a controlled pilot with no imported business backup and a create-test-clean test-data policy. It must be resolved before general production readiness can be considered.

## Post-recovery validation

- Confirm Hasura metadata is consistent with zero inconsistent objects and the reviewed hash.
- Run Phase 2B security and static metadata guards.
- Run Phase 3A read, Phase 3B write, and Phase 3C deployed acceptance suites.
- Confirm User A can see only Agency A, User B can see only Agency B, and known-ID cross-tenant reads and writes remain blocked.
- Confirm public/user direct inserts, user deletes, membership forgery, role spoofing, identity spoofing, and audit/event forgery remain blocked.
- Confirm durable idempotency, the 32 KiB request limit, and the live Netlify `429` control.
- Confirm temporary test rows return to the expected clean counts.

## Evidence and escalation

- Netlify deploy and function logs are the primary evidence for build failures, HTTP function invocations, secret-scan results, and rate-limit configuration acceptance.
- Application failures return a generic public error contract. Server logs may record only sanitized upstream status/message categories; request bodies, JWTs, passwords, admin secrets, and database credentials are prohibited.
- Nhost Auth, GraphQL, and database operational evidence must be collected from the project Dashboard without exposing credentials.
- If tenant isolation, identity binding, metadata consistency, or data provenance cannot be proved, keep the pilot closed and escalate to the operator.
