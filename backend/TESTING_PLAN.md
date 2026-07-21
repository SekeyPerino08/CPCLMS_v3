# CPCLMS v3 — Complete API Testing Guide

## Server Base URL: `http://localhost:4000/api`

---

## Table of Contents
1. [Authentication Endpoints](#1-authentication-endpoints)
2. [User Management (Librarian)](#2-user-management-librarian)
3. [Books CRUD](#3-books-crud)
4. [Categories](#4-categories)
5. [E-Books](#5-e-books)
6. [Borrow Requests](#6-borrow-requests)
7. [Transactions (Borrowing)](#7-transactions-borrowing)
8. [Reservations](#8-reservations)
9. [Dashboard & Analytics](#9-dashboard--analytics)
10. [Policies (Librarian)](#10-policies-librarian)
11. [Reports (Librarian)](#11-reports-librarian)
12. [Activity Logs](#12-activity-logs)
13. [Notifications](#13-notifications)
14. [Health Check](#14-health-check)
15. [How to Test Protected Routes](#15-how-to-test-protected-routes)
16. [Postman/Thunder Client Collection JSON](#16-postmanthunder-client-collection-json)

---

## 1. Authentication Endpoints

### Base: `POST /api/auth/*`

| #  | Method | Route | Auth  | Description | Body |
|----|--------|-------|-------|-------------|------|
| 1.1 | **POST** | `/api/auth/register` | No | Self-registration (always STUDENT role) | `{ firstName, lastName, email, password, department?, yearSection?, phone? }` |
| 1.2 | **POST** | `/api/auth/login` | No | Login with email + password | `{ email, password }` |
| 1.3 | **POST** | `/api/auth/refresh` | No | Refresh access token | `{ refreshToken }` |
| 1.4 | **GET** | `/api/auth/me` | Yes | Get current user's profile | — |
| 1.5 | **PUT** | `/api/auth/change-password` | Yes | Change own password | `{ currentPassword, newPassword }` |
| 1.6 | **POST** | `/api/auth/logout` | Yes | Revoke a specific refresh token | `{ refreshToken? }` |
| 1.7 | **POST** | `/api/auth/logout-all` | Yes | Revoke ALL refresh tokens | — |

### Sample Requests

#### ✅ 1.1 Register (Student) — Success
```bash
curl -X POST http://localhost:4000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Juan",
    "lastName": "Dela Cruz",
    "email": "juan@example.com",
    "password": "password123",
    "department": "BSIT",
    "yearSection": "3-BSIT"
  }'
```
**Expected Response (201):**
```json
{
  "success": true,
  "message": "Registration successful",
  "data": {
    "accessToken": "eyJ...",
    "refreshToken": "a1b2c3...",
    "expiresIn": 900,
    "user": {
      "id": "clxx...",
      "libraryId": "LIB-2025-0001",
      "firstName": "Juan",
      "lastName": "Dela Cruz",
      "email": "juan@example.com",
      "role": "STUDENT",
      "department": "BSIT",
      "yearSection": "3-BSIT",
      "phone": null,
      "isActive": true,
      "createdAt": "2025-01-01T00:00:00.000Z",
      "updatedAt": "2025-01-01T00:00:00.000Z"
    }
  }
}
```

#### ❌ 1.1 Register — Error (Duplicate Email)
```bash
curl -X POST http://localhost:4000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Juan",
    "lastName": "Dela Cruz",
    "email": "juan@example.com",
    "password": "password123"
  }'
```
**Expected (409):**
```json
{
  "success": false,
  "error": "An account with this email already exists"
}
```

#### ❌ 1.1 Register — Error (Validation)
```bash
curl -X POST http://localhost:4000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "",
    "email": "invalid",
    "password": "123"
  }'
```
**Expected (400):** Zod validation error with field details.

---

#### ✅ 1.2 Login — Success
```bash
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "juan@example.com",
    "password": "password123"
  }'
```
**Expected (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "accessToken": "eyJ...",
    "refreshToken": "a1b2c3...",
    "expiresIn": 900,
    "user": { "...same as register..." }
  }
}
```

#### ❌ 1.2 Login — Error (Wrong Password)
```bash
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "juan@example.com",
    "password": "wrongpassword"
  }'
```
**Expected (401):**
```json
{
  "success": false,
  "error": "Invalid email or password"
}
```

#### ❌ 1.2 Login — Error (Deactivated Account)
```bash
curl -X POST ... # Same payload, but user has been deactivated
```
**Expected (401):**
```json
{
  "success": false,
  "error": "Your account has been deactivated. Please contact the library."
}
```

---

#### ✅ 1.4 Get Profile (Authenticated)
```bash
curl http://localhost:4000/api/auth/me \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```
**Expected (200):**
```json
{
  "success": true,
  "data": {
    "...user fields...",
    "borrowTransactions": [],
    "reservations": [],
    "notifications": [],
    "_count": { "borrowTransactions": 0, "reservations": 0, "notifications": 0 }
  }
}
```

#### ❌ 1.4 No Token
```bash
curl http://localhost:4000/api/auth/me
```
**Expected (401):**
```json
{
  "success": false,
  "error": "Access denied. No token provided."
}
```

---

## 2. User Management (Librarian)

| #  | Method | Route | Auth | Role | Description | Body |
|----|--------|-------|------|------|-------------|------|
| 2.1 | **GET** | `/api/auth/users` | Yes | LIBRARIAN | List all users (paginated, filterable) | Query: `?page=1&limit=20&role=STUDENT&search=Juan&isActive=true` |
| 2.2 | **POST** | `/api/auth/admin/users` | Yes | LIBRARIAN | Create user with any role | `{ firstName, lastName, email, password, role, department?, yearSection?, phone? }` |
| 2.3 | **PATCH** | `/api/auth/users/:id/toggle-status` | Yes | LIBRARIAN | Activate/deactivate a user | — |

### Sample Requests

#### ✅ 2.2 Create Librarian User
```bash
curl -X POST http://localhost:4000/api/auth/admin/users \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <LIBRARIAN_TOKEN>" \
  -d '{
    "firstName": "Maria",
    "lastName": "Santos",
    "email": "maria.santos@library.com",
    "password": "librarian123",
    "role": "LIBRARIAN",
    "department": "Library"
  }'
```
**Expected (201):** Created user object (no password field).

#### ✅ 2.3 Toggle User Status (Deactivate)
```bash
curl -X PATCH http://localhost:4000/api/auth/users/<USER_ID>/toggle-status \
  -H "Authorization: Bearer <LIBRARIAN_TOKEN>"
```
**Expected (200):**
```json
{
  "success": true,
  "message": "User deactivated successfully",
  "data": { "...user with isActive: false..." }
}
```

#### ❌ 2.1 Students access (FORBIDDEN)
```bash
curl http://localhost:4000/api/auth/users \
  -H "Authorization: Bearer <STUDENT_TOKEN>"
```
**Expected (403):**
```json
{
  "success": false,
  "error": "Insufficient permissions."
}
```

---

## 3. Books CRUD

| #  | Method | Route | Auth | Role | Description | Body |
|----|--------|-------|------|------|-------------|------|
| 3.1 | **GET** | `/api/books` | No | Public | List books (paginated, filterable) | Query: `?page=1&limit=10&search=title&categoryId=xxx&status=AVAILABLE` |
| 3.2 | **GET** | `/api/books/:id` | No | Public | Get one book by ID | — |
| 3.3 | **POST** | `/api/books` | Yes | LIBRARIAN | Create a book | See body below |
| 3.4 | **PUT** | `/api/books/:id` | Yes | LIBRARIAN | Update a book | Partial fields |
| 3.5 | **DELETE** | `/api/books/:id` | Yes | LIBRARIAN | Delete a book | — |

### Sample Requests

#### ✅ 3.1 List All Books (Public)
```bash
curl "http://localhost:4000/api/books?page=1&limit=10"
```
**Expected (200):**
```json
{
  "success": true,
  "data": [ { "id": "...", "isbn": "978-...", "title": "...", ... } ],
  "meta": { "page": 1, "limit": 10, "total": 5, "totalPages": 1 }
}
```

#### ✅ 3.3 Create Book (Librarian)
```bash
curl -X POST http://localhost:4000/api/books \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <LIBRARIAN_TOKEN>" \
  -d '{
    "isbn": "978-3-16-148410-0",
    "accessionNo": "ACC-2025-0001",
    "title": "Introduction to Algorithms",
    "author": "Thomas H. Cormen",
    "publisher": "MIT Press",
    "publishYear": 2009,
    "edition": "3rd",
    "pages": 1312,
    "categoryId": "<CATEGORY_ID>",
    "description": "Comprehensive guide to algorithms",
    "language": "English",
    "shelf": "A",
    "row": "1",
    "copies": 3
  }'
```
**Expected (201):**
```json
{
  "success": true,
  "message": "Book created successfully",
  "data": { "id": "...", "availableCopies": 3, "status": "AVAILABLE", ... }
}
```

#### ❌ 3.3 Student tries to create book
```bash
curl -X POST http://localhost:4000/api/books \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <STUDENT_TOKEN>" \
  -d '{ "isbn": "...", "accessionNo": "...", "title": "...", "author": "..." }'
```
**Expected (403):** `"Insufficient permissions."`

#### ✅ 3.4 Update Book (Librarian)
```bash
curl -X PUT http://localhost:4000/api/books/<BOOK_ID> \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <LIBRARIAN_TOKEN>" \
  -d '{
    "copies": 5,
    "status": "AVAILABLE"
  }'
```

#### ✅ 3.5 Delete Book (Librarian)
```bash
curl -X DELETE http://localhost:4000/api/books/<BOOK_ID> \
  -H "Authorization: Bearer <LIBRARIAN_TOKEN>"
```
**Expected (200):** `{ "success": true, "message": "Book deleted successfully", "data": null }`

#### ❌ 3.5 Delete non-existent book
```bash
curl -X DELETE http://localhost:4000/api/books/non-existent-id \
  -H "Authorization: Bearer <LIBRARIAN_TOKEN>"
```
**Expected (404):**
```json
{
  "success": false,
  "error": "Book not found"
}
```

---

## 4. Categories

| #  | Method | Route | Auth | Role | Description | Body |
|----|--------|-------|------|------|-------------|------|
| 4.1 | **GET** | `/api/categories` | No | Public | List all categories (hierarchical) | — |
| 4.2 | **GET** | `/api/categories/:id` | No | Public | Get category by ID | — |
| 4.3 | **POST** | `/api/categories` | Yes | LIBRARIAN | Create category | `{ name, slug?, description?, parentId? }` |
| 4.4 | **PUT** | `/api/categories/:id` | Yes | LIBRARIAN | Update category | Partial fields |
| 4.5 | **DELETE** | `/api/categories/:id` | Yes | LIBRARIAN | Delete category | — |

### Sample Requests

#### ✅ 4.3 Create Category (Librarian)
```bash
curl -X POST http://localhost:4000/api/categories \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <LIBRARIAN_TOKEN>" \
  -d '{
    "name": "Computer Science",
    "slug": "computer-science",
    "description": "Books about computing and programming"
  }'
```
**Expected (201):**
```json
{
  "success": true,
  "message": "Category created successfully",
  "data": { "id": "...", "name": "Computer Science", "slug": "computer-science", ... }
}
```

---

## 5. E-Books

| #  | Method | Route | Auth | Role | Description | Body |
|----|--------|-------|------|------|-------------|------|
| 5.1 | **GET** | `/api/ebooks` | No | Public | List e-books (paginated) | `?page=1&limit=10` |
| 5.2 | **GET** | `/api/ebooks/:id` | No | Public | Get e-book details | — |
| 5.3 | **POST** | `/api/ebooks` | Yes | LIBRARIAN | Create e-book | See body below |
| 5.4 | **PUT** | `/api/ebooks/:id` | Yes | LIBRARIAN | Update e-book | Partial fields |
| 5.5 | **DELETE** | `/api/ebooks/:id` | Yes | LIBRARIAN | Delete e-book | — |

### Sample Requests

#### ✅ 5.3 Create E-Book (Librarian)
```bash
curl -X POST http://localhost:4000/api/ebooks \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <LIBRARIAN_TOKEN>" \
  -d '{
    "isbn": "978-0-13-110362-7",
    "title": "The C Programming Language",
    "author": "Brian Kernighan",
    "publisher": "Prentice Hall",
    "publishYear": 1988,
    "fileUrl": "https://example.com/ebooks/c-programming.pdf",
    "format": "PDF",
    "fileSize": 5242880
  }'
```

---

## 6. Borrow Requests

| #  | Method | Route | Auth | Role | Description | Body |
|----|--------|-------|------|------|-------------|------|
| 6.1 | **POST** | `/api/transactions/requests` | Yes | ANY | Submit a borrow request | `{ bookId, notes? }` |
| 6.2 | **GET** | `/api/transactions/requests` | Yes | ANY | List requests (librarian sees all; student sees own) | `?page=1&limit=10&status=PENDING` |
| 6.3 | **PUT** | `/api/transactions/requests/:id/approve` | Yes | LIBRARIAN | Approve a request | `{ dueDate? }` (ISO datetime optional) |
| 6.4 | **PUT** | `/api/transactions/requests/:id/reject` | Yes | LIBRARIAN | Reject a request | `{ reason }` |

### Sample Requests

#### ✅ 6.1 Submit Borrow Request (Student)
```bash
curl -X POST http://localhost:4000/api/transactions/requests \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <STUDENT_TOKEN>" \
  -d '{
    "bookId": "<BOOK_ID>",
    "notes": "Need for research paper"
  }'
```
**Expected (201):**
```json
{
  "success": true,
  "message": "Borrow request submitted",
  "data": { "id": "...", "status": "PENDING", "requestDate": "...", ... }
}
```

#### ❌ 6.1 Borrow Request — Invalid Book ID
```bash
curl -X POST http://localhost:4000/api/transactions/requests \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <STUDENT_TOKEN>" \
  -d '{ "bookId": "non-existent" }'
```
**Expected (404):**
```json
{
  "success": false,
  "error": "Book not found"
}
```

#### ✅ 6.3 Approve Request (Librarian)
```bash
curl -X PUT http://localhost:4000/api/transactions/requests/<REQUEST_ID>/approve \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <LIBRARIAN_TOKEN>"
```
**Expected (200):**
```json
{
  "success": true,
  "message": "Borrow request approved",
  "data": { "transaction": {...}, "request": { "...status": "APPROVED", ... } }
}
```

#### ✅ 6.4 Reject Request (Librarian)
```bash
curl -X PUT http://localhost:4000/api/transactions/requests/<REQUEST_ID>/reject \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <LIBRARIAN_TOKEN>" \
  -d '{
    "reason": "Book is currently in maintenance"
  }'
```
**Expected (200):**
```json
{
  "success": true,
  "message": "Borrow request rejected"
}
```

#### ❌ 6.4 Reject — No reason
```bash
curl -X PUT http://localhost:4000/api/transactions/requests/<REQUEST_ID>/reject \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <LIBRARIAN_TOKEN>" \
  -d '{}'
```
**Expected (400):** Validation error.

---

## 7. Transactions (Borrowing)

| #  | Method | Route | Auth | Role | Description | Body |
|----|--------|-------|------|------|-------------|------|
| 7.1 | **GET** | `/api/transactions` | Yes | ANY | List transactions (librarian=all; student=own) | `?page=1&limit=10&status=ACTIVE` |
| 7.2 | **GET** | `/api/transactions/:id` | Yes | ANY | Get transaction details | — |
| 7.3 | **GET** | `/api/transactions/my-count` | Yes | ANY | Get count of user's active borrows | — |
| 7.4 | **PUT** | `/api/transactions/:id/return` | Yes | LIBRARIAN | Return a book (by ID or QR code) | `{ qrCode? }` |
| 7.5 | **PUT** | `/api/transactions/:id/pay-fine` | Yes | ANY | Pay fine for a transaction | `{ amount }` |
| 7.6 | **POST** | `/api/transactions/check-overdue` | Yes | LIBRARIAN | Manually trigger overdue check | — |

### Sample Requests

#### ✅ 7.3 My Active Count
```bash
curl http://localhost:4000/api/transactions/my-count \
  -H "Authorization: Bearer <STUDENT_TOKEN>"
```
**Expected (200):**
```json
{
  "success": true,
  "data": { "activeCount": 2 }
}
```

#### ✅ 7.4 Return Book (Librarian) — by Transaction ID
```bash
curl -X PUT http://localhost:4000/api/transactions/<TRANSACTION_ID>/return \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <LIBRARIAN_TOKEN>"
```
**Expected (200):**
```json
{
  "success": true,
  "message": "Book returned successfully",
  "data": { "...transaction with status: 'RETURNED'..." }
}
```

#### ✅ 7.5 Pay Fine
```bash
curl -X PUT http://localhost:4000/api/transactions/<TRANSACTION_ID>/pay-fine \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <STUDENT_TOKEN>" \
  -d '{ "amount": 50 }'
```
**Expected (200):**
```json
{
  "success": true,
  "message": "Fine paid successfully"
}
```

#### ✅ 7.6 Check Overdue
```bash
curl -X POST http://localhost:4000/api/transactions/check-overdue \
  -H "Authorization: Bearer <LIBRARIAN_TOKEN>"
```
**Expected (200):**
```json
{
  "success": true,
  "message": "Overdue check completed",
  "data": { "updatedCount": 3 }
}
```

---

## 8. Reservations

| #  | Method | Route | Auth | Role | Description | Body |
|----|--------|-------|------|------|-------------|------|
| 8.1 | **POST** | `/api/reservations` | Yes | ANY | Reserve a book | `{ bookId }` |
| 8.2 | **GET** | `/api/reservations` | Yes | ANY | List reservations (librarian=all; student=own) | `?page=1` |
| 8.3 | **PUT** | `/api/reservations/:id/cancel` | Yes | ANY | Cancel reservation | — |

### Sample Requests

#### ✅ 8.1 Reserve Book
```bash
curl -X POST http://localhost:4000/api/reservations \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <STUDENT_TOKEN>" \
  -d '{ "bookId": "<BOOK_ID>" }'
```
**Expected (201):**
```json
{
  "success": true,
  "message": "Book reserved successfully",
  "data": { "id": "...", "status": "ACTIVE", "queuePosition": 1, ... }
}
```

#### ❌ 8.1 Already Reserved (same user + book + ACTIVE)
```json
{
  "success": false,
  "error": "...unique constraint violation..."
}
```

---

## 9. Dashboard & Analytics

| #  | Method | Route | Auth | Role | Description | Query Params |
|----|--------|-------|------|------|-------------|------|
| 9.1 | **GET** | `/api/analytics/dashboard` | Yes | LIBRARIAN | Dashboard summary stats | — |
| 9.2 | **GET** | `/api/analytics/monthly-trends` | Yes | LIBRARIAN | Monthly borrowing trends | `?months=6` |
| 9.3 | **GET** | `/api/analytics/category-distribution` | Yes | ANY | Category distribution | — |

### Sample Requests

#### ✅ 9.1 Dashboard Stats
```bash
curl http://localhost:4000/api/analytics/dashboard \
  -H "Authorization: Bearer <LIBRARIAN_TOKEN>"
```
**Expected (200):**
```json
{
  "success": true,
  "data": {
    "totalBooks": 150,
    "totalUsers": 50,
    "activeBorrows": 12,
    "overdueBooks": 3,
    "pendingRequests": 5,
    "availableBooks": 130,
    "totalEBooks": 20,
    "todayTransactions": 8
  }
}
```

#### ✅ 9.3 Category Distribution (any authenticated user)
```bash
curl http://localhost:4000/api/analytics/category-distribution \
  -H "Authorization: Bearer <STUDENT_TOKEN>"
```
**Expected (200):**
```json
{
  "success": true,
  "data": [
    { "name": "Computer Science", "count": 45 },
    { "name": "Mathematics", "count": 30 }
  ]
}
```

---

## 10. Policies (Librarian)

| #  | Method | Route | Auth | Role | Description | Body |
|----|--------|-------|------|------|-------------|------|
| 10.1 | **GET** | `/api/policies` | Yes | LIBRARIAN | List all policies | — |
| 10.2 | **GET** | `/api/policies/:key` | Yes | LIBRARIAN | Get a specific policy | — |
| 10.3 | **PUT** | `/api/policies` | Yes | LIBRARIAN | Upsert a policy | `{ key, value, description? }` |
| 10.4 | **DELETE** | `/api/policies/:key` | Yes | LIBRARIAN | Delete a policy | — |

### Sample Requests

#### ✅ 10.3 Create/Update Policy
```bash
curl -X PUT http://localhost:4000/api/policies \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <LIBRARIAN_TOKEN>" \
  -d '{
    "key": "MAX_BORROW_DAYS",
    "value": "14",
    "description": "Maximum number of days a book can be borrowed"
  }'
```

---

## 11. Reports (Librarian)

| #  | Method | Route | Auth | Role | Description |
|----|--------|-------|------|------|-------------|
| 11.1 | **GET** | `/api/reports/:type` | Yes | LIBRARIAN | Generate a report by type |

### Sample Requests

#### ✅ 11.1 Generate Report
```bash
curl "http://localhost:4000/api/reports/borrowing?startDate=2025-01-01&endDate=2025-12-31" \
  -H "Authorization: Bearer <LIBRARIAN_TOKEN>"
```
**Expected (200):** Report data (structure depends on report type).

---

## 12. Activity Logs

| #  | Method | Route | Auth | Role | Description | Query |
|----|--------|-------|------|------|-------------|-------|
| 12.1 | **GET** | `/api/activities` | Yes | ANY | List activity logs | `?page=1&limit=20` |
| 12.2 | **GET** | `/api/activities/actions` | Yes | ANY | Get distinct action types | — |
| 12.3 | **GET** | `/api/activities/:id` | Yes | ANY | Get single activity log | — |

---

## 13. Notifications

| #  | Method | Route | Auth | Role | Description | Body |
|----|--------|-------|------|------|-------------|------|
| 13.1 | **GET** | `/api/notifications` | Yes | ANY | List user's notifications | `?page=1&limit=20` |
| 13.2 | **GET** | `/api/notifications/unread-count` | Yes | ANY | Count unread notifications | — |
| 13.3 | **PUT** | `/api/notifications/:id/read` | Yes | ANY | Mark one as read | — |
| 13.4 | **PUT** | `/api/notifications/mark-all-read` | Yes | ANY | Mark all as read | — |
| 13.5 | **DELETE** | `/api/notifications/:id` | Yes | ANY | Delete a notification | — |

---

## 14. Health Check

```bash
curl http://localhost:4000/api/health
```
**Expected (200):**
```json
{
  "status": "ok",
  "timestamp": "2025-01-01T00:00:00.000Z"
}
```

---

## 15. How to Test Protected Routes

### Step 1: Register or Login to Get Tokens

```bash
# Register a student
curl -X POST http://localhost:4000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"firstName":"Test","lastName":"Student","email":"test.student@example.com","password":"test1234"}'

# Login as student
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test.student@example.com","password":"test1234"}'

# Login as librarian (must be created by another librarian first)
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"maria.santos@library.com","password":"librarian123"}'
```

### Step 2: Extract Tokens

From the login response, you'll get:
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "a1b2c3d4e5..."
}
```

### Step 3: Use the Access Token

For authenticated routes, add the `Authorization` header:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

### Step 4: Token Refresh (when expired)

Access tokens expire in **15 minutes**. Use the refresh token to get a new one:
```bash
curl -X POST http://localhost:4000/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refreshToken": "a1b2c3d4e5..."}'
```

### Step 5: Role-Based Access Summary

| Role | Can Access |
|------|-----------|
| **STUDENT** | `/auth/me`, `/auth/change-password`, `/auth/logout*`, `/books*` (read), `/ebooks*` (read), `/categories*` (read), `/transactions/requests` (own), `/transactions` (own), `/transactions/:id/pay-fine`, `/reservations*` (own), `/analytics/category-distribution`, `/activities*`, `/notifications*` |
| **FACULTY** | Same as STUDENT |
| **LIBRARIAN** | Everything above + `/auth/users*`, `/auth/admin/users`, `/auth/users/:id/toggle-status`, `/books*` (CRUD), `/ebooks*` (CRUD), `/categories*` (CRUD), `/transactions/requests/:id/approve`, `/transactions/requests/:id/reject`, `/transactions/:id/return`, `/transactions/check-overdue`, `/analytics/dashboard`, `/analytics/monthly-trends`, `/policies*`, `/reports*` |

---

## 16. Postman / Thunder Client Collection JSON

Below is a complete importable JSON collection. Copy this into Postman (Import → Raw Text) or Thunder Client (Import → Paste JSON):

```json
{
  "info": {
    "name": "CPCLMS v3 - Library API",
    "description": "Complete API collection for the Smart Library Management System",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "auth": {
    "type": "bearer",
    "bearer": [
      { "key": "token", "value": "", "type": "string" }
    ]
  },
  "variable": [
    { "key": "baseUrl", "value": "http://localhost:4000/api" },
    { "key": "studentToken", "value": "" },
    { "key": "librarianToken", "value": "" },
    { "key": "bookId", "value": "" },
    { "key": "requestId", "value": "" },
    { "key": "transactionId", "value": "" },
    { "key": "categoryId", "value": "" },
    { "key": "userId", "value": "" }
  ],
  "item": [
    {
      "name": "🛡️ Authentication",
      "item": [
        { "name": "Register Student", "request": { "method": "POST", "header": [{"key":"Content-Type","value":"application/json"}], "body": {"mode":"raw","raw":"{\n  \"firstName\": \"Juan\",\n  \"lastName\": \"Dela Cruz\",\n  \"email\": \"juan@example.com\",\n  \"password\": \"password123\",\n  \"department\": \"BSIT\",\n  \"yearSection\": \"3-BSIT\"\n}"}, "url": {"raw":"{{baseUrl}}/auth/register","host":["{{baseUrl}}"],"path":["auth","register"]} } },
        { "name": "Login", "request": { "method": "POST", "header": [{"key":"Content-Type","value":"application/json"}], "body": {"mode":"raw","raw":"{\n  \"email\": \"juan@example.com\",\n  \"password\": \"password123\"\n}"}, "url": {"raw":"{{baseUrl}}/auth/login","host":["{{baseUrl}}"],"path":["auth","login"]} } },
        { "name": "Refresh Token", "request": { "method": "POST", "header": [{"key":"Content-Type","value":"application/json"}], "body": {"mode":"raw","raw":"{\n  \"refreshToken\": \"YOUR_REFRESH_TOKEN\"\n}"}, "url": {"raw":"{{baseUrl}}/auth/refresh","host":["{{baseUrl}}"],"path":["auth","refresh"]} } },
        { "name": "Get My Profile", "request": { "method": "GET", "url": {"raw":"{{baseUrl}}/auth/me","host":["{{baseUrl}}"],"path":["auth","me"]} } },
        { "name": "Change Password", "request": { "method": "PUT", "header": [{"key":"Content-Type","value":"application/json"}], "body": {"mode":"raw","raw":"{\n  \"currentPassword\": \"password123\",\n  \"newPassword\": \"newpass456\"\n}"}, "url": {"raw":"{{baseUrl}}/auth/change-password","host":["{{baseUrl}}"],"path":["auth","change-password"]} } },
        { "name": "Logout", "request": { "method": "POST", "header": [{"key":"Content-Type","value":"application/json"}], "body": {"mode":"raw","raw":"{\n  \"refreshToken\": \"YOUR_REFRESH_TOKEN\"\n}"}, "url": {"raw":"{{baseUrl}}/auth/logout","host":["{{baseUrl}}"],"path":["auth","logout"]} } },
        { "name": "Logout All Sessions", "request": { "method": "POST", "url": {"raw":"{{baseUrl}}/auth/logout-all","host":["{{baseUrl}}"],"path":["auth","logout-all"]} } }
      ]
    },
    {
      "name": "👥 User Management (Librarian)",
      "item": [
        { "name": "List Users", "request": { "method": "GET", "url": {"raw":"{{baseUrl}}/auth/users?page=1&limit=20","host":["{{baseUrl}}"],"path":["auth","users"],"query":[{"key":"page","value":"1"},{"key":"limit","value":"20"}]} } },
        { "name": "Create User (Librarian)", "request": { "method": "POST", "header": [{"key":"Content-Type","value":"application/json"}], "body": {"mode":"raw","raw":"{\n  \"firstName\": \"Maria\",\n  \"lastName\": \"Santos\",\n  \"email\": \"maria.santos@library.com\",\n  \"password\": \"librarian123\",\n  \"role\": \"LIBRARIAN\",\n  \"department\": \"Library\"\n}"}, "url": {"raw":"{{baseUrl}}/auth/admin/users","host":["{{baseUrl}}"],"path":["auth","admin","users"]} } },
        { "name": "Toggle User Status", "request": { "method": "PATCH", "url": {"raw":"{{baseUrl}}/auth/users/{{userId}}/toggle-status","host":["{{baseUrl}}"],"path":["auth","users","{{userId}}","toggle-status"]} } }
      ]
    },
    {
      "name": "📚 Books",
      "item": [
        { "name": "List All Books", "request": { "method": "GET", "url": {"raw":"{{baseUrl}}/books?page=1&limit=10","host":["{{baseUrl}}"],"path":["books"],"query":[{"key":"page","value":"1"},{"key":"limit","value":"10"}]} } },
        { "name": "Get Book by ID", "request": { "method": "GET", "url": {"raw":"{{baseUrl}}/books/{{bookId}}","host":["{{baseUrl}}"],"path":["books","{{bookId}}"]} } },
        { "name": "Search Books", "request": { "method": "GET", "url": {"raw":"{{baseUrl}}/books?search=algorithms&status=AVAILABLE","host":["{{baseUrl}}"],"path":["books"],"query":[{"key":"search","value":"algorithms"},{"key":"status","value":"AVAILABLE"}]} } },
        { "name": "Create Book (Librarian)", "request": { "method": "POST", "header": [{"key":"Content-Type","value":"application/json"}], "body": {"mode":"raw","raw":"{\n  \"isbn\": \"978-3-16-148410-0\",\n  \"accessionNo\": \"ACC-2025-0001\",\n  \"title\": \"Introduction to Algorithms\",\n  \"author\": \"Thomas H. Cormen\",\n  \"publisher\": \"MIT Press\",\n  \"publishYear\": 2009,\n  \"edition\": \"3rd\",\n  \"pages\": 1312,\n  \"description\": \"Comprehensive guide to algorithms\",\n  \"language\": \"English\",\n  \"shelf\": \"A\",\n  \"row\": \"1\",\n  \"copies\": 3\n}"}, "url": {"raw":"{{baseUrl}}/books","host":["{{baseUrl}}"],"path":["books"]} } },
        { "name": "Update Book (Librarian)", "request": { "method": "PUT", "header": [{"key":"Content-Type","value":"application/json"}], "body": {"mode":"raw","raw":"{\n  \"copies\": 5,\n  \"status\": \"AVAILABLE\"\n}"}, "url": {"raw":"{{baseUrl}}/books/{{bookId}}","host":["{{baseUrl}}"],"path":["books","{{bookId}}"]} } },
        { "name": "Delete Book (Librarian)", "request": { "method": "DELETE", "url": {"raw":"{{baseUrl}}/books/{{bookId}}","host":["{{baseUrl}}"],"path":["books","{{bookId}}"]} } }
      ]
    },
    {
      "name": "🏷️ Categories",
      "item": [
        { "name": "List Categories", "request": { "method": "GET", "url": {"raw":"{{baseUrl}}/categories","host":["{{baseUrl}}"],"path":["categories"]} } },
        { "name": "Get Category", "request": { "method": "GET", "url": {"raw":"{{baseUrl}}/categories/{{categoryId}}","host":["{{baseUrl}}"],"path":["categories","{{categoryId}}"]} } },
        { "name": "Create Category (Librarian)", "request": { "method": "POST", "header": [{"key":"Content-Type","value":"application/json"}], "body": {"mode":"raw","raw":"{\n  \"name\": \"Computer Science\",\n  \"slug\": \"computer-science\",\n  \"description\": \"Books about computing and programming\"\n}"}, "url": {"raw":"{{baseUrl}}/categories","host":["{{baseUrl}}"],"path":["categories"]} } },
        { "name": "Update Category (Librarian)", "request": { "method": "PUT", "header": [{"key":"Content-Type","value":"application/json"}], "body": {"mode":"raw","raw":"{\n  \"name\": \"Computer Science & Programming\"\n}"}, "url": {"raw":"{{baseUrl}}/categories/{{categoryId}}","host":["{{baseUrl}}"],"path":["categories","{{categoryId}}"]} } },
        { "name": "Delete Category (Librarian)", "request": { "method": "DELETE", "url": {"raw":"{{baseUrl}}/categories/{{categoryId}}","host":["{{baseUrl}}"],"path":["categories","{{categoryId}}"]} } }
      ]
    },
    {
      "name": "📖 E-Books",
      "item": [
        { "name": "List E-Books", "request": { "method": "GET", "url": {"raw":"{{baseUrl}}/ebooks?page=1&limit=10","host":["{{baseUrl}}"],"path":["ebooks"],"query":[{"key":"page","value":"1"},{"key":"limit","value":"10"}]} } },
        { "name": "Get E-Book", "request": { "method": "GET", "url": {"raw":"{{baseUrl}}/ebooks/{{ebookId}}","host":["{{baseUrl}}"],"path":["ebooks","{{ebookId}}"]} } },
        { "name": "Create E-Book (Librarian)", "request": { "method": "POST", "header": [{"key":"Content-Type","value":"application/json"}], "body": {"mode":"raw","raw":"{\n  \"isbn\": \"978-0-13-110362-7\",\n  \"title\": \"The C Programming Language\",\n  \"author\": \"Brian Kernighan\",\n  \"publisher\": \"Prentice Hall\",\n  \"publishYear\": 1988,\n  \"fileUrl\": \"https://example.com/ebooks/c-programming.pdf\",\n  \"format\": \"PDF\",\n  \"fileSize\": 5242880\n}"}, "url": {"raw":"{{baseUrl}}/ebooks","host":["{{baseUrl}}"],"path":["ebooks"]} } },
        { "name": "Update E-Book (Librarian)", "request": { "method": "PUT", "header": [{"key":"Content-Type","value":"application/json"}], "body": {"mode":"raw","raw":"{\n  \"title\": \"The C Programming Language (2nd Ed.)\"\n}"}, "url": {"raw":"{{baseUrl}}/ebooks/{{ebookId}}","host":["{{baseUrl}}"],"path":["ebooks","{{ebookId}}"]} } },
        { "name": "Delete E-Book (Librarian)", "request": { "method": "DELETE", "url": {"raw":"{{baseUrl}}/ebooks/{{ebookId}}","host":["{{baseUrl}}"],"path":["ebooks","{{ebookId}}"]} } }
      ]
    },
    {
      "name": "🔄 Borrow Requests",
      "item": [
        { "name": "Submit Borrow Request", "request": { "method": "POST", "header": [{"key":"Content-Type","value":"application/json"}], "body": {"mode":"raw","raw":"{\n  \"bookId\": \"{{bookId}}\",\n  \"notes\": \"Need for research paper\"\n}"}, "url": {"raw":"{{baseUrl}}/transactions/requests","host":["{{baseUrl}}"],"path":["transactions","requests"]} } },
        { "name": "List Borrow Requests", "request": { "method": "GET", "url": {"raw":"{{baseUrl}}/transactions/requests?page=1&limit=10&status=PENDING","host":["{{baseUrl}}"],"path":["transactions","requests"],"query":[{"key":"page","value":"1"},{"key":"limit","value":"10"},{"key":"status","value":"PENDING"}]} } },
        { "name": "Approve Request (Librarian)", "request": { "method": "PUT", "header": [{"key":"Content-Type","value":"application/json"}], "body": {"mode":"raw","raw":"{}"}, "url": {"raw":"{{baseUrl}}/transactions/requests/{{requestId}}/approve","host":["{{baseUrl}}"],"path":["transactions","requests","{{requestId}}","approve"]} } },
        { "name": "Reject Request (Librarian)", "request": { "method": "PUT", "header": [{"key":"Content-Type","value":"application/json"}], "body": {"mode":"raw","raw":"{\n  \"reason\": \"Book is currently under maintenance\"\n}"}, "url": {"raw":"{{baseUrl}}/transactions/requests/{{requestId}}/reject","host":["{{baseUrl}}"],"path":["transactions","requests","{{requestId}}","reject"]} } }
      ]
    },
    {
      "name": "📋 Transactions",
      "item": [
        { "name": "List Transactions", "request": { "method": "GET", "url": {"raw":"{{baseUrl}}/transactions?page=1&limit=10&status=ACTIVE","host":["{{baseUrl}}"],"path":["transactions"],"query":[{"key":"page","value":"1"},{"key":"limit","value":"10"},{"key":"status","value":"ACTIVE"}]} } },
        { "name": "Get Transaction", "request": { "method": "GET", "url": {"raw":"{{baseUrl}}/transactions/{{transactionId}}","host":["{{baseUrl}}"],"path":["transactions","{{transactionId}}"]} } },
        { "name": "My Active Borrow Count", "request": { "method": "GET", "url": {"raw":"{{baseUrl}}/transactions/my-count","host":["{{baseUrl}}"],"path":["transactions","my-count"]} } },
        { "name": "Return Book (Librarian)", "request": { "method": "PUT", "header": [{"key":"Content-Type","value":"application/json"}], "body": {"mode":"raw","raw":"{}"}, "url": {"raw":"{{baseUrl}}/transactions/{{transactionId}}/return","host":["{{baseUrl}}"],"path":["transactions","{{transactionId}}","return"]} } },
        { "name": "Pay Fine", "request": { "method": "PUT", "header": [{"key":"Content-Type","value":"application/json"}], "body": {"mode":"raw","raw":"{\n  \"amount\": 50\n}"}, "url": {"raw":"{{baseUrl}}/transactions/{{transactionId}}/pay-fine","host":["{{baseUrl}}"],"path":["transactions","{{transactionId}}","pay-fine"]} } },
        { "name": "Check Overdue (Librarian)", "request": { "method": "POST", "url": {"raw":"{{baseUrl}}/transactions/check-overdue","host":["{{baseUrl}}"],"path":["transactions","check-overdue"]} } }
      ]
    },
    {
      "name": "📌 Reservations",
      "item": [
        { "name": "Reserve Book", "request": { "method": "POST", "header": [{"key":"Content-Type","value":"application/json"}], "body": {"mode":"raw","raw":"{\n  \"bookId\": \"{{bookId}}\"\n}"}, "url": {"raw":"{{baseUrl}}/reservations","host":["{{baseUrl}}"],"path":["reservations"]} } },
        { "name": "List Reservations", "request": { "method": "GET", "url": {"raw":"{{baseUrl}}/reservations?page=1&limit=10","host":["{{baseUrl}}"],"path":["reservations"],"query":[{"key":"page","value":"1"},{"key":"limit","value":"10"}]} } },
        { "name": "Cancel Reservation", "request": { "method": "PUT", "url": {"raw":"{{baseUrl}}/reservations/{{reservationId}}/cancel","host":["{{baseUrl}}"],"path":["reservations","{{reservationId}}","cancel"]} } }
      ]
    },
    {
      "name": "📊 Analytics & Dashboard",
      "item": [
        { "name": "Dashboard Stats (Librarian)", "request": { "method": "GET", "url": {"raw":"{{baseUrl}}/analytics/dashboard","host":["{{baseUrl}}"],"path":["analytics","dashboard"]} } },
        { "name": "Monthly Trends (Librarian)", "request": { "method": "GET", "url": {"raw":"{{baseUrl}}/analytics/monthly-trends?months=6","host":["{{baseUrl}}"],"path":["analytics","monthly-trends"],"query":[{"key":"months","value":"6"}]} } },
        { "name": "Category Distribution", "request": { "method": "GET", "url": {"raw":"{{baseUrl}}/analytics/category-distribution","host":["{{baseUrl}}"],"path":["analytics","category-distribution"]} } }
      ]
    },
    {
      "name": "⚙️ Policies (Librarian)",
      "item": [
        { "name": "List Policies", "request": { "method": "GET", "url": {"raw":"{{baseUrl}}/policies","host":["{{baseUrl}}"],"path":["policies"]} } },
        { "name": "Get Policy by Key", "request": { "method": "GET", "url": {"raw":"{{baseUrl}}/policies/MAX_BORROW_DAYS","host":["{{baseUrl}}"],"path":["policies","MAX_BORROW_DAYS"]} } },
        { "name": "Upsert Policy", "request": { "method": "PUT", "header": [{"key":"Content-Type","value":"application/json"}], "body": {"mode":"raw","raw":"{\n  \"key\": \"MAX_BORROW_DAYS\",\n  \"value\": \"14\",\n  \"description\": \"Maximum number of days a book can be borrowed\"\n}"}, "url": {"raw":"{{baseUrl}}/policies","host":["{{baseUrl}}"],"path":["policies"]} } },
        { "name": "Delete Policy", "request": { "method": "DELETE", "url": {"raw":"{{baseUrl}}/policies/MAX_BORROW_DAYS","host":["{{baseUrl}}"],"path":["policies","MAX_BORROW_DAYS"]} } }
      ]
    },
    {
      "name": "📈 Reports (Librarian)",
      "item": [
        { "name": "Generate Report", "request": { "method": "GET", "url": {"raw":"{{baseUrl}}/reports/borrowing?startDate=2025-01-01&endDate=2025-12-31","host":["{{baseUrl}}"],"path":["reports","borrowing"],"query":[{"key":"startDate","value":"2025-01-01"},{"key":"endDate","value":"2025-12-31"}]} } }
      ]
    },
    {
      "name": "📜 Activity Logs",
      "item": [
        { "name": "List Activity Logs", "request": { "method": "GET", "url": {"raw":"{{baseUrl}}/activities?page=1&limit=20","host":["{{baseUrl}}"],"path":["activities"],"query":[{"key":"page","value":"1"},{"key":"limit","value":"20"}]} } },
        { "name": "Get Distinct Actions", "request": { "method": "GET", "url": {"raw":"{{baseUrl}}/activities/actions","host":["{{baseUrl}}"],"path":["activities","actions"]} } },
        { "name": "Get Activity Log", "request": { "method": "GET", "url": {"raw":"{{baseUrl}}/activities/{{activityId}}","host":["{{baseUrl}}"],"path":["activities","{{activityId}}"]} } }
      ]
    },
    {
      "name": "🔔 Notifications",
      "item": [
        { "name": "List Notifications", "request": { "method": "GET", "url": {"raw":"{{baseUrl}}/notifications?page=1&limit=20","host":["{{baseUrl}}"],"path":["notifications"],"query":[{"key":"page","value":"1"},{"key":"limit","value":"20"}]} } },
        { "name": "Unread Count", "request": { "method": "GET", "url": {"raw":"{{baseUrl}}/notifications/unread-count","host":["{{baseUrl}}"],"path":["notifications","unread-count"]} } },
        { "name": "Mark as Read", "request": { "method": "PUT", "url": {"raw":"{{baseUrl}}/notifications/{{notificationId}}/read","host":["{{baseUrl}}"],"path":["notifications","{{notificationId}}","read"]} } },
        { "name": "Mark All as Read", "request": { "method": "PUT", "url": {"raw":"{{baseUrl}}/notifications/mark-all-read","host":["{{baseUrl}}"],"path":["notifications","mark-all-read"]} } },
        { "name": "Delete Notification", "request": { "method": "DELETE", "url": {"raw":"{{baseUrl}}/notifications/{{notificationId}}","host":["{{baseUrl}}"],"path":["notifications","{{notificationId}}"]} } }
      ]
    },
    {
      "name": "❤️ Health",
      "item": [
        { "name": "Health Check", "request": { "method": "GET", "url": {"raw":"{{baseUrl}}/health","host":["{{baseUrl}}"],"path":["health"]} } }
      ]
    }
  ]
}
```

---

## Quick Start: End-to-End Test Workflow (curl)

```bash
# 1. Health Check
curl http://localhost:4000/api/health

# 2. Register a Student
curl -s -X POST http://localhost:4000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"firstName":"Test","lastName":"User","email":"test@test.com","password":"test1234"}' \
  | jq .

# 3. Login as that Student (save tokens)
TOKEN=$(curl -s -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test1234"}' \
  | jq -r '.data.accessToken')

# 4. Get your profile (student)
curl http://localhost:4000/api/auth/me -H "Authorization: Bearer $TOKEN" | jq .

# 5. List public books
curl "http://localhost:4000/api/books?page=1&limit=5" | jq .

# 6. Try librarian-only route — should get 403
curl http://localhost:4000/api/analytics/dashboard -H "Authorization: Bearer $TOKEN" | jq .

# 7. Register / Login as a Librarian (if librarian was created)
LIBTOKEN=$(curl -s -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"maria.santos@library.com","password":"librarian123"}' \
  | jq -r '.data.accessToken')

# 8. Dashboard stats (librarian)
curl http://localhost:4000/api/analytics/dashboard -H "Authorization: Bearer $LIBTOKEN" | jq .

# 9. List all users (librarian)
curl http://localhost:4000/api/auth/users -H "Authorization: Bearer $LIBTOKEN" | jq .
```

---

## Error Response Reference

All API errors follow this format:
```json
{
  "success": false,
  "error": "Human-readable error message"
}
```

| HTTP Status | Meaning | Common Causes |
|-------------|---------|--------------|
| **400** | Bad Request | Validation errors (Zod), missing required fields |
| **401** | Unauthorized | Missing/expired/invalid JWT, wrong credentials |
| **403** | Forbidden | Insufficient role permissions |
| **404** | Not Found | Resource not found by ID |
| **409** | Conflict | Duplicate email, duplicate reservation |
| **429** | Too Many Requests | Rate limit exceeded |
| **500** | Internal Server Error | Server-side failure (check logs) |

---

## Rate Limiting

- **Auth endpoints** (`/api/auth/login`, `/api/auth/register`, `/api/auth/refresh`): Stricter rate limit (authLimiter)
- **All other API routes**: 100 requests per 15-minute window (configurable via `RATE_LIMIT_MAX` env var)

If rate-limited, you'll get:
```json
{
  "success": false,
  "error": "Too many requests, please try again later."
}
```
Status code: **429**

