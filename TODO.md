# Task Progress

## ✅ Build Error Fixes
- [x] Fix `app/ebooks/page.tsx` — missing closing `</div>` in JSX
- [x] Fix `app/ebooks/reader/[id]/page.tsx` — missing closing `</div>` in JSX
- [x] Fix `components/PDFViewer.tsx` — corrected react-pdf CSS import paths (`dist/` not `dist/esm/`)
- [x] Remove empty `app/ebooks/reader/page.tsx` that broke module resolution

## 🔄 Login Page Redesign (Split-Screen + ID Number Login)

### Backend — Accept ID Number (libraryId) or Email for login
- [x] Update `backend/src/validators/auth.schema.ts` — `loginSchema` accepts `identifier`
- [x] Update `backend/src/services/auth.service.ts` — `login()` looks up by `libraryId` OR `email`
- [x] Update `backend/src/controllers/auth.controller.ts` — pass `identifier` through

### Frontend — Support identifier login
- [x] Update `frontend/lib/api.ts` — `login(identifier, password)`
- [x] Update `frontend/lib/auth-context.tsx` — `login(identifier, password)`

### Frontend — Login page redesign
- [x] Rewrite `frontend/app/login/page.tsx` — split-screen dark/blue modern design
- [x] Make `frontend/app/books/page.tsx` browsable by guests (public catalog) + guard borrow actions

### Verify
- [x] Build frontend successfully
- [x] Verify backend type-checks

