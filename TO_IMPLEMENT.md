
## 1. Is there an API for the backend for other systems to utilize it?

Yes, via Supabase's auto-generated REST API. External systems can use the `service_role` key for backend integrations (e.g., IoT ingestion). For custom endpoints, we can add Supabase Edge Functions if needed.

---

## 2. Database operation files with SQL should be in a folder so it's more organized

Agreed. Currently 7 SQL files are in root. Will reorganize into `/database/migrations/`, `/database/seeds/`, etc.

---

## 3. Migrations should be available and update 1 table at a time without wiping data

Not implemented yet. We can use Supabase CLI migrations (`supabase db diff`) or adopt a migration tool like Prisma/Drizzle.

---

## 4. Why was JS used instead of TypeScript?

The project is based on Material Dashboard Pro React template which comes in JS. TypeScript is available as optional dependency and can be adopted incrementally.

---

## 5. Why is there not a service layer for API endpoints?

For MVP speed, we used custom React hooks as the data layer (useVehicles, useEvents, etc.) which call Supabase directly. A proper service layer can be added for better separation of concerns and testability.

---

## 6. Is caching being used for faster data retrieval?

No. Currently using polling (30s intervals). Recommend adopting React Query/TanStack Query for automatic caching, deduplication, and stale-while-revalidate.

---

## 7. Strong passwords from users | hashing of passwords in DB

Handled by Supabase Auth - passwords are hashed with bcrypt. Password complexity rules can be enforced via frontend validation or Supabase Auth settings.

---

## 8. Do you have any automatic retries if any failures?

No. Errors are caught but not retried - they wait for the next polling interval (30s). Can implement retry with exponential backoff or adopt React Query which includes this.

---

## 9. Is pagination being implemented efficiently with the backend?

Partial. Using `.limit()` but no offset/cursor pagination. Search filtering is client-side. Server-side pagination with `.range()` can be implemented.

---

## 10. Is there rate limiting on API?

Yes, handled by Supabase (built-in rate limits per plan). Frontend polling is set to 30s which is reasonable.

---

## 11. Toast notifications for user actions

Yes. Two systems implemented:
- **Snackbar** component for toast notifications
- **SweetAlert** for success/error modals on form submissions

---

## 12. Is there global state management across the application?

Minimal. Only **AuthContext** for user/session state. Other data is managed locally in hooks. Can adopt Zustand or React Query for more robust state management.

---

## 13. Remove unused dependencies

Will audit. Suspected unused: `chartist`, `react-big-calendar`, `react-jvectormap`, `nouislider`, `react-tagsinput`. Will run `npx depcheck`.

---

## 14. Proper error handling (friendly messages)

Partial. SweetAlert shows friendly messages for forms, but API errors sometimes show raw messages. Can add an error mapper for user-friendly translations.

---

## Summary

| # | Question | Status |
|---|----------|--------|
| 1 | Backend API | ✅ Via Supabase REST |
| 2 | SQL organization | ❌ Needs restructuring |
| 3 | Migrations | ❌ Not implemented |
| 4 | TypeScript | ⚠️ JS (TS available) |
| 5 | Service layer | ⚠️ Hooks as data layer |
| 6 | Caching | ❌ Polling only |
| 7 | Password security | ✅ Supabase Auth |
| 8 | Auto retries | ❌ Not implemented |
| 9 | Pagination | ⚠️ Limit only |
| 10 | Rate limiting | ✅ Supabase built-in |
| 11 | Toasts | ✅ Implemented |
| 12 | Global state | ⚠️ AuthContext only |
| 13 | Unused deps | ⚠️ Needs audit |
| 14 | Error handling | ⚠️ Partial |
