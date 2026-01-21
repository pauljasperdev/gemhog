---
path: /home/lima/repo/packages/core/src/auth/auth.sql.ts
type: model
updated: 2025-01-21
status: active
---

# auth.sql.ts

## Purpose

Drizzle ORM schema definitions for authentication tables. Defines user, session, account, and verification tables with their columns, constraints, and indexes. Also defines Drizzle relations for type-safe joins between users, sessions, and accounts.

## Exports

- `user` - User table with id, name, email, emailVerified, image, timestamps
- `session` - Session table with token, expiry, user reference, IP/UA tracking
- `account` - OAuth account table with provider info and tokens
- `verification` - Email/phone verification tokens table
- `userRelations` - User to sessions/accounts relations
- `sessionRelations` - Session to user relation
- `accountRelations` - Account to user relation

## Dependencies

- drizzle-orm - Relations helper for defining table relationships
- drizzle-orm/pg-core - PostgreSQL schema primitives

## Used By

TBD

## Notes

Cascading deletes configured on user references for data cleanup.
