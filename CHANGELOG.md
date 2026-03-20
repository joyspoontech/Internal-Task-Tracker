# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Added
- [NEW] Task Acceptance workflow: Assignees must accept/reject new tasks.
- [NEW] Rejection reason requirement for rejected tasks.
- [NEW] 'Pending Acceptance' and 'Rejected' statuses with corresponding UI styling.

### Changed
- Updated `createTask` server action to initialize tasks in 'Pending Acceptance' status.
- Enhanced `TaskDetailModal` with Accept/Reject controls.
- Updated `FilterChips` and `TaskCard` to support new task statuses.

---

## [1.2.0] - 2026-03-20

### Added
- **Forgot Password**: Complete flow with email reset and secure password update.
- **Individual Profile Settings**: Users can now manage their own name and WhatsApp details.
- **Team Management (Founder)**: Direct editing of name, email, and WhatsApp for all members.
- **Automatic Reminders**: Task-based reminder scheduling (24h, 1h, and deadline).
- **Cron Engine**: Automated reminder logic with duplicate prevention.
- **Role-based Privacy**: Restricted Organization Overview to Founders and Admins only.

### Changed
- Refactored `createTask` to automatically populate reminder schedules.
- Enhanced Dashboard Layout with Profile navigation.
- Broadened `updateUserProfile` action to support full member editing.

---

## [1.0.0] - 2026-03-15

### Added
- **Google OAuth**: Full Login/Signup with Google + auto-onboarding flow.
- **Analytics Engine**: Role-scoped donut charts with responsive grid layout.
- **Notification System**: Integrated n8n webhooks for real-time Email and WhatsApp alerts.
- **Automation**: Cron-based task reminders and overdue triggers.
- **Task Interaction**: Real-time dashboard updates, task comments, and detail modals.
- **Polish**: Finalized glassmorphism UI, entrance animations, and responsive fixes.
- [Phase 6]: Completely redesigned 'Create New Task' and 'Task Detail' modals with premium aesthetics.
- Added custom scrollbar styling for better UX in modals.
- Integrated Lucide icons for better visual guidance in task forms.

### Fixed
- Fixed "side white blocks" issue when modals are open by explicitly setting backdrop dimensions to full viewport (`w-screen h-screen`) and forcing origin pinning (`left-0 top-0`).
- Fixed inconsistent backdrop blur by increasing intensity to `backdrop-blur-xl` for a more premium glassmorphism effect.

### Changed
- Standardized task status enums (Not Started, In Progress, Blocked, Completed).
- Optimized analytics layout for wide-screen manager dashboards.

### Technical Details
- Added `vercel.json` for production cron job support.
- Implemented Supabase Realtime for live dashboard syncing.
- Configured production notification routing utilities.

---

## [0.1.0] - 2026-03-10

### Added
- Project initialization
- Basic file structure
- AI context file
- Supabase Project creation and schema apply
- Next.js 14 project scaffold

### Technical Details
- Created file structure using create-next-app
- Implemented Supabase SSR Auth Middleware
- Generated design system through ui-ux-pro-max
