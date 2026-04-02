# Detailed Developer Guide - Follow-Up Tracker

## 1. Project Overview & Philosophy
The Follow-Up Tracker is designed as a robust internal tool for high-accountability organizations. It moves beyond simple "to-do" lists by implementing a formal **Task Lifecycle** with acceptance workflows, real-time collaboration, and automated multi-channel notifications.

### Core Tech Stack
- **Framework**: Next.js 15 (App Router, Server Actions)
- **Database**: Supabase (PostgreSQL with RLS)
- **Auth**: Supabase Auth (Email/Phone + Google OAuth)
- **Real-time**: Supabase Realtime (Broadcast)
- **Styling**: Tailwind CSS (Minimalist White Theme)
- **Notifications**: n8n Webhook Service

---

## 2. Directory Structure
```text
/
├── .agent/             # AI-Agent skill configurations and prompt assets
├── src/
│   ├── app/
│   │   ├── (auth)/     # Login, Signup, Password Reset routes
│   │   ├── (dashboard)/# Unified Dashboard, Profile, and Settings
│   │   ├── api/        # Cron endpoints and API routes
│   │   └── actions/    # Core business logic (Server Actions)
│   ├── components/     # UI Components (TaskCard, Modals, Analytics)
│   ├── lib/            # Utilities (Supabase client, Notifications, Reminders)
│   └── types/          # Shared TypeScript definitions
└── public/             # Static assets (images, fonts)
```

---

## 3. Data Flow Architecture

### Task Creation Lifecycle
1.  **Frontend**: User submits the `NewTaskModal`. An `isLoading` state guards against double-submission.
2.  **Reminder Logic**: The `calculateReminderSchedule` utility generates ISO timestamps for 24-hour and 1-hour reminders based on the `due_date`.
3.  **Server Action (`createTask`)**:
    *   **Deduplication**: Checks if an identical task was created by the same user in the last **10 seconds**.
    *   **Status Logic**: 
        *   Assigning to self or a superior role → `Not Started`.
        *   Assigning to a subordinate → `Pending Acceptance`.
    *   **Insertion**: Task is saved with the `reminder_schedule` JSON array.
4.  **Notifications**: `sendNotification` signals n8n with the `task_created` payload.
5.  **Global Refresh**: `revalidatePath('/dashboard')` updates the RSC cache.

### Real-time Synchronization
The `RealtimeListener.tsx` component (mounted on the dashboard) establishes a subscription to:
- `tasks`: Any `INSERT`/`UPDATE`.
- `comments`: Any `INSERT`.
When an event occurs, it triggers a `router.refresh()`, forcing Next.js to re-fetch Server Components and update the UI for all users in that organization instantly.

---

## 4. Server Actions Documentation

### `tasks.ts`
- **`createTask(formData)`**: Validates user, calculates reminders, performs deduplication, and handles notifications.
- **`updateTaskStatus(taskId, status)`**: Idempotent status update. If the status is `Blocked` or `Completed`, it notifies the task creator.
- **`respondToTask(taskId, accept, reason?)`**: Transitions task from `Pending Acceptance` to `Not Started` or `Rejected`.
- **`addComment(taskId, body)`**: Adds threaded comments with a **5-second** duplicate submission window.
- **`getAnalytics()`**: Role-scoped query that calculates performance metrics based on deadlines.

### `org.ts`
- **`updateOrgDepartments(orgId, departments)`**: Founder/Admin only. Overwrites the department list array.
- **`updateUserProfile(targetId, updates)`**: Founder/Admin only. Modifies role, department, or contact info of any organization member.

---

## 5. Automated Reminders (Cron Service)

The system features a proactive reminder engine located at `src/app/api/cron/reminders/route.ts`.

1.  **Execution**: Typically triggered every 15 minutes by Vercel Cron.
2.  **Protection**: Requires a `CRON_SECRET` in the `Authorization: Bearer <secret>` header.
3.  **Mechanism**:
    *   Fetches all non-completed tasks.
    *   Checks if `now` falls within a 15-minute window of any timestamp in `reminder_schedule`.
    *   Checks the `sent_reminders` table to ensure that specific reminder hasn't already been fired.
4.  **Overdue Alerts**: If a task is past its `due_date`, it fires a daily "Overdue" alert to the assignee.

---

## 6. Notification Payload (n8n Integration)

All notifications are centralized in `src/lib/notifications.ts`. The payload sent to n8n follows this schema:
```json
{
  "type": "task_created | task_blocked | task_completed | task_reminder | task_overdue",
  "task": { "id", "title", "description", "priority", "status", "due_date" },
  "recipient": { "full_name", "email", "whatsapp_no" },
  "sender": { "full_name", "email" },
  "timestamp": "ISO-8601"
}
```

---

## 7. Robustness & Security Standards

### Interaction Guard Policy
All asynchronous UI handlers **MUST** implement internal guards:
```javascript
const [isSaving, setIsSaving] = useState(false);
async function handleSubmit() {
  if (isSaving) return; // Prevent concurrent execution
  setIsSaving(true);
  try {
     const res = await serverAction();
     // handle response
  } finally {
     setIsSaving(false);
  }
}
```

### Row Level Security (RLS)
The database is strictly partitioned using PostgreSQL RLS policies:
- Users can only view tasks where their `org_id` matches.
- Performance: Most queries leverage indexes on `org_id`, `assignee_id`, and `creator_id`.
- Data Protection: `sent_reminders` and `audit_log` are append-only.

---

## 8. Deployment Checklist
1. Ensure `SUPABASE_SERVICE_ROLE_KEY` is set in Vercel (required for the Cron service).
2. Configure `N8N_WEBHOOK_URL` for production.
3. Configure `CRON_SECRET` and add the cron definition to `vercel.json`:
   ```json
   {
     "crons": [{
       "path": "/api/cron/reminders",
       "schedule": "*/15 * * * *"
     }]
   }
   ```
