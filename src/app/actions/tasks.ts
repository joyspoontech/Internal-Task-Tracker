'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { sendNotification } from '@/lib/notifications'

// ── Create Task ──────────────────────────────────────────────
export async function createTask(formData: FormData) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    const { data: profile } = await supabase
        .from('users')
        .select('org_id, full_name')
        .eq('id', user.id)
        .single()

    if (!profile) throw new Error('Profile not found')

    const title = formData.get('title') as string
    const description = formData.get('description') as string
    const priority = formData.get('priority') as string
    const due_date = formData.get('due_date') as string
    const assignee_id = formData.get('assignee_id') as string

    const { data: newTask, error } = await supabase
        .from('tasks')
        .insert([{
            title,
            description,
            priority,
            due_date: due_date ? new Date(due_date).toISOString() : null,
            assignee_id,
            creator_id: user.id,
            org_id: profile.org_id,
            status: 'Pending Acceptance'
        }])
        .select('id')
        .single()

    if (error) {
        console.error('Error creating task:', error)
        return { error: error.message }
    }

    // Fire n8n notification to assignee
    if (assignee_id && newTask) {
        const { data: assignee } = await supabase
            .from('users')
            .select('id, full_name, email, whatsapp_no')
            .eq('id', assignee_id)
            .single()

        if (assignee) {
            await sendNotification({
                type: 'task_created',
                task: { id: newTask.id, title, description, priority, due_date },
                recipient: assignee,
                sender: { id: user.id, full_name: profile.full_name },
            })
        }
    }

    revalidatePath('/dashboard', 'layout')
    return { success: true }
}

// ── Update Task Status ───────────────────────────────────────
export async function updateTaskStatus(taskId: string, newStatus: string) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    const { error } = await supabase
        .from('tasks')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', taskId)

    if (error) {
        console.error('Error updating task status:', error)
        return { error: error.message }
    }

    // Fire notifications for Blocked and Completed status changes
    if (newStatus === 'Blocked' || newStatus === 'Completed') {
        const { data: task } = await supabase
            .from('tasks')
            .select('id, title, description, priority, status, due_date, creator_id, assignee_id')
            .eq('id', taskId)
            .single()

        if (task) {
            // Notify the creator (manager/founder) about the status change
            const { data: creator } = await supabase
                .from('users')
                .select('id, full_name, email, whatsapp_no')
                .eq('id', task.creator_id)
                .single()

            const { data: changer } = await supabase
                .from('users')
                .select('id, full_name')
                .eq('id', user.id)
                .single()

            if (creator) {
                await sendNotification({
                    type: newStatus === 'Blocked' ? 'task_blocked' : 'task_completed',
                    task,
                    recipient: creator,
                    sender: changer ? { id: changer.id, full_name: changer.full_name } : undefined,
                })
            }
        }
    }

    revalidatePath('/dashboard', 'layout')
    return { success: true }
}

// ── Respond to Task (Accept/Reject) ──────────────────────────
export async function respondToTask(taskId: string, accept: boolean, reason?: string) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    const newStatus = accept ? 'Not Started' : 'Rejected'
    const updateData: any = { 
        status: newStatus, 
        updated_at: new Date().toISOString() 
    }
    
    if (!accept && reason) {
        updateData.rejection_reason = reason
    }

    const { error } = await supabase
        .from('tasks')
        .update(updateData)
        .eq('id', taskId)

    if (error) {
        console.error('Error responding to task:', error)
        return { error: error.message }
    }

    // Notify the creator about the response
    const { data: task } = await supabase
        .from('tasks')
        .select('id, title, creator_id')
        .eq('id', taskId)
        .single()

    if (task) {
        const { data: creator } = await supabase
            .from('users')
            .select('id, full_name, email, whatsapp_no')
            .eq('id', task.creator_id)
            .single()

        const { data: responder } = await supabase
            .from('users')
            .select('id, full_name')
            .eq('id', user.id)
            .single()

        if (creator) {
            await sendNotification({
                type: accept ? 'task_accepted' : 'task_rejected',
                task: { ...task, rejection_reason: reason },
                recipient: creator,
                sender: responder ? { id: responder.id, full_name: responder.full_name } : undefined,
            })
        }
    }

    revalidatePath('/dashboard', 'layout')
    return { success: true }
}

// ── Add Comment ──────────────────────────────────────────────
export async function addComment(taskId: string, body: string) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    const { error } = await supabase
        .from('comments')
        .insert([{ task_id: taskId, user_id: user.id, body }])

    if (error) {
        console.error('Error adding comment:', error)
        return { error: error.message }
    }

    revalidatePath('/dashboard', 'layout')
    return { success: true }
}

// ── Get Comments ─────────────────────────────────────────────
export async function getComments(taskId: string) {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('comments')
        .select(`id, body, created_at, user:user_id(full_name)`)
        .eq('task_id', taskId)
        .order('created_at', { ascending: true })

    if (error) {
        console.error('Error fetching comments:', error)
        return []
    }

    return data || []
}

// ── Get Analytics (role-scoped) ──────────────────────────────
export async function getAnalytics() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const { data: profile } = await supabase
        .from('users')
        .select('org_id, role')
        .eq('id', user.id)
        .single()

    if (!profile) return null

    // Build task query based on role
    let query = supabase.from('tasks').select('id, status, due_date, updated_at')

    if (profile.role === 'Employee') {
        query = query.eq('assignee_id', user.id)
    } else if (profile.role === 'Manager') {
        query = query.eq('org_id', profile.org_id).or(`creator_id.eq.${user.id},assignee_id.eq.${user.id}`)
    } else {
        // Founder / Admin — org wide
        query = query.eq('org_id', profile.org_id)
    }

    const { data: tasks } = await query

    if (!tasks || tasks.length === 0) {
        return { beforeDeadline: 0, nearingDeadline: 0, afterDeadline: 0, overdue: 0, total: 0 }
    }

    const now = new Date()
    let beforeDeadline = 0
    let nearingDeadline = 0
    let afterDeadline = 0
    let overdue = 0

    for (const task of tasks) {
        if (!task.due_date) continue

        const deadline = new Date(task.due_date)

        if (task.status === 'Completed') {
            const completedAt = task.updated_at ? new Date(task.updated_at) : now
            const hoursBeforeDeadline = (deadline.getTime() - completedAt.getTime()) / (1000 * 60 * 60)

            if (hoursBeforeDeadline > 24) {
                beforeDeadline++
            } else if (hoursBeforeDeadline >= 0) {
                nearingDeadline++
            } else {
                afterDeadline++
            }
        } else {
            if (now > deadline) {
                overdue++
            }
        }
    }

    return {
        beforeDeadline,
        nearingDeadline,
        afterDeadline,
        overdue,
        total: tasks.length
    }
}
