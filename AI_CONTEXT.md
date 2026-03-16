# AI Context for Follow-Up Tracker

## Project Overview
- **Purpose**: Autonomous reminder and task-information exchange web application (MVP).
- **Tech Stack**: Next.js 14 App Router, Supabase (Auth, Postgres, Realtime), Tailwind CSS.
- **Architecture**: Role-based access (Founder, Manager, Employee, Admin). Supabase client on browser and server.

## Current State
- **Version**: 0.1.0
- **Status**: In Development
- **Last Updated**: March 2026

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
Follow ui-ux-pro-max guidelines for white/light clean themes with smooth animations.
