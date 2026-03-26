'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { sendNotification } from '@/lib/notifications'
import { calculateReminderSchedule } from '@/lib/reminders'

// ── Create Task ──────────────────────────────────────────────
export async function createTask(formData: FormData) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    const { data: profile } = await supabase
        .from('users')
        .select('org_id, full_name, email')
        .eq('id', user.id)
        .single()

    if (!profile) throw new Error('Profile not found')

    const title = formData.get('title') as string
    const description = formData.get('description') as string
    const priority = formData.get('priority') as string
    const due_date = formData.get('due_date') as string
    const assignee_id = formData.get('assignee_id') as string
    const given_by_id = formData.get('given_by_id') as string // Employee self-task: manager who gave the task
    const is_self_task = formData.get('is_self_task') === 'true'

    // ── Duplicate Prevention ──
    // Check if an identical task was created by this user in the last 10 seconds
    const tenSecondsAgo = new Date(Date.now() - 10000).toISOString()
    const { data: existingTask } = await supabase
        .from('tasks')
        .select('id')
        .eq('creator_id', user.id)
        .eq('org_id', profile.org_id)
        .eq('title', title)
        .eq('description', description || '')
        .eq('assignee_id', is_self_task ? user.id : (assignee_id || user.id))
        .gt('created_at', tenSecondsAgo)
        .limit(1)
        .maybeSingle()

    if (existingTask) {
        console.log('Duplicate task detected, skipping insertion')
        return { success: true, message: 'Duplicate detected, skipped insertion' }
    }

    const due_date_iso = due_date ? new Date(due_date).toISOString() : null
    const reminder_schedule = due_date_iso ? calculateReminderSchedule(due_date_iso) : null

    let finalAssigneeId = assignee_id || user.id
    let initialStatus = 'Pending Acceptance'

    if (is_self_task) {
        // EMPLOYEE SELF-TASK FLOW:
        // Employee is BOTH creator and assignee — task immediately active
        finalAssigneeId = user.id
        initialStatus = 'Not Started'
    } else if (finalAssigneeId === user.id) {
        initialStatus = 'Not Started'
    } else {
        // Check if assigning upward to a manager — auto-accept
        const { data: assigneeProfile } = await supabase
            .from('users')
            .select('role')
            .eq('id', finalAssigneeId)
            .single()
        
        if (assigneeProfile && ['Manager', 'Founder', 'Admin'].includes(assigneeProfile.role)) {
            initialStatus = 'Not Started'
        }
    }

    const { data: newTask, error } = await supabase
        .from('tasks')
        .insert([{
            title,
            description,
            priority,
            due_date: due_date_iso,
            reminder_schedule,
            assignee_id: finalAssigneeId,
            creator_id: user.id, // Always the actual person who created the task
            org_id: profile.org_id,
            status: initialStatus
        }])
        .select('id')
        .single()

    if (error) {
        console.error('Error creating task:', error)
        return { error: error.message }
    }

    // For employee self-tasks: notify the manager who gave the task (if selected)
    if (is_self_task && given_by_id && newTask) {
        const { data: manager } = await supabase
            .from('users')
            .select('id, full_name, email, whatsapp_no')
            .eq('id', given_by_id)
            .single()

        if (manager) {
            await sendNotification({
                type: 'task_created',
                task: { id: newTask.id, title, description, priority, due_date },
                recipient: manager,
                sender: { id: user.id, full_name: profile.full_name, email: profile.email },
            })
        }
    }

    // For standard flow: notify the assignee (skip if self-assign)
    if (!is_self_task && finalAssigneeId && newTask && finalAssigneeId !== user.id) {
        const { data: assignee } = await supabase
            .from('users')
            .select('id, full_name, email, whatsapp_no')
            .eq('id', finalAssigneeId)
            .single()

        if (assignee) {
            await sendNotification({
                type: 'task_created',
                task: { id: newTask.id, title, description, priority, due_date },
                recipient: assignee,
                sender: { id: user.id, full_name: profile.full_name, email: profile.email },
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

    // Idempotency check: don't notify if the status hasn't actually changed
    // We get the previous status first
    const { data: oldTask } = await supabase
        .from('tasks')
        .select('status')
        .eq('id', taskId)
        .single()

    if (oldTask?.status === newStatus) {
        return { success: true, message: 'Status unchanged, skipping notification' }
    }

    const { error } = await supabase
        .from('tasks')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', taskId)

    if (error) {
        console.error('Error updating task status:', error)
        return { error: error.message }
    }

    // Fire notifications for Blocked and Completed status changes 
    // IF the status actually changed (checked above)
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
                .select('id, full_name, email')
                .eq('id', user.id)
                .single()

            if (creator) {
                await sendNotification({
                    type: newStatus === 'Blocked' ? 'task_blocked' : 'task_completed',
                    task,
                    recipient: creator,
                    sender: changer ? { id: changer.id, full_name: changer.full_name, email: changer.email } : undefined,
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
            .select('id, full_name, email')
            .eq('id', user.id)
            .single()

        if (creator) {
            await sendNotification({
                type: accept ? 'task_accepted' : 'task_rejected',
                task: { ...task, rejection_reason: reason },
                recipient: creator,
                sender: responder ? { id: responder.id, full_name: responder.full_name, email: responder.email } : undefined,
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

    // ── Duplicate Prevention ──
    const fiveSecondsAgo = new Date(Date.now() - 5000).toISOString()
    const { data: existingComment } = await supabase
        .from('comments')
        .select('id')
        .eq('task_id', taskId)
        .eq('user_id', user.id)
        .eq('body', body)
        .gt('created_at', fiveSecondsAgo)
        .limit(1)
        .maybeSingle()

    if (existingComment) {
        return { success: true, message: 'Duplicate comment detected' }
    }

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
