# OutreachCRM - Cold Email Outreach Management System

## Table of Contents

1. [Project Overview](#project-overview)
2. [Tech Stack](#tech-stack)
3. [Project Structure](#project-structure)
4. [Getting Started](#getting-started)
5. [Environment Variables](#environment-variables)
6. [Backend Architecture](#backend-architecture)
   - [Server & Database](#server--database)
   - [Data Model](#data-model)
   - [API Endpoints](#api-endpoints)
   - [Controllers](#controllers)
   - [AI Email Generation (Groq)](#ai-email-generation-groq)
   - [Email Service (Nodemailer)](#email-service-nodemailer)
   - [Utilities](#utilities)
7. [Frontend Architecture](#frontend-architecture)
   - [Pages](#pages)
   - [Components](#components)
   - [Hooks](#hooks)
   - [API Client](#api-client)
8. [Core Features](#core-features)
   - [CSV Import](#csv-import)
   - [Contact Management](#contact-management)
   - [Search & Filtering](#search--filtering)
   - [Bulk Actions](#bulk-actions)
   - [AI-Personalized Email Sending](#ai-personalized-email-sending)
   - [Follow-up System](#follow-up-system)
9. [Email Sending Flow](#email-sending-flow)
10. [Security & Safety](#security--safety)
11. [Future Improvements](#future-improvements)

---

## Project Overview

OutreachCRM is a full-stack cold-email outreach management dashboard built for managing and automating personalized email campaigns. It is designed to function like a lightweight CRM (similar to Apollo, HubSpot, or Instantly) with the following core capabilities:

- **Import** contacts from Apollo CSV exports
- **Manage** contacts with advanced filtering, sorting, searching, and pagination
- **Generate** personalized cold emails using AI (Groq/LLaMA)
- **Send** emails and follow-ups via Gmail (Nodemailer)
- **Track** outreach status, replies, bounces, and engagement per contact
- **Bulk operate** on selected/filtered contacts (status updates, email sends, flags)

The system is designed for a single-user workflow — Rishikesh Kumar Yadav's internship outreach campaign — but the architecture is extensible for multi-user or team use.

---

## Tech Stack

| Layer       | Technology                                      |
| ----------- | ----------------------------------------------- |
| **Frontend** | React 19, Vite 8, TailwindCSS 4, React Router 7 |
| **Backend**  | Node.js, Express 5, Mongoose 8                  |
| **Database** | MongoDB Atlas                                   |
| **AI**       | Groq API (LLaMA 3.3 70B Versatile)              |
| **Email**    | Nodemailer (Gmail SMTP)                          |
| **Icons**    | Lucide React                                     |
| **Notifications** | React Hot Toast                             |

---

## Project Structure

```
my-emil-contact-project/
├── package.json              # Root - runs frontend + backend concurrently
├── .gitignore
├── plan.txt                  # Original project requirements
│
├── backend/
│   ├── package.json
│   ├── server.js             # Express app entry point, CSV upload, DB connection
│   │
│   ├── models/
│   │   └── Contacts.js       # Mongoose schema (50+ fields)
│   │
│   ├── routes/
│   │   ├── contact.router.js # All contact & email action routes
│   │   └── email.router.js   # Legacy email route
│   │
│   ├── controller/
│   │   ├── contact.controller.js      # CRUD, search, filter, stats, bulk update
│   │   ├── emailAction.controller.js  # Send emails & follow-ups to contacts
│   │   ├── sendEmail.controller.js    # Legacy/test controller
│   │   └── migration.js              # One-time DB migration script
│   │
│   ├── ai-service/
│   │   ├── groqservice.js         # Groq API integration for email generation
│   │   ├── prompt.js              # AI prompt template
│   │   ├── extractJsonFromModel.js # Robust JSON parser for AI responses
│   │   ├── service.js             # Test harness for AI service
│   │   └── placeholder.emal.js    # Empty placeholder
│   │
│   ├── email-service/
│   │   ├── index.js               # Nodemailer transporter & send function
│   │   └── email.body.format.js   # Email body formatter with signature
│   │
│   ├── utils/
│   │   └── blockedDomains.js      # Domain blacklist (gov, mil, personal email)
│   │
│   └── uploads/                   # Temporary CSV upload directory
│
└── frontend/
    ├── package.json
    ├── vite.config.js
    ├── index.html
    │
    └── src/
        ├── main.jsx           # React entry point
        ├── App.jsx            # Router setup (/ and /contacts/:id)
        ├── api.js             # API client (all backend calls)
        │
        ├── hooks/
        │   └── useContacts.js # Custom hook: pagination, search, filter state
        │
        ├── pages/
        │   ├── Dashboard.jsx       # Main page: table, filters, bulk actions, stats
        │   └── ContactDetail.jsx   # Single contact view with full info & actions
        │
        └── components/
            ├── Layout.jsx            # App shell with navbar
            ├── ContactTable.jsx      # Data table with sort, select, pagination
            ├── FilterPanel.jsx       # Advanced filter UI (4 filter groups)
            ├── BulkActions.jsx       # Sticky action bar for selected contacts
            ├── StatsBar.jsx          # Dashboard summary cards
            ├── EmailSendingModal.jsx # Email send progress & results modal
            └── UploadModal.jsx       # CSV drag-and-drop upload modal
```

---

## Getting Started

### Prerequisites

- Node.js (v18+)
- MongoDB Atlas account (or local MongoDB instance)
- Gmail account with App Password enabled
- Groq API key

### Installation

```bash
# Clone the repo
git clone <repo-url>
cd my-emil-contact-project

# Install root dependencies (concurrently)
npm install

# Install backend dependencies
cd backend && npm install

# Install frontend dependencies
cd ../frontend && npm install
```

### Running the Project

```bash
# From the root directory - starts both frontend and backend
npm run dev

# Or run individually:
npm run dev:backend    # Backend only (Express on port 5000)
npm run dev:frontend   # Frontend only (Vite on port 5173)
```

---

## Environment Variables

Create a `.env` file in the `backend/` directory:

```env
GROQ_API_KEY=your_groq_api_key
EMAIL_USER=your_gmail@gmail.com
EMAIL_PASS=your_gmail_app_password
```

> **Note:** The MongoDB connection string is currently hardcoded in `server.js`. For production, move it to an environment variable.

---

## Backend Architecture

### Server & Database

**File:** `backend/server.js`

- Express app running on **port 5000**
- CORS configured for `http://localhost:5173` (Vite dev server)
- Connects to MongoDB Atlas via Mongoose
- Handles CSV file uploads at `POST /upload` using **multer** and **csv-parser**
- Routes:
  - `/upload` — CSV import endpoint
  - `/email` — Legacy email router
  - `/api/contacts` — Main contact router (all CRUD, filters, bulk, email actions)

### Data Model

**File:** `backend/models/Contacts.js`

The Contact schema is comprehensive, containing 50+ fields organized into these groups:

| Group | Fields | Description |
|-------|--------|-------------|
| **Identity** | firstName, lastName, title, email | Core contact info |
| **Company** | companyName, companyNameForEmails, industry, employees, website | Organization details |
| **Contact Info** | workDirectPhone, mobilePhone, homePhone, corporatePhone | Phone numbers |
| **Location** | city, state, country, companyAddress, companyCity, companyState, companyCountry | Geographic data |
| **Social** | personLinkedinUrl, companyLinkedinUrl, facebookUrl, twitterUrl | Social profiles |
| **Apollo Metadata** | apolloContactId, apolloAccountId, emailStatus, emailConfidence, departments, stage, lists | Apollo CRM export fields |
| **Secondary Emails** | secondaryEmail, tertiaryEmail (with status & source for each) | Additional email addresses |
| **Outreach Status** | outreachStatus (enum) | NOT_SENT, SENT, FOLLOWUP_PENDING, REPLIED_POSITIVE, REPLIED_NEGATIVE, NO_RESPONSE, CLOSED |
| **Reply Tracking** | reply.replied, reply.replyType, reply.replyMessage, reply.repliedAt | Reply status & details |
| **Follow-up Tracking** | followup.followupCount, followup.maxFollowups (default 3), followup.nextFollowupAt, followup.followupEnabled | Follow-up scheduling |
| **Email Stats** | emailStats.emailsSent, emailStats.opened, emailStats.openedCount, emailStats.lastOpenedAt | Engagement tracking |
| **Email History** | emails[] (type, subject, sentAt) | Record of all sent emails |
| **Flags** | flags.doNotContact, flags.bounced, flags.unsubscribe | Safety flags |
| **Notes** | notes | Free-text notes field |
| **Timestamps** | createdAt, updatedAt | Auto-managed by Mongoose |
| **Custom** | lastSentDate (defaults to 100 days ago) | Cooldown tracking |

### API Endpoints

| Method | Endpoint | Controller | Description |
|--------|----------|------------|-------------|
| `GET` | `/api/contacts` | getContacts | Paginated contact list with search |
| `GET` | `/api/contacts/stats` | getContactStats | Dashboard statistics |
| `GET` | `/api/contacts/filter` | filterContacts | Advanced multi-field filtering |
| `GET` | `/api/contacts/:id` | getContactById | Single contact details |
| `PATCH` | `/api/contacts/bulk` | bulkUpdateContacts | Bulk update multiple contacts |
| `PATCH` | `/api/contacts/:id` | updateContact | Update single contact |
| `POST` | `/api/contacts/emails/send` | sendToContacts | Send AI-personalized emails |
| `POST` | `/api/contacts/emails/followup` | sendFollowup | Send follow-up emails |
| `POST` | `/upload` | (inline in server.js) | CSV file import |

### Controllers

#### contact.controller.js

**`getContacts()`** — Paginated listing with optional search
- Query params: `page`, `limit`, `sort`, `search`, `fields`
- Search performs case-insensitive regex on: `firstName`, `lastName`, `email`, `companyName`
- Supports field projection for optimized queries

**`filterContacts()`** — Advanced filtering with 15+ filter parameters
- Supports all search fields plus:
  - `outreachStatus` (comma-separated for multi-select)
  - `replied`, `replyType`, `opened` (boolean/enum filters)
  - `followupCountMin/Max`, `emailsSentMin/Max` (range filters)
  - `doNotContact`, `bounced`, `unsubscribe` (flag filters)
  - `company`, `role` (regex text filters)
  - `dateFrom`, `dateTo` (date range on createdAt)

**`getContactStats()`** — Aggregated dashboard stats
- Returns: total contacts, status breakdown, replied count, bounced count, DNC count

**`bulkUpdateContacts()`** — Batch update by ID array
- Accepts `{ ids: [...], update: {...} }` body
- Uses MongoDB `$set` with validation

#### emailAction.controller.js

**`sendToContacts()`** — Primary email sending flow
1. Validates contact IDs
2. Skips contacts with `doNotContact`, `bounced`, or `unsubscribe` flags
3. Checks against blocked domain list
4. Calls Groq AI to generate personalized email for each contact
5. Formats email body with signature via `email.body.format.js`
6. Sends via Nodemailer
7. Updates contact: `lastSentDate`, `outreachStatus → SENT`, `emailStats.emailsSent++`, appends to `emails[]`
8. Rate limits: **15-second delay** between emails (for multiple recipients)
9. Returns `{ sent: [...], failed: [...], skipped: [...] }`

**`sendFollowup()`** — Follow-up email flow
- Same as above but with additional checks:
  - `followupEnabled` must be `true`
  - `followupCount` must be less than `maxFollowups` (default 3)
- Sets `outreachStatus → FOLLOWUP_PENDING`
- Schedules `nextFollowupAt` (3 days from now)
- Increments `followupCount`
- Rate limit: **5-second delay** between emails

### AI Email Generation (Groq)

**File:** `backend/ai-service/groqservice.js`

- Uses **Groq SDK** with the **LLaMA 3.3 70B Versatile** model
- Generates personalized cold emails based on contact data (name, company, title, industry)
- Configuration: `temperature: 0.7`, `max_tokens: 400`
- Returns JSON `{ subject, body }` parsed by `extractJsonFromModel()`

**File:** `backend/ai-service/prompt.js`

- Prompt instructs AI to write 3-line personalized internship emails
- Emphasizes: company appreciation, hackathon win, LeetCode/Codeforces ratings, full-stack skills

**File:** `backend/ai-service/extractJsonFromModel.js`

- Robust JSON extraction from AI responses
- Handles: markdown code fences, unbalanced brackets, raw newlines in strings
- Falls back to regex extraction if JSON.parse fails

### Email Service (Nodemailer)

**File:** `backend/email-service/index.js`

- Gmail SMTP transport via Nodemailer
- Uses `EMAIL_USER` and `EMAIL_PASS` from environment

**File:** `backend/email-service/email.body.format.js`

- Formats the AI-generated body with:
  - Greeting (firstName lastName)
  - AI-generated personalized content
  - Builder pitch paragraph
  - Signature with phone, resume link, LinkedIn

### Utilities

**File:** `backend/utils/blockedDomains.js`

- Maintains a blacklist of domains to prevent sending to:
  - Government domains (gov.in, gov.uk, gov.au, etc.)
  - Military domains (mil, mil.*)
  - Personal email providers (yahoo, hotmail, aol)
  - System addresses (noreply, example, test, localhost)
  - Internal/company domains (factoryjet, commerceflo)
- `isBlockedDomain(email)` — checks multi-level TLDs (e.g., `tax.gov.in` matches `gov.in`)

---

## Frontend Architecture

### Pages

#### Dashboard (`pages/Dashboard.jsx`)

The main page with the following sections:

1. **Stats Bar** — Summary cards (Total Contacts, Emails Sent, Replied, Bounced)
2. **Toolbar** — Search input (debounced 400ms), Filter toggle button, Import CSV button, Row count selector
3. **Filter Panel** — Expandable advanced filter form (4 groups of filters)
4. **Bulk Actions Bar** — Sticky bar when contacts are selected (Send Email, Follow-up, Status, Notes, Enable/Disable FU, Replied +/-, DNC)
5. **Contact Table** — Paginated, sortable data table with checkbox and drag selection
6. **Upload Modal** — CSV import with drag-and-drop

#### Contact Detail (`pages/ContactDetail.jsx`)

Full single-contact view split into two columns:

**Left Column (2/3):**
- Header with avatar, name, title, company, status badge
- Contact Information card (email, phone, company, website, location, industry, LinkedIn)
- Email History card (list of all sent emails with type badges and timestamps)
- Reply Info card (shown only if contact has replied)

**Right Sidebar (1/3):**
- Actions card (Send Email, Send Follow-up buttons)
- Status & Tracking card (status dropdown, stats grid, flag badges)
- Notes card (editable textarea with save)

### Components

| Component | Purpose |
|-----------|---------|
| **Layout** | App shell with sticky navbar, OutreachCRM branding, navigation links |
| **ContactTable** | Data table with sortable columns, checkbox selection, drag-select, column visibility toggle, pagination controls |
| **FilterPanel** | Advanced filter form with 4 groups: Status & Engagement, Activity & Metrics, Flags, Date Range |
| **BulkActions** | Sticky indigo action bar with email, follow-up, status, notes, flag, and reply action buttons |
| **StatsBar** | 4-column grid of stat cards with icons and color-coded left borders |
| **EmailSendingModal** | Two-phase modal: animated sending state → result view with sent/failed/skipped breakdown |
| **UploadModal** | Three-phase modal: file picker (drag-and-drop) → uploading progress → result summary |

### Hooks

#### useContacts (`hooks/useContacts.js`)

Central state management hook for the contact list:

| State | Type | Purpose |
|-------|------|---------|
| `contacts` | Array | Current page of contacts |
| `pagination` | Object | `{ page, limit, total, pages }` |
| `loading` | Boolean | Loading indicator |
| `params` | Object | `{ page, limit, sort }` |
| `filters` | Object | Active filter key-value pairs |
| `search` | String | Current search term |

| Method | Action |
|--------|--------|
| `setSearch(val)` | Updates search term, resets to page 1 |
| `setPage(page)` | Navigate to page |
| `setSort(sort)` | Change sort field/direction, resets to page 1 |
| `setLimit(limit)` | Change rows per page, resets to page 1 |
| `applyFilters(obj)` | Set filters (cleans empty values), resets to page 1 |
| `clearFilters()` | Remove all filters |
| `refetch()` | Manually re-fetch current view |

Automatically fetches data when `params`, `filters`, or `search` change. Routes to `api.filterContacts()` when filters are active, otherwise `api.getContacts()`.

### API Client

**File:** `frontend/src/api.js`

| Method | Endpoint | Description |
|--------|----------|-------------|
| `getContacts(params)` | `GET /api/contacts` | Paginated list with search |
| `filterContacts(params)` | `GET /api/contacts/filter` | Advanced filtered list |
| `getContact(id)` | `GET /api/contacts/:id` | Single contact |
| `updateContact(id, data)` | `PATCH /api/contacts/:id` | Update contact |
| `bulkUpdate(ids, update)` | `PATCH /api/contacts/bulk` | Bulk update |
| `sendEmails(contactIds)` | `POST /api/contacts/emails/send` | Send emails |
| `sendFollowups(contactIds)` | `POST /api/contacts/emails/followup` | Send follow-ups |
| `getStats()` | `GET /api/contacts/stats` | Dashboard stats |
| `uploadCSV(file)` | `POST /upload` | Import CSV file |

---

## Core Features

### CSV Import

1. User clicks "Import CSV" on the Dashboard
2. Drag-and-drop or file picker for `.csv` files
3. Backend parses CSV using `csv-parser`, maps headers to schema fields
4. Deduplication by `apolloContactId` or `email`
5. New contacts inserted into MongoDB
6. Returns count of inserted vs skipped rows

### Contact Management

- **View** all contacts in a paginated, sortable table
- **Search** by name, email, or company (debounced, real-time)
- **Sort** by any column (ascending/descending toggle)
- **Toggle columns** to show/hide specific fields
- **Click** any row to open the full Contact Detail page
- **Edit** status, notes, and flags from the detail page

### Search & Filtering

**Search bar** (always visible):
- Searches across: `firstName`, `lastName`, `email`, `companyName`
- Case-insensitive regex matching
- Debounced at 400ms for real-time results
- Also triggers on Enter key

**Advanced Filters** (expandable panel):

| Group | Filters |
|-------|---------|
| Status & Engagement | Outreach Status, Replied (Y/N), Reply Type, Email Opened (Y/N) |
| Activity & Metrics | Min Follow-up Count, Min Emails Sent, Company, Role/Title |
| Flags | Do Not Contact, Bounced, Unsubscribed |
| Date Range | Created From, Created To |

Search and filters work together — when filters are active, search is included in the filter query.

### Bulk Actions

Select contacts via checkboxes or drag-selection, then use the sticky action bar:

| Action | Effect |
|--------|--------|
| **Send Email** | Sends AI-personalized email to each selected contact |
| **Send Follow-up** | Sends follow-up email (respects max follow-up limits) |
| **Update Status** | Opens modal to pick new outreach status |
| **Update Notes** | Opens modal to add/edit notes |
| **Enable Follow-ups** | Sets `followup.followupEnabled = true` |
| **Disable Follow-ups** | Sets `followup.followupEnabled = false` |
| **Replied +** | Marks as replied positive, updates status |
| **Replied -** | Marks as replied negative, updates status |
| **DNC** | Sets `flags.doNotContact = true` |

### AI-Personalized Email Sending

Each email is uniquely generated per contact:

1. Contact data (name, company, title, industry) sent to Groq AI
2. AI generates a 3-line personalized cold email with custom subject line
3. Email body formatted with greeting, AI content, builder pitch, and signature
4. Sent via Gmail SMTP through Nodemailer
5. Contact record updated with send timestamp, email history entry, and status

### Follow-up System

- Each contact has a `maxFollowups` limit (default: 3)
- Follow-ups can be enabled/disabled per contact or in bulk
- Sending a follow-up:
  - Checks `followupEnabled === true` and `followupCount < maxFollowups`
  - Generates new AI-personalized follow-up
  - Increments `followupCount`
  - Schedules `nextFollowupAt` (3 days ahead)
  - Sets status to `FOLLOWUP_PENDING`

---

## Email Sending Flow

```
User selects contacts → Clicks "Send Email"
       │
       ▼
EmailSendingModal (sending phase - animated loader)
       │
       ▼
Backend: emailAction.controller.js → sendToContacts()
       │
       ├─ For each contact:
       │   ├─ Check flags (doNotContact, bounced, unsubscribe) → Skip if flagged
       │   ├─ Check blocked domains → Skip if blocked
       │   ├─ Call Groq AI → Generate personalized { subject, body }
       │   ├─ Format email body with signature
       │   ├─ Send via Nodemailer (Gmail SMTP)
       │   ├─ Update contact record (lastSentDate, status, emailStats, history)
       │   └─ Wait 15s before next email (rate limiting)
       │
       ▼
EmailSendingModal (result phase)
  ├─ Sent: list of successfully sent emails
  ├─ Failed: list with error messages
  └─ Skipped: list with reasons (flagged, blocked domain)
```

---

## Security & Safety

- **Domain Blacklist**: Prevents sending to government, military, personal email, and test domains
- **Flag System**: doNotContact, bounced, and unsubscribe flags automatically skip contacts during sends
- **Rate Limiting**: 15-second delay between emails (outreach), 5-second delay (follow-ups)
- **Follow-up Limits**: Maximum 3 follow-ups per contact (configurable)
- **Deduplication**: CSV import checks for existing contacts by apolloContactId or email
- **CORS**: Backend restricted to frontend origin (`localhost:5173`)
- **Input Validation**: Mongoose schema validators on updates

### Known Security Considerations

- MongoDB connection string is hardcoded in `server.js` — should be moved to `.env`
- No authentication/authorization system — single-user app
- No HTTPS in development — appropriate for local use only
- Gmail app passwords used for SMTP — standard practice for development

---

## Future Improvements

- **Authentication**: Add user login and API key management
- **Email Templates**: UI for creating and managing email templates
- **Scheduling**: Schedule emails for specific dates/times
- **Analytics Dashboard**: Open rates, reply rates, conversion funnel visualization
- **Webhook Integration**: Track email opens and bounces in real-time
- **Multi-user Support**: Team collaboration with role-based access
- **Move MongoDB URI to .env**: For better security practices
- **Testing**: Add unit and integration tests for controllers and services
