# Crevio Backend API

This backend implements the core workflows described in your project guide:

- Authentication with Clerk bearer tokens
- Campaign management
- Contract ingestion + lifecycle management
- Rule-based decision result generation
- Final decision notifications

## Start

```bash
npm run api:start
```

Health check:

```bash
GET /api/health
```

## Auth Flow (Guide Figure 4.1.2.1)

- Client signs in with Clerk and sends Clerk session token as bearer.
- `GET /api/auth/me` syncs Clerk session to Crevio user profile.
- `POST /api/auth/onboard` creates role (`brand` or `creator`) for first-time users.
- `POST /api/auth/login` is kept only for legacy local testing.

Use token:

`Authorization: Bearer <clerk-session-token>`

## Campaign Flow

- `GET /api/campaigns` (auth required)
- `POST /api/campaigns` (brand/admin)

Create campaign body:

```json
{
  "title": "New Fitness Push",
  "description": "Campaign brief",
  "platform": "Instagram",
  "budget": 10000,
  "deadline": "2026-12-30",
  "requirements": ["3 reels", "FTC disclosure"]
}
```

## Contract Lifecycle (Guide Figure 4.1.2.3)

- `GET /api/contracts` (auth required)
- `POST /api/contracts/ingest` (brand/admin, multipart file upload)
- `POST /api/contracts/:id/accept` (creator only) -> `pending -> accepted`
- `POST /api/contracts/:id/lock` (brand/admin) -> `accepted -> locked` + immutable hash stored
- `POST /api/contracts/:id/execute` (brand/admin) -> `locked -> executed -> completed/disputed`
- `PATCH /api/contracts/:id/deliverables/:deliverableId/status` (creator submit, brand/admin verify/reject)
- `PATCH /api/contracts/:id/rules/:ruleId` (brand/admin rule evaluation override)

Ingestion multipart fields:

```json
{
  "campaignId": "camp1",
  "creatorId": "c1",
  "paymentAmount": 5000,
  "contractDeadline": "2026-06-30",
  "notes": "Imported from signed contract",
  "file": "<contract document .md/.txt/.pdf>"
}
```

The system extracts terms from the uploaded document, stores them in `contract_documents.extracted_terms`, and computes `terms_hash` when locked.

## Decision + Notification Flow (Guide Figure 4.1.3.4/4.1.3.5)

- `GET /api/decisions` (auth required)
- `GET /api/notifications` (auth required)
- `POST /api/notifications/:id/read` (auth required)

## Notes

- Admin accounts are bootstraped from `CLERK_ADMIN_EMAILS` allowlist.
- Password validation supports hashed passwords if `users.password_hash` is set.
- For seeded demo users with null hash, login is open by default for local development.
