# AI Context for Follow-Up Tracker

## Project Overview
- **Purpose**: Autonomous reminder and task-information exchange web application (MVP).
- **Tech Stack**: Next.js 14 App Router, Supabase (Auth, Postgres, Realtime), Tailwind CSS.
- **Architecture**: Role-based access (Founder, Manager, Employee, Admin). Supabase client on browser and server.

## Current State
- **Version**: 1.3.0
- **Status**: Stable / Robust (Phase 15 Completed)
- **Last Updated**: 2026-03-26

## File Structure
```
/src
  /app
  /components
  /lib
    /supabase
```

## Key Components
### Supabase Client
- **Location**: `/src/lib/supabase`
- **Purpose**: Server, Client, and Middleware tools for authentication.

### NewTaskModal
- **Location**: `src/components/NewTaskModal.tsx`
- **Purpose**: High-fidelity modal for creating tasks with custom priority selector and icon-based form fields.
- **Notes**: Uses Lucide icons and premium design tokens.

### TaskDetailModal
- **Location**: `src/components/TaskDetailModal.tsx`
- **Purpose**: Redesigned task inspection modal with threaded comments and status controls.
- **Notes**: High-density information layout with smooth transitions.

## Configuration
- **Environment Variables**: See `.env.example`
- **API Endpoints**: TBD
- **Database Schema**: Managed in Supabase

## Development Notes
### Robustness Policy
- **Interaction Guards**: Every async UI handler MUST include `if (loadingState) return;` at the top to prevent race conditions.
- **Server Deduplication**: Creation actions (tasks, comments) MUST include a 5-10s deduplication window based on user/body hash.
- **UI Consistency**: Follow `ui-ux-pro-max` guidelines for white/light clean themes with smooth animations.
