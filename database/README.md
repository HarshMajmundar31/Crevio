# Crevio Database Guide

This folder contains the Neon/PostgreSQL database setup for Crevio based on the project report workflows:

- Authentication (login/session support)
- Campaign creation and requirements
- Contract lifecycle (pending -> locked -> executed -> completed/disputed)
- Rule-based evaluation and decision engine output
- Notification flow and contract event audit trail

## Files

- `crevio_schema.sql`: Full relational schema and indexes
- `crevio_seed.sql`: Starter data mapped from current Crevio mock data

## Run Commands

From workspace root:

```bash
npm run db:init
npm run db:seed
npm run db:tables
npm run db:check
```

## Core Tables

- `users`
- `auth_sessions`
- `campaigns`
- `campaign_requirements`
- `creator_matches`
- `contracts`
- `contract_deliverables`
- `contract_rules`
- `decision_evaluations`
- `decision_reasons`
- `notifications`
- `contract_events`
