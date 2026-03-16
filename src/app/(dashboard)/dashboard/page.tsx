import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import CreateTaskButton from '@/components/CreateTaskButton'
import TaskListClient from '@/components/TaskListClient'
import AnalyticsChart from '@/components/AnalyticsChart'
import RealtimeListener from '@/components/RealtimeListener'

// ── Data Fetching Helpers ────────────────────────────────────
async function fetchTasksCreatedBy(userId: string) {
    const supabase = await createClient()
    const { data } = await supabase
        .from('tasks')
        .select(`id, title, description, priority, status, due_date, rejection_reason, assignee_id, creator_id, assignee:assignee_id(full_name), creator:creator_id(full_name)`)
        .eq('creator_id', userId)
        .order('created_at', { ascending: false })
    return data || []
}

async function fetchTasksAssignedTo(userId: string) {
    const supabase = await createClient()
    const { data } = await supabase
        .from('tasks')
        .select(`id, title, description, priority, status, due_date, rejection_reason, assignee_id, creator_id, assignee:assignee_id(full_name), creator:creator_id(full_name)`)
        .eq('assignee_id', userId)
        .order('due_date', { ascending: true })
    return data || []
}

// ── Page Component ───────────────────────────────────────────
export default async function DashboardPage() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return redirect('/login')

    const { data: profile } = await supabase
        .from('users')
        .select('org_id, role')
        .eq('id', user.id)
        .single()

    if (!profile) return redirect('/login')

    const role = profile.role

    // ── EMPLOYEE VIEW ────────────────────────────────────────
    if (role === 'Employee') {
        const tasksAssigned = await fetchTasksAssignedTo(user.id)
        return (
            <div className="max-w-4xl mx-auto">
                <RealtimeListener orgId={profile.org_id} />
                <div className="grid md:grid-cols-3 gap-6 mb-8">
                    <div className="md:col-span-2">
                        <h2 className="text-2xl font-bold text-[var(--primary)] mb-4">My Tasks</h2>
                        <TaskListClient
                            tasks={tasksAssigned as any}
                            isAssignee={true}
                            emptyMessage="You have no assigned tasks. Enjoy your day!"
                        />
                    </div>
                    <div>
                        <AnalyticsChart />
                    </div>
                </div>
            </div>
        )
    }

    // ── MANAGER / FOUNDER VIEW ───────────────────────────────
    const tasksGiven = await fetchTasksCreatedBy(user.id)
    const tasksAssigned = await fetchTasksAssignedTo(user.id)

    const { data: subordinates } = await supabase
        .from('users')
        .select('id, full_name, role, department')
        .eq('org_id', profile.org_id)
        .in('role', ['Manager', 'Employee'])
        .neq('id', user.id)
        .order('full_name')

    return (
        <div>
            <RealtimeListener orgId={profile.org_id} />

            {/* Analytics Row */}
            <div className="mb-8">
                <AnalyticsChart />
            </div>

            <div className="grid md:grid-cols-2 gap-8">
                {/* Left: Tasks Given */}
                <div>
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-2xl font-bold text-[var(--primary)]">Tasks Given</h2>
                        <CreateTaskButton subordinates={subordinates || []} />
                    </div>
                    <TaskListClient
                        tasks={tasksGiven as any}
                        isAssignee={false}
                        emptyMessage="No tasks assigned yet. Get started by creating one."
                    />
                </div>

                {/* Right: Assigned to Me */}
                <div>
                    <h2 className="text-2xl font-bold text-[var(--primary)] mb-4">Assigned to Me</h2>
                    <TaskListClient
                        tasks={tasksAssigned as any}
                        isAssignee={true}
                        emptyMessage="You have no incoming tasks."
                    />
                </div>
            </div>
        </div>
    )
}
