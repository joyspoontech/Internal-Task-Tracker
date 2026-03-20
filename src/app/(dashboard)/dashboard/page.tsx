import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import CreateTaskButton from '@/components/CreateTaskButton'
import TaskListClient from '@/components/TaskListClient'
import AnalyticsChart from '@/components/AnalyticsChart'
import RealtimeListener from '@/components/RealtimeListener'
import ExportButton from '@/components/ExportButton'

// ── Data Fetching Helpers ────────────────────────────────────
async function fetchTasksCreatedBy(userId: string) {
    const supabase = await createClient()
    const { data } = await supabase
        .from('tasks')
        .select(`id, title, description, priority, status, due_date, rejection_reason, assignee_id, creator_id, assignee:assignee_id(full_name), creator:creator_id(full_name)`)
        .eq('creator_id', userId)
        .order('created_at', { ascending: false })
    return (data || []) as any[]
}

async function fetchOrgTasks(orgId: string) {
    const supabase = await createClient()
    const { data } = await supabase
        .from('tasks')
        .select(`id, title, description, priority, status, due_date, rejection_reason, assignee_id, creator_id, assignee:assignee_id(full_name), creator:creator_id(full_name)`)
        .eq('org_id', orgId)
        .order('created_at', { ascending: false })
    return (data || []) as any[]
}

async function fetchTasksAssignedTo(userId: string) {
    const supabase = await createClient()
    const { data } = await supabase
        .from('tasks')
        .select(`id, title, description, priority, status, due_date, rejection_reason, assignee_id, creator_id, assignee:assignee_id(full_name), creator:creator_id(full_name)`)
        .eq('assignee_id', userId)
        .order('due_date', { ascending: true })
    return (data || []) as any[]
}

async function fetchDeptTasks(orgId: string, department: string) {
    const supabase = await createClient()
    // We need to find tasks where EITHER creator OR assignee is in the department
    // Since department is on the user profile, we use a join-like filter
    const { data } = await supabase
        .from('tasks')
        .select(`
            id, title, description, priority, status, due_date, rejection_reason, assignee_id, creator_id,
            assignee:assignee_id(full_name, department),
            creator:creator_id(full_name, department)
        `)
        .eq('org_id', orgId)
        .or(`assignee.department.eq."${department}",creator.department.eq."${department}"`)
        .order('created_at', { ascending: false })
    
    return (data || []) as any[]
}

// ── Page Component ───────────────────────────────────────────
export default async function DashboardPage() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return redirect('/login')

    const { data: profile } = await supabase
        .from('users')
        .select('org_id, role, full_name, department')
        .eq('id', user.id)
        .single()

    if (!profile) return redirect('/login')

    const role = profile.role

    // ── DATA PREPARATION (Role-scoped visibility & History splitting) ─
    const showOrgOverview = role === 'Founder' || role === 'Admin'
    const isManager = role === 'Manager'

    const rawTasksGiven = showOrgOverview 
        ? await fetchOrgTasks(profile.org_id)
        : await fetchTasksCreatedBy(user.id)
    
    const rawTasksAssigned = await fetchTasksAssignedTo(user.id)

    // Helper to filter active vs history
    const isActive = (t: any) => t.status !== 'Completed' && t.status !== 'Rejected'
    const isHistory = (t: any) => t.status === 'Completed' || t.status === 'Rejected'

    const activeTasksGiven = rawTasksGiven.filter(isActive)
    const activeTasksAssigned = rawTasksAssigned.filter(isActive)
    
    // 📂 HISTORY FILTERING LOGIC
    let historyTasks: any[] = []

    if (showOrgOverview) {
        // Founder/Admin: All tasks in the org
        historyTasks = rawTasksGiven.filter(isHistory)
    } else if (isManager && profile.department) {
        // Manager: All tasks in their department
        const deptTasks = await fetchDeptTasks(profile.org_id, profile.department)
        historyTasks = deptTasks.filter(isHistory)
    } else {
        // Employee: Only their own given and assigned tasks
        historyTasks = [...rawTasksGiven, ...rawTasksAssigned]
            .filter(isHistory)
            .filter((v, i, a) => a.findIndex(t => t.id === v.id) === i)
    }

    historyTasks.sort((a, b) => new Date(b.due_date || b.created_at || 0).getTime() - new Date(a.due_date || a.created_at || 0).getTime())

    const allHistory = historyTasks // Renaming for clarity in the JSX below

    // Subordinates: Managers/Admins/Founders see the org, Employees only see themselves
    let subordinates: any[] = []
    
    if (role === 'Employee') {
        subordinates = [{
            id: user.id,
            full_name: profile.full_name,
            role: profile.role,
            department: profile.department
        }]
    } else {
        const { data: subs } = await supabase
            .from('users')
            .select('id, full_name, role, department')
            .eq('org_id', profile.org_id)
            .in('role', ['Manager', 'Employee'])
            .neq('id', user.id)
            .order('full_name')
        subordinates = subs || []
    }

    return (
        <div className="space-y-12">
            <RealtimeListener orgId={profile.org_id} />

            {/* Analytics Row */}
            <div>
                <AnalyticsChart />
            </div>

            <div className="grid lg:grid-cols-2 gap-10">
                {/* Left: Tasks Given / Org Overview */}
                <div className="space-y-6">
                    <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-100 shadow-sm shadow-slate-200/50">
                        <div>
                            <h2 className="text-xl font-bold text-[var(--primary)] tracking-tight">
                                {showOrgOverview ? 'Organization Overview' : 'Tasks Given'}
                            </h2>
                            <p className="text-[10px] uppercase font-bold text-slate-400 tracking-widest mt-0.5">Active Tasks</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <ExportButton tasks={rawTasksGiven} filename={showOrgOverview ? 'org-tasks-overview.csv' : 'my-tasks-given.csv'} />
                            <CreateTaskButton subordinates={subordinates} />
                        </div>
                    </div>
                    <TaskListClient
                        tasks={activeTasksGiven}
                        isAssignee={false}
                        emptyMessage={showOrgOverview ? "No active tasks in the organization." : "No active tasks created by you."}
                    />
                </div>

                {/* Right: Assigned to Me */}
                <div className="space-y-6">
                    <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-100 shadow-sm shadow-slate-200/50">
                        <div>
                            <h2 className="text-xl font-bold text-[var(--primary)] tracking-tight">Assigned to Me</h2>
                            <p className="text-[10px] uppercase font-bold text-slate-400 tracking-widest mt-0.5">Focus List</p>
                        </div>
                        <ExportButton tasks={rawTasksAssigned} filename="my-assigned-tasks.csv" />
                    </div>
                    <TaskListClient
                        tasks={activeTasksAssigned}
                        isAssignee={true}
                        emptyMessage="You have no incoming active tasks."
                    />
                </div>
            </div>

            {/* Task History Section */}
            <div className="pt-10 border-t border-slate-100">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 px-2">
                    <div>
                        <h2 className="text-2xl font-bold text-[var(--primary)] tracking-tight">Task History</h2>
                        <p className="text-sm text-slate-500 font-medium">Archived view of completed and rejected tasks.</p>
                    </div>
                    {allHistory.length > 0 && (
                        <ExportButton tasks={allHistory} filename="task-history.csv" />
                    )}
                </div>
                
                {allHistory.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <TaskListClient
                            tasks={allHistory}
                            isAssignee={false} // Label as manager typically for history
                            emptyMessage="Your history is empty."
                        />
                    </div>
                ) : (
                    <div className="py-12 bg-slate-50/50 border-2 border-dashed border-slate-200 rounded-3xl text-center">
                        <p className="text-slate-400 text-sm font-medium italic">No history to show yet.</p>
                    </div>
                )}
            </div>
        </div>
    )
}
