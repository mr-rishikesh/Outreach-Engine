# Email Contact Management System - Complete Architecture

## Table of Contents
1. [System Overview](#system-overview)
2. [Technology Stack](#technology-stack)
3. [System Architecture](#system-architecture)
4. [Database Schema](#database-schema)
5. [API Documentation](#api-documentation)
6. [Frontend Architecture](#frontend-architecture)
7. [Features & Implementation](#features--implementation)
8. [Data Flow](#data-flow)

---

## System Overview

The **Email Contact Management System** is a full-stack MERN (MongoDB, Express, React, Node.js) application designed for managing large contact databases, automating personalized email outreach, and tracking communication metrics. It combines AI-powered email generation with email campaign management.

### Key Capabilities
- **Bulk Contact Import** via CSV files
- **Contact Management** with advanced filtering and search
- **AI-Powered Email Generation** using Groq LLM
- **Email Campaign Management** with personalized outreach
- **Follow-up Automation** with intelligent scheduling
- **Communication Tracking** with detailed metrics
- **Dashboard Analytics** for campaign insights

---

## Technology Stack

### Frontend
- **React 19.2.4** - UI framework with hooks
- **Vite 8.0.0** - Build tool and dev server
- **Tailwind CSS 4.2.1** - Utility-first CSS framework
- **React Router DOM 7.13.1** - Client-side routing
- **React Hot Toast 2.6.0** - Toast notifications
- **Lucide React 0.577.0** - Icon library

### Backend
- **Node.js** - JavaScript runtime
- **Express 5.1.0** - Web framework
- **MongoDB 8.19.3** - NoSQL database (via Mongoose)
- **Groq SDK 0.34.0** - AI/LLM integration
- **Nodemailer 7.0.10** - Email sending
- **Multer 2.0.2** - File upload handling
- **CSV Parser 3.2.0** - CSV file parsing
- **Dotenv 17.2.3** - Environment variable management
- **Nodemon 3.1.10** - Development auto-reload

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND (React + Vite)                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │  Dashboard   │  │ ContactDetail│  │  Management Features │  │
│  │  - StatsBar  │  │  - View/Edit │  │  - Upload Modal      │  │
│  │  - ContactTbl│  │  - History   │  │  - Email Sending     │  │
│  │  - FilterPnl │  │              │  │  - Bulk Actions      │  │
│  └──────────────┘  └──────────────┘  └──────────────────────┘  │
│          ↓                    ↓                    ↓             │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │         React Router - Routes & Navigation              │   │
│  │  / → Dashboard                                          │   │
│  │  /contacts/:id → Contact Detail View                   │   │
│  └─────────────────────────────────────────────────────────┘   │
│          ↓                                                      │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │          API Client Layer (api.js)                      │   │
│  │  - HTTP requests to backend                            │   │
│  │  - Response handling & error management                │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              ↓ (HTTP)
┌─────────────────────────────────────────────────────────────────┐
│                   BACKEND (Express Server)                        │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │               Routes & Middleware                         │  │
│  │  ┌────────────────┐      ┌──────────────────────────┐   │  │
│  │  │ CORS Handling  │      │ Express Middleware       │   │  │
│  │  │ Port: 5000     │      │ - JSON parser            │   │  │
│  │  └────────────────┘      │ - File upload (Multer)   │   │  │
│  │                          └──────────────────────────┘   │  │
│  └──────────────────────────────────────────────────────────┘  │
│          ↓                                                      │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              Router Modules                             │   │
│  │  ┌────────────────────┐  ┌──────────────────────────┐ │   │
│  │  │ Contact Router     │  │ Email Router             │ │   │
│  │  │ GET /contacts      │  │ POST /email/send         │ │   │
│  │  │ GET /contacts/:id  │  │                          │ │   │
│  │  │ POST /upload       │  │                          │ │   │
│  │  │ PATCH /contacts/:id│  │                          │ │   │
│  │  │ PATCH /contacts/blk│  │                          │ │   │
│  │  │ GET /stats         │  │                          │ │   │
│  │  └────────────────────┘  └──────────────────────────┘ │   │
│  └─────────────────────────────────────────────────────────┘   │
│          ↓                                                      │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              Controller Layer                           │   │
│  │  ┌─────────────────────┐  ┌──────────────────────────┐ │   │
│  │  │ Contact Controller  │  │ Email Action Controller  │ │   │
│  │  │ - getContacts()     │  │ - sendToContacts()       │ │   │
│  │  │ - filterContacts()  │  │ - sendFollowup()         │ │   │
│  │  │ - getContactById()  │  │                          │ │   │
│  │  │ - updateContact()   │  │                          │ │   │
│  │  │ - bulkUpdate()      │  │                          │ │   │
│  │  │ - getStats()        │  │                          │ │   │
│  │  └─────────────────────┘  └──────────────────────────┘ │   │
│  │  ┌──────────────────────────────────────────────────┐  │   │
│  │  │ Send Email Controller                            │  │   │
│  │  │ - sendEmail() [legacy]                           │  │   │
│  │  └──────────────────────────────────────────────────┘  │   │
│  └─────────────────────────────────────────────────────────┘   │
│          ↓                                                      │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              Service Layer                             │   │
│  │  ┌──────────────────┐  ┌──────────────────────────┐   │   │
│  │  │ AI Service       │  │ Email Service            │   │   │
│  │  │ - groqservice.js │  │ - Nodemailer config      │   │   │
│  │  │ - Generate emails│  │ - sendEmailsNodemailer() │   │   │
│  │  │ - Prompt eng.    │  │ - Format email bodies    │   │   │
│  │  └──────────────────┘  └──────────────────────────┘   │   │
│  │  ┌──────────────────────────────────────────────────┐  │   │
│  │  │ CSV Import Service                               │  │   │
│  │  │ - Parse CSV files                               │  │   │
│  │  │ - Duplicate detection                           │  │   │
│  │  │ - Batch insert to DB                            │  │   │
│  │  └──────────────────────────────────────────────────┘  │   │
│  └─────────────────────────────────────────────────────────┘   │
│          ↓                                                      │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              Data Layer (MongoDB)                       │   │
│  │  ┌──────────────────────────────────────────────────┐  │   │
│  │  │ Contact Model                                    │  │   │
│  │  │ - Personal info, company details                │  │   │
│  │  │ - Email tracking & outreach status              │  │   │
│  │  │ - Follow-up scheduling & reply tracking         │  │   │
│  │  │ - Contact flags & restrictions                  │  │   │
│  │  └──────────────────────────────────────────────────┘  │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
            ↓ (External Services)
┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│  Groq API        │  │  Gmail/SMTP      │  │  MongoDB Cloud   │
│  (LLM for        │  │  (Email sending) │  │  (Data storage)  │
│   generation)    │  │                  │  │                  │
└──────────────────┘  └──────────────────┘  └──────────────────┘
```

---

## Database Schema

### Contact Model (MongoDB)

```javascript
{
  // Personal Information
  firstName: String,
  lastName: String,
  email: String (primary key for deduplication),
  title: String,
  workDirectPhone: String,
  homePhone: String,
  mobilePhone: String,

  // Company Information
  companyName: String,
  companyNameForEmails: String,
  companyAddress: String,
  companyCity: String,
  companyState: String,
  companyCountry: String,
  companyPhone: String,
  website: String,
  industry: String,
  employees: String,
  annualRevenue: String,

  // Email Verification Data (Apollo enrichment)
  emailStatus: String,
  primaryEmailSource: String,
  primaryEmailVerificationSource: String,
  emailConfidence: Number,
  primaryEmailCatchAllStatus: String,
  primaryEmailLastVerifiedAt: String,
  
  // Additional Emails
  secondaryEmail: String,
  tertiaryEmail: String,

  // Social & Web Links
  personLinkedinUrl: String,
  companyLinkedinUrl: String,
  facebookUrl: String,
  twitterUrl: String,

  // Company Funding Info
  totalFunding: String,
  latestFunding: String,
  latestFundingAmount: String,
  lastRaisedAt: String,

  // Outreach Tracking
  lastSentDate: Date (defaults to 100 days ago),
  outreachStatus: Enum [
    "NOT_SENT",
    "SENT",
    "FOLLOWUP_PENDING",
    "REPLIED_POSITIVE",
    "REPLIED_NEGATIVE",
    "NO_RESPONSE",
    "CLOSED"
  ],

  // Reply Tracking
  reply: {
    replied: Boolean (default: false),
    replyType: Enum ["positive", "negative", "neutral"],
    replyMessage: String,
    repliedAt: Date
  },

  // Follow-up Automation
  followup: {
    followupCount: Number (default: 0),
    maxFollowups: Number (default: 3),
    nextFollowupAt: Date,
    followupEnabled: Boolean (default: true)
  },

  // Email Statistics
  emailStats: {
    emailsSent: Number (incremented on each send),
    opened: Boolean,
    openedCount: Number,
    lastOpenedAt: Date
  },

  // Email History
  emails: [
    {
      type: String,
      subject: String,
      sentAt: Date
    }
  ],

  // Contact Flags
  flags: {
    doNotContact: Boolean (default: false),
    bounced: Boolean (default: false),
    unsubscribe: Boolean (default: false)
  },

  // Metadata
  notes: String (default: "MARCH17-26"),
  createdAt: Date (auto),
  updatedAt: Date (auto)
}
```

**Key Features:**
- **Deduplication**: Checks for `apolloContactId` or `email` before inserting
- **Email Tracking**: Comprehensive stats on sends, opens, bounces
- **Outreach Automation**: Status tracking with follow-up scheduling
- **Contact Restrictions**: Flags for bounced/unsubscribed/do-not-contact
- **Email History**: Full log of sent emails per contact

---

## API Documentation

### Contact Routes

#### GET `/api/contacts`
Retrieve paginated contacts with search and optional field projection.

**Query Parameters:**
```
page: number (default: 1)
limit: number (default: 25)
sort: string (default: "-createdAt") // "-" for descending
search: string // searches firstName, lastName, email, companyName
fields: string // comma-separated fields to include (projection)
```

**Response:**
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 25,
    "total": 1500,
    "pages": 60
  }
}
```

---

#### GET `/api/contacts/filter`
Advanced filtering with complex query conditions.

**Query Parameters:**
```
outreachStatus: string // comma-separated: NOT_SENT,SENT,REPLIED_POSITIVE
replied: boolean
replyType: string // positive,negative,neutral
followupCountMin/Max: number
nextFollowupBefore/After: date (ISO 8601)
opened: boolean
emailsSentMin/Max: number
doNotContact: boolean
bounced: boolean
unsubscribe: boolean
company: string // regex search
role: string // job title regex search
dateFrom/To: date // contact creation date range
search: string
```

**Example:**
```
GET /api/contacts/filter?outreachStatus=SENT&replied=false&emailsSentMin=1&emailsSentMax=3
```

---

#### GET `/api/contacts/:id`
Get single contact details.

**Response:**
```json
{
  "success": true,
  "data": { /* full contact object */ }
}
```

---

#### GET `/api/contacts/stats`
Dashboard statistics aggregation.

**Response:**
```json
{
  "success": true,
  "data": {
    "total": 1500,
    "statusBreakdown": {
      "NOT_SENT": 800,
      "SENT": 500,
      "REPLIED_POSITIVE": 150,
      "REPLIED_NEGATIVE": 30,
      "CLOSED": 20
    },
    "replied": 180,
    "bounced": 45,
    "doNotContact": 25
  }
}
```

---

#### PATCH `/api/contacts/:id`
Update a single contact.

**Request Body:**
```json
{
  "outreachStatus": "REPLIED_POSITIVE",
  "notes": "Interested, schedule follow-up"
}
```

---

#### PATCH `/api/contacts/bulk`
Bulk update multiple contacts.

**Request Body:**
```json
{
  "ids": ["id1", "id2", "id3"],
  "update": {
    "outreachStatus": "SENT",
    "notes": "Initial outreach sent"
  }
}
```

**Response:**
```json
{
  "success": true,
  "modifiedCount": 3,
  "matchedCount": 3
}
```

---

#### POST `/upload`
Upload and import CSV file with contacts.

**Request:**
- Method: POST
- Content-Type: multipart/form-data
- Field name: `file`

**Expected CSV Columns (Apollo format):**
```
First Name, Last Name, Email, Title, Company Name, Email Status,
Apollo Contact Id, Industry, Technologies, Phone numbers (various),
Links (LinkedIn, Facebook, Twitter, Website),
Company details (funding, revenue, employees),
Email verification data, etc.
```

**Response:**
```json
{
  "success": true,
  "inserted": 450,
  "skipped": 50,
  "total": 500
}
```

**Logic:**
- Checks for duplicate by `apolloContactId` OR `email`
- Skips existing records
- Parses all CSV fields into contact documents
- Deletes temp file after processing

---

### Email Routes

#### POST `/email/send`
Send personalized emails to contacts (legacy endpoint).

**Note:** Currently returns mock response. Implementation in `sendEmail.controller.js` queries users with `lastSentDate < 20 days ago` and generates personalized emails.

**Response:**
```json
{
  "message": "sent to all users",
  "names": ["John", "Jane"]
}
```

---

#### POST `/api/contacts/emails/send`
Send outreach emails to specific contacts.

**Request Body:**
```json
{
  "contactIds": ["id1", "id2", "id3"]
}
```

**Process:**
1. Fetches contacts by IDs
2. Filters out: do-not-contact, bounced, unsubscribed
3. Validates domain not in blocklist
4. For each contact:
   - Generates personalized email using Groq AI
   - Formats email body with contact details
   - Sends via Nodemailer
   - Updates contact: `lastSentDate`, `outreachStatus`, `emailStats.emailsSent`
   - Logs email in `emails` array
5. Rate limit: 15 second delay between emails

**Response:**
```json
{
  "success": true,
  "results": {
    "sent": [
      { "id": "contact_id", "email": "user@example.com" }
    ],
    "failed": [
      { "id": "contact_id", "email": "user@example.com", "error": "..." }
    ],
    "skipped": [
      { "id": "contact_id", "email": "user@example.com", "reason": "Blocked domain" }
    ]
  }
}
```

---

#### POST `/api/contacts/emails/followup`
Send follow-up emails to contacts.

**Request Body:**
```json
{
  "contactIds": ["id1", "id2"]
}
```

**Eligibility:**
- `followup.followupEnabled === true`
- `followup.followupCount < followup.maxFollowups`
- Not in flags: doNotContact, bounced, unsubscribe

**Process:**
1. Similar to send, but with follow-up specific updates:
   - Subject prefixed with "Re: "
   - Updates: `outreachStatus = "FOLLOWUP_PENDING"`
   - Increments `followup.followupCount`
   - Sets `nextFollowupAt = current_time + 3_days`
   - Email type tagged as "followup" in history

**Response:**
Same structure as `/emails/send`

---

## Frontend Architecture

### Component Hierarchy

```
App
├── Layout
│   ├── Header/Nav
│   └── Main
│       ├── Dashboard (/)
│       │   ├── StatsBar
│       │   │   └── Displays total, sent, replied counts
│       │   ├── FilterPanel
│       │   │   └── Advanced filter controls
│       │   ├── ContactTable
│       │   │   ├── Bulk selection checkbox
│       │   │   └── Row-level actions
│       │   ├── BulkActions
│       │   │   ├── Send Email button
│       │   │   ├── Send Followup button
│       │   │   └── Bulk status update
│       │   ├── UploadModal
│       │   │   └── CSV file upload interface
│       │   └── EmailSendingModal
│       │       └── Progress & confirmation for bulk sends
│       │
│       └── ContactDetail (/contacts/:id)
│           ├── Contact info display
│           ├── Email history
│           ├── Outreach status
│           ├── Reply tracking
│           ├── Follow-up scheduling
│           └── Action buttons (send, update, etc)
```

### Key Components

#### Dashboard
- **Purpose**: Main hub for contact management and campaigns
- **State**: Filters, selected contacts, pagination
- **Data**: Fetches contacts list and stats

#### ContactTable
- **Purpose**: Display contacts in paginated table
- **Features**: Selection, sorting, inline actions
- **Integration**: Uses `useContacts` hook for data

#### FilterPanel
- **Purpose**: Advanced filtering by status, replies, follow-ups, etc.
- **Filters Supported**:
  - Outreach status (NOT_SENT, SENT, REPLIED_POSITIVE, etc.)
  - Reply status and type
  - Follow-up counts and dates
  - Email statistics
  - Contact flags (bounced, do-not-contact, unsubscribe)
  - Company and role search
  - Date ranges

#### UploadModal
- **Purpose**: Bulk import contacts via CSV
- **Validation**: File type, size
- **Feedback**: Shows inserted/skipped counts

#### EmailSendingModal
- **Purpose**: Confirm and track email sending progress
- **Displays**: Status per contact, success/failure counts
- **Rate Limiting**: Shows delay between sends

#### BulkActions
- **Purpose**: Perform actions on selected contacts
- **Actions**:
  - Send initial outreach emails
  - Send follow-up emails
  - Bulk status updates

### Custom Hooks

#### useContacts
```javascript
const {
  contacts,
  loading,
  error,
  pagination,
  fetchContacts,
  filterContacts,
  updateContact,
  bulkUpdateContacts,
  getStats
} = useContacts();
```

- Manages contact CRUD operations
- Handles API communication
- Manages loading states and errors
- Provides pagination logic

### API Client (api.js)
Centralized HTTP client for all backend communication:
- Contact CRUD (GET, PATCH)
- Email actions (send, followup)
- CSV upload
- Stats retrieval

---

## Features & Implementation

### 1. CSV Bulk Import
**Files:**
- `backend/server.js` - POST `/upload` endpoint
- `backend/routes/contact.router.js` - Route definition
- `frontend/components/UploadModal.jsx` - UI

**Flow:**
```
User selects CSV file
      ↓
UploadModal validates & sends to /upload
      ↓
Multer saves file temporarily
      ↓
csv-parser streams file rows
      ↓
For each row:
  - Check duplicate (apolloContactId or email)
  - If new: create Contact document
  - If exists: skip
      ↓
Delete temp file
      ↓
Return: { inserted, skipped, total }
```

**Deduplication:**
- First checks `apolloContactId`
- Falls back to email
- Uses `.findOne()` before insert

**Performance:** Bulk insert with serial duplicate checks

---

### 2. AI-Powered Email Generation
**Files:**
- `backend/ai-service/groqservice.js` - Groq integration
- `backend/ai-service/prompt.js` - System prompt
- `backend/ai-service/extractJsonFromModel.js` - JSON parsing

**Flow:**
```
Contact object
      ↓
Build prompt with contact data + system instructions
      ↓
Send to Groq API (llama-3.3-70b-versatile model)
      ↓
Parse JSON response: { subject, body }
      ↓
Fallback to default if parsing fails
      ↓
Return { subject, body }
```

**Key Features:**
- Temperature: 0.7 (creative but consistent)
- Max tokens: 400 (balance between detail and cost)
- Model: `llama-3.3-70b-versatile` (fast, capable)
- Error handling: Safe fallbacks for malformed AI output
- JSON extraction: Robust parsing handles model quirks

**Prompt Engineering:**
- System role: "Expert cold-email copywriter"
- JSON-only output requirement
- Contact data context (name, company, industry, etc.)

---

### 3. Email Sending with Nodemailer
**Files:**
- `backend/email-service/index.js` - Email transport
- `backend/email-service/email.body.format.js` - Body formatting
- `backend/controller/emailAction.controller.js` - Sending logic

**Configuration:**
```javascript
Service: Gmail SMTP
Auth: Email + App Password (from .env)
From: process.env.EMAIL_USER
Protocol: SMTP
```

**Sending Process:**
```
Contact selected
      ↓
Generate personalized email (Groq)
      ↓
Format email body (personalization + signature)
      ↓
Create mailOptions { from, to, subject, text }
      ↓
transporter.sendMail()
      ↓
Update contact on success:
  - lastSentDate = now
  - emailStats.emailsSent ++
  - outreachStatus = "SENT" (if was "NOT_SENT")
  - Add to emails array
      ↓
Rate limit: 15s delay between emails (spam prevention)
```

**Body Formatting:**
- Personalizes with contact name, company
- Adds signature (thanks phrase + sender info)
- Escapes special characters

---

### 4. Contact Filtering & Search
**Implementation:**
- `backend/controller/contact.controller.js` - `filterContacts()`

**Supported Filters:**
```javascript
// Text search (MongoDB regex)
- firstName, lastName, email, companyName

// Status filters
- outreachStatus: NOT_SENT, SENT, REPLIED_POSITIVE, etc.
- replied: true/false
- replyType: positive, negative, neutral

// Follow-up filters
- followupCountMin/Max: range
- nextFollowupBefore/After: date range

// Email stats filters
- opened: true/false
- emailsSentMin/Max: range

// Flag filters
- doNotContact, bounced, unsubscribe: true/false

// Company & role
- company: regex
- role: job title regex

// Date range
- dateFrom/To: contact creation date
```

**MongoDB Query Building:**
- Dynamic `$or` for text search
- `$in` for enum values
- `$gte/$lte` for ranges
- `$regex` for pattern matching

**Performance:**
- Lean queries (no hydration)
- Parallel count + fetch with Promise.all()

---

### 5. Follow-up Automation
**Implementation:**
- `backend/controller/emailAction.controller.js` - `sendFollowup()`

**Features:**
```
- Eligibility: followupEnabled && followupCount < maxFollowups
- Prevents: do-not-contact, bounced, unsubscribe
- Subject: "Re: [original subject]"
- Tracks: followupCount++, nextFollowupAt (3 days out)
- Status: Marks as "FOLLOWUP_PENDING"
- Rate limit: 5s delay between follow-ups
```

**Configurable:**
- `maxFollowups`: Default 3 (per contact)
- `nextFollowupAt`: Calculated as now + 3 days
- Can be disabled per contact via `followupEnabled` flag

---

### 6. Dashboard Analytics
**Implementation:**
- `backend/controller/contact.controller.js` - `getContactStats()`

**Metrics:**
```json
{
  "total": 1500,                    // All contacts
  "statusBreakdown": {               // By outreach status
    "NOT_SENT": 800,
    "SENT": 500,
    "REPLIED_POSITIVE": 150,
    "REPLIED_NEGATIVE": 30,
    "CLOSED": 20
  },
  "replied": 180,                   // Total replied
  "bounced": 45,                    // Bounced flag set
  "doNotContact": 25                // Do not contact flag set
}
```

**MongoDB Aggregation:**
- Uses `$group` for status distribution
- Parallel queries with Promise.all()
- Computed in milliseconds

---

### 7. Contact Flags & Restrictions
**Flags Available:**
```javascript
flags: {
  doNotContact: Boolean,    // User requested no contact
  bounced: Boolean,         // Email bounced
  unsubscribe: Boolean      // User unsubscribed
}
```

**Enforcement:**
- Checked before sending any email
- Filtered out in `sendToContacts()` and `sendFollowup()`
- Query: `{ "flags.doNotContact": { $ne: true } }`

---

### 8. Reply & Outreach Tracking
**Data Structure:**
```javascript
// Reply tracking
reply: {
  replied: Boolean,
  replyType: "positive" | "negative" | "neutral",
  replyMessage: String,
  repliedAt: Date
}

// Outreach status
outreachStatus: "NOT_SENT" | "SENT" | "FOLLOWUP_PENDING" | 
                "REPLIED_POSITIVE" | "REPLIED_NEGATIVE" | 
                "NO_RESPONSE" | "CLOSED"

// Email history
emails: [
  { type: "outreach" | "followup", subject, sentAt }
]

// Email statistics
emailStats: {
  emailsSent: Number,
  opened: Boolean,
  openedCount: Number,
  lastOpenedAt: Date
}
```

**Status Transitions:**
```
NOT_SENT → SENT (on first email)
       → REPLIED_POSITIVE (manual update + reply tracked)
       → REPLIED_NEGATIVE (manual update + reply tracked)
       → NO_RESPONSE (manual update)
       → CLOSED (manual update)
```

---

### 9. Domain Blocking
**Files:**
- `backend/utils/blockedDomains.js` - Blocklist

**Implementation:**
- Prevents sending to restricted domains (e.g., do-not-email services)
- Checked before every send
- Returns `skipped` in response with reason "Blocked domain"

---

## Data Flow

### Complete Email Campaign Flow

```
┌─────────────────────────────────────────────────────────┐
│ 1. IMPORT PHASE                                         │
│                                                         │
│ User uploads CSV                                       │
│       ↓                                                │
│ Frontend: UploadModal sends to /upload               │
│       ↓                                                │
│ Backend: Multer saves file                           │
│       ↓                                                │
│ CSV Parser: Streams rows                             │
│       ↓                                                │
│ For each row: Check duplicate, insert if new         │
│       ↓                                                │
│ Response: { inserted: 450, skipped: 50, total: 500 } │
└─────────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────┐
│ 2. FILTERING & SELECTION PHASE                         │
│                                                         │
│ User views Dashboard (GET /api/contacts/stats)        │
│       ↓                                                │
│ User applies filters (GET /api/contacts/filter)       │
│       ↓                                                │
│ Results displayed in ContactTable                     │
│       ↓                                                │
│ User selects contacts (client-side state)             │
└─────────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────┐
│ 3. EMAIL GENERATION & SENDING PHASE                     │
│                                                         │
│ User clicks "Send Emails" on selected contacts        │
│       ↓                                                │
│ Frontend: Shows EmailSendingModal                      │
│       ↓                                                │
│ POST /api/contacts/emails/send { contactIds: [...] } │
│       ↓                                                │
│ Backend: Fetch contacts                              │
│       ↓                                                │
│ For each contact:                                     │
│  1. Check flags (doNotContact, bounced, unsubscribe)  │
│  2. Check domain blocklist                           │
│  3. Call generateInternshipEmail(contact)            │
│     - Groq API generates { subject, body }           │
│  4. Format email body (personalization)              │
│  5. Call sendEmailsNodemailer()                       │
│     - Nodemailer sends via Gmail SMTP                │
│  6. On success:                                       │
│     - Update contact document:                        │
│       * lastSentDate = now                            │
│       * emailStats.emailsSent ++                      │
│       * outreachStatus = "SENT" (if "NOT_SENT")      │
│       * Push to emails array                          │
│  7. Log in results (sent/failed/skipped)              │
│  8. 15s delay before next email (rate limit)          │
│       ↓                                                │
│ Response: { success: true, results: {...} }           │
│       ↓                                                │
│ Frontend: Updates display, shows toast notifications   │
└─────────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────┐
│ 4. REPLY TRACKING & FOLLOW-UP PHASE                     │
│                                                         │
│ User receives replies from contacts                    │
│       ↓                                                │
│ User marks replies in Dashboard                       │
│       ↓                                                │
│ PATCH /api/contacts/:id updates:                      │
│  - reply.replied = true                              │
│  - reply.replyType = "positive"/"negative"           │
│  - reply.replyMessage = user input                   │
│  - reply.repliedAt = now                             │
│  - outreachStatus = "REPLIED_POSITIVE" (or negative) │
│       ↓                                                │
│ For follow-up eligible contacts:                      │
│  - User selects them                                 │
│  - Clicks "Send Follow-up"                           │
│       ↓                                                │
│ POST /api/contacts/emails/followup { contactIds }    │
│       ↓                                                │
│ Similar to send, but:                                │
│  - Subject: "Re: [original]"                         │
│  - followup.followupCount ++                         │
│  - nextFollowupAt = now + 3 days                     │
│  - outreachStatus = "FOLLOWUP_PENDING"               │
│  - 5s delay between follow-ups                       │
│       ↓                                                │
│ Process repeats until maxFollowups reached           │
└─────────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────┐
│ 5. CAMPAIGN ANALYTICS PHASE                            │
│                                                         │
│ User views updated Dashboard                          │
│       ↓                                                │
│ GET /api/contacts/stats returns:                      │
│  - Total contacts                                     │
│  - Status breakdown (how many in each stage)          │
│  - Reply counts                                       │
│  - Bounced & do-not-contact counts                    │
│       ↓                                                │
│ StatsBar displays KPIs                                │
│       ↓                                                │
│ User can filter by any criteria & iterate             │
└─────────────────────────────────────────────────────────┘
```

---

## Environment Variables (.env)

```bash
# Backend
GROQ_API_KEY=sk_...                    # Groq API key for LLM
EMAIL_USER=your-email@gmail.com        # Gmail account
EMAIL_PASS=your-app-password           # Gmail app-specific password

# Database (already in code, no .env needed)
MONGODB_URI=mongodb+srv://...          # MongoDB Atlas connection
```

---

## Error Handling

### Frontend
- Try-catch in all async operations
- React Hot Toast for user notifications
- Fallback loading states

### Backend
- HTTP status codes (400, 404, 500)
- Try-catch in controllers
- Groq AI has safe fallbacks for generation errors
- Email sending logs failures but doesn't crash server
- Validation before operations (e.g., contactIds array)

---

## Performance Considerations

1. **Database:**
   - Lean queries (no Mongoose hydration)
   - Indexing on email, apolloContactId, outreachStatus
   - Pagination (default 25 per page)
   - Aggregation pipelines for stats

2. **API:**
   - Rate limiting between emails (15s for outreach, 5s for follow-up)
   - Promise.all for parallel queries
   - CORS whitelist (only localhost:5173)

3. **Frontend:**
   - React lazy loading for routes
   - Virtual scrolling for large tables (recommended)
   - Debounced search/filter

4. **Email:**
   - Groq max_tokens: 400 (balanced)
   - Nodemailer connection pooling
   - Domain blocklist to prevent errors

---

## Future Enhancements

1. **Analytics:**
   - Email open tracking (pixel-based)
   - Click tracking in email bodies
   - A/B testing for subject lines

2. **Automation:**
   - Scheduled campaign execution
   - Conditional follow-ups based on engagement
   - Auto-reply detection

3. **Integration:**
   - Slack notifications for replies
   - CRM sync (HubSpot, Salesforce)
   - Webhook support

4. **User Management:**
   - Multi-user accounts with permissions
   - Team collaboration on campaigns
   - Audit logs for all actions

5. **Email Quality:**
   - Spam score checking (before send)
   - Warm-up sequence for new domains
   - Authentication (SPF, DKIM, DMARC) setup

---

## Security Notes

⚠️ **Current Concerns:**
- MongoDB credentials in source code
- Email credentials in .env (visible in commits)
- No authentication on API endpoints
- CORS allows localhost only (should restrict in production)

**Recommendations:**
1. Use environment variables for all secrets
2. Add JWT authentication
3. Implement rate limiting per IP
4. Add request validation & sanitization
5. Encrypt sensitive fields (email passwords, API keys)
6. Add audit logging
7. Use API keys instead of password authentication

---

## Deployment

**Frontend:**
```bash
cd frontend
npm run build
# Deploy dist/ folder to hosting (Vercel, Netlify, etc.)
```

**Backend:**
```bash
cd backend
npm install
npm run dev  # or: node server.js
```

**Database:**
- Hosted on MongoDB Atlas
- No local setup required

---

## Development

**Local Setup:**
```bash
# Install dependencies
npm install
cd backend && npm install && cd ..
cd frontend && npm install && cd ..

# Configure environment
# Create backend/.env with GROQ_API_KEY, EMAIL_USER, EMAIL_PASS

# Run development servers
npm run dev
# Frontend: http://localhost:5173
# Backend: http://localhost:5000
```

---

## Summary

This is a sophisticated **Email Campaign Management System** that combines:
- **Data Management**: Bulk CSV import with deduplication
- **AI Generation**: Personalized emails via Groq LLM
- **Automation**: Scheduled follow-ups and status tracking
- **Analytics**: Dashboard with comprehensive metrics
- **Contact Management**: Advanced filtering and bulk operations

The architecture is modular, scalable, and designed for high-volume email campaigns while maintaining contact integrity and compliance.
