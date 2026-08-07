# TODO — In-System Notification Feature

## Backend
- [x] 1. Add `notifyAllLibrarians` helper to `backend/src/services/notification.service.ts`
- [x] 2. Trigger librarian notification on borrow request creation in `backend/src/services/transaction.service.ts`
- [x] 3. Trigger librarian notification on book return in `backend/src/services/transaction.service.ts`

## Frontend
- [x] 4. Create `frontend/components/NotificationBell.tsx` (bell icon, red badge, dropdown panel, polling, mark-as-read, redirect)
- [x] 5. Wire `NotificationBell` into `frontend/app/dashboard/page.tsx` (librarian)
- [x] 6. Wire `NotificationBell` into `frontend/app/student/dashboard/page.tsx` (student/faculty)

## Verification
- [x] 7. Backend services transpile cleanly (notification.service.ts + transaction.service.ts)
- [x] 8. NotificationBell.tsx component transpiles cleanly
- [x] 9. Confirmed notification routes + controller response shape match component parsing
- [x] 10. Confirmed Prisma Notification model fields match usage (userId, type, title, message, isRead, link)
- [x] 11. Removed unused `Bell` imports from both dashboards (no unused-var lint errors)
- [ ] 12. Runtime test: borrow request → librarian badge + dropdown
- [ ] 13. Runtime test: book return → librarian notification
- [ ] 14. Runtime test: check button redirects to `/requests` and marks read

---

# TODO — 429 "Too Many Requests" Rate-Limit Fix

## Central API Client Hardening (`frontend/lib/api.ts`)
- [x] 1. Detect 429 responses → set `rateLimited: true` + `retryAfterMs` on the returned object
- [x] 2. Add client-side cooldown (`rateLimitUntil`, 10s) that short-circuits requests after a 429
- [x] 3. Add in-flight request deduplication map (keyed `method:endpoint:body`) to prevent duplicate concurrent calls
- [x] 4. Centralized `request()` pipeline so every page benefits automatically

## Shared Debounce Hook
- [x] 5. Create `frontend/lib/useDebounce.ts` (300ms default, named + default export)

## Books Page (`frontend/app/books/page.tsx`)
- [x] 6. Replace inline 300ms `setTimeout` debounce with shared `useDebounce` for search + category filter
- [x] 7. Add in-flight delete guard (`deletingId`) + disable delete buttons while running
- [x] 8. Handle `rateLimited` on `loadData` and `handleDelete` with friendly cooldown message

## Members Page (`frontend/app/members/page.tsx`)
- [x] 9. Debounce search + status filter via `useDebounce`
- [x] 10. Add in-flight delete guard (`deletingId`) + disable delete buttons while running
- [x] 11. Handle `rateLimited` on `loadData` and `handleDelete`

## Requests Page (`frontend/app/requests/page.tsx`)
- [x] 12. Debounce txn + request search/status filters (4 filters) via `useDebounce`
- [x] 13. Add `actionLoadingId` guard for Return / Pay Fine / Approve (double-click prevention, label swaps)
- [x] 14. Handle `rateLimited` on load + actions with friendly cooldown message

## Verification
- [x] 15. TypeScript project check (`npx tsc --noEmit`) passes with zero errors
- [ ] 16. Runtime test: no 429s during normal browsing/searching on Books / Members / Requests
- [ ] 17. Runtime test: action buttons disable while requests are in flight
- [ ] 18. Runtime test: friendly cooldown message appears when 429 is detected

