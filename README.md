# CaseFlow

**Import → Validate → Fix → Submit → Track**

A production-ready web application for operations teams to upload CSV files, validate and clean data in a rich grid, and bulk-create cases through an API.

![Next.js](https://img.shields.io/badge/Next.js-16-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-blue)
![Prisma](https://img.shields.io/badge/Prisma-6.0-green)

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    CaseFlow Architecture                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────┐     ┌──────────────┐     ┌──────────────┐     │
│  │   Browser    │     │   Next.js    │     │  PostgreSQL  │     │
│  │              │────▶│   Server     │────▶│   Database   │     │
│  │  React App   │◀────│  (API Routes)│◀────│              │     │
│  └──────────────┘     └──────────────┘     └──────────────┘     │
│         │                    │                                  │
│         │                    │                                  │
│  ┌──────▼──────┐     ┌──────▼──────┐                            │
│  │  Web Worker │     │   Prisma    │                            │
│  │ (CSV Parse) │     │    ORM      │                            │
│  └─────────────┘     └─────────────┘                            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Tech Stack

| Layer     | Technology                                    |
| --------- | --------------------------------------------- |
| Frontend  | React 18, Next.js 16 (App Router), TypeScript |
| State     | Zustand                                       |
| Data Grid | TanStack Table + TanStack Virtual             |
| Styling   | Tailwind CSS                                  |
| Backend   | Next.js API Routes                            |
| ORM       | Prisma 6                                      |
| Database  | PostgreSQL 16                                 |
| Auth      | NextAuth.js (Auth.js v5)                      |
| Testing   | Vitest, React Testing Library, Playwright     |

---

## 🚀 Quick Start

### Prerequisites

- Node.js 20+
- Docker & Docker Compose
- npm or pnpm

### One-Command Start (Docker Compose)

```bash
# Clone and start everything
docker compose up -d

# The app will be available at http://localhost:3000
```

### Local Development

```bash
# 1. Clone the repository
cd FullStackAssignment

# 2. Start the database
docker compose up db -d

# 3. Install dependencies
cd app && npm install

# 4. Copy environment file
cp .env.example .env

# 5. Run migrations
npx prisma migrate dev

# 6. Start the development server
npm run dev
```

The app will be running at **http://localhost:3000**

### Default Test Account

After starting, register a new account or use:

- Navigate to `/register` to create an account
- Email: any valid email
- Password: Must be 8+ chars with uppercase, lowercase, and number

---

## 📁 Project Structure

```
/app
  /src
    /app
      /api                  # API Routes
        /auth               # Authentication endpoints
        /cases              # Cases CRUD + batch
        /imports            # Import management
        /health             # Health check
      /(dashboard)          # Protected pages
        /dashboard          # Main dashboard
        /import             # CSV import flow
        /cases              # Cases list & details
        /imports            # Import history
      /login                # Login page
      /register             # Registration page
    /components
      /ui                   # Reusable UI components
      /import               # Import flow components
      /cases                # Cases components
    /lib
      /prisma.ts            # Prisma client singleton
      /auth.ts              # NextAuth configuration
      /validations.ts       # Zod schemas
    /state
      /store.ts             # Zustand stores
    /workers
      /csvParser.worker.ts  # Web Worker for CSV parsing
  /prisma
    schema.prisma           # Database schema
  /e2e                      # Playwright tests
/sample-data                # Sample CSV files
docker-compose.yml
README.md
```

---

## 🔑 Key Features

### 1. CSV Import with Rich Grid

- **Drag & drop upload** with progress indicator
- **50k+ row support** via virtualization (TanStack Virtual)
- **Inline editing** - click any cell to edit
- **Validation indicators** - red highlighting on errors
- **Column sorting and filtering**
- **Keyboard navigation** - Tab, Enter, Escape

### 2. Validation & Fix Helpers

- **Real-time validation** as you type
- **"Fix All" toolbar**:
  - Trim whitespace
  - Title case names
  - Normalize phone to E.164
  - Set default priority

### 3. Batch Processing

- **Chunked uploads** (100 rows/batch)
- **Progress tracking** with percentage
- **Retry failed batches**
- **Import report** with success/failure breakdown

### 4. Case Management

- **Cursor-based pagination** for performance
- **Advanced filtering** (status, category, priority, date range)
- **Full-text search**
- **Case details with history timeline**
- **Notes system**

---

## 📊 Performance Notes

### Handling 50k Rows

| Strategy           | Implementation                                |
| ------------------ | --------------------------------------------- |
| **CSV Parsing**    | PapaParse with streaming (future: Web Worker) |
| **Grid Rendering** | TanStack Virtual - only ~50 rows in DOM       |
| **Validation**     | Debounced, runs on all rows efficiently       |
| **Submission**     | 100-row batches, parallel (configurable)      |

### Benchmarks (Target)

| Operation      | Time    |
| -------------- | ------- |
| Parse 50k CSV  | < 3s    |
| Initial render | < 500ms |
| Cell edit      | < 16ms  |
| Scroll FPS     | 60      |

---

## 🔒 Security Notes

1. **Authentication**: NextAuth.js with JWT sessions
2. **Password Storage**: bcrypt with 12 rounds
3. **API Protection**: Session validation on all routes
4. **Input Validation**: Zod schemas on client & server
5. **SQL Injection**: Prevented by Prisma parameterized queries
6. **XSS Prevention**: React's built-in escaping
7. **Role-Based Access**: ADMIN vs OPERATOR roles

---

## 🧪 Testing

### Run Tests

```bash
# Unit & Component Tests
npm run test

# E2E Tests (requires app running)
npm run test:e2e

# Type Check
npm run type-check

# Lint
npm run lint
```

### Test Coverage

- **Component Tests**: DataGrid, CSVDropzone, BatchSubmit
- **API Tests**: Auth, Cases CRUD, Batch import
- **E2E Tests**: Full import flow

---

## 🌐 API Reference

### Authentication

| Endpoint                  | Method | Description       |
| ------------------------- | ------ | ----------------- |
| `/api/auth/register`      | POST   | Register new user |
| `/api/auth/[...nextauth]` | \*     | NextAuth handlers |

### Cases

| Endpoint               | Method | Description              |
| ---------------------- | ------ | ------------------------ |
| `/api/cases`           | GET    | List cases (paginated)   |
| `/api/cases`           | POST   | Create single case       |
| `/api/cases/batch`     | POST   | Batch create (up to 100) |
| `/api/cases/:id`       | GET    | Get case details         |
| `/api/cases/:id`       | PATCH  | Update case              |
| `/api/cases/:id`       | DELETE | Delete case (admin)      |
| `/api/cases/:id/notes` | POST   | Add note                 |

### Imports

| Endpoint           | Method | Description          |
| ------------------ | ------ | -------------------- |
| `/api/imports`     | GET    | List imports         |
| `/api/imports`     | POST   | Create import record |
| `/api/imports/:id` | GET    | Get import details   |
| `/api/imports/:id` | PATCH  | Update import status |

### Health

| Endpoint      | Method | Description  |
| ------------- | ------ | ------------ |
| `/api/health` | GET    | Health check |

---

## 🎨 Design Decisions & Tradeoffs

### Why TanStack Table + Virtual?

- **Pros**: Headless, full TypeScript support, no license fees, handles 50k+ rows
- **Cons**: More setup than AG Grid
- **Decision**: Worth the setup for full control and performance

### Why Zustand over Redux?

- **Pros**: Minimal boilerplate, great TypeScript support, small bundle
- **Cons**: Smaller ecosystem
- **Decision**: Perfect fit for this app's state complexity

### Why Cursor Pagination?

- **Pros**: Better performance, no COUNT(\*), consistent with large datasets
- **Cons**: No "page X of Y" UI
- **Decision**: Performance > page numbers for operations data

### Why Single Next.js App?

- **Pros**: Unified codebase, simpler deployment, shared types
- **Cons**: Can't scale FE/BE independently
- **Decision**: Acceptable for this use case, simplifies development

---

## 📦 Environment Variables

Create `.env` file in `/app`:

```env
# Database
DATABASE_URL="postgresql://caseflow:caseflow_secret@localhost:5432/caseflow"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-super-secret-key-change-in-production"
AUTH_SECRET="your-super-secret-key-change-in-production"

# App
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

---

## 🚢 Deployment

### Docker Deployment

```bash
# Build and run
docker compose up -d --build

# View logs
docker compose logs -f app
```

### Vercel Deployment

1. Connect your GitHub repo to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy!

### AWS Deployment (Optional)

The Dockerfile is configured for:

- Multi-stage builds
- Standalone output
- Production optimizations

Can be deployed to:

- AWS ECS/Fargate
- AWS Lambda (with adapter)
- EC2 with Docker

---

## 📝 Validation Rules

| Field          | Type   | Rules                                      |
| -------------- | ------ | ------------------------------------------ |
| case_id        | string | Required, unique, alphanumeric + hyphens   |
| applicant_name | string | Required, max 255 chars                    |
| dob            | date   | Required, ISO format, 1900–today           |
| email          | string | Optional, valid email format               |
| phone          | string | Optional, E.164 format (auto-normalized)   |
| category       | enum   | Required: TAX, LICENSE, PERMIT             |
| priority       | enum   | Optional: LOW, MEDIUM, HIGH (default: LOW) |

---

## 🧰 Development Commands

```bash
# Development
npm run dev           # Start dev server
npm run build         # Production build
npm run start         # Start production server

# Database
npx prisma migrate dev    # Run migrations
npx prisma studio         # Open Prisma Studio
npx prisma generate       # Generate Prisma Client

# Testing
npm run test              # Run unit tests
npm run test:e2e          # Run E2E tests
npm run test:coverage     # Coverage report

# Code Quality
npm run lint              # ESLint
npm run type-check        # TypeScript check
```

---

## 📄 License

MIT

---

## 👤 Author

Created for the CaseFlow Full-Stack Assignment.
