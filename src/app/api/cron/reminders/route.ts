import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

/**
 * Cron Reminder API Route
 * Called every 15 minutes by an external cron scheduler (Vercel Cron, GitHub Actions, etc.)
 * Checks tasks.reminder_schedule for upcoming reminders and fires them to n8n.
 * 
 * Protected by CRON_SECRET header.
 */
export async function GET(request: Request) {
    // Verify cron secret
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!serviceRoleKey) {
        return NextResponse.json({ error: 'SUPABASE_SERVICE_ROLE_KEY is not configured' }, { status: 500 })
    }

    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        serviceRoleKey
    )

    const webhookUrl = process.env.N8N_WEBHOOK_URL
    if (!webhookUrl) {
        return NextResponse.json({ error: 'N8N_WEBHOOK_URL not configured' }, { status: 500 })
    }

    const now = new Date()
    const fifteenMinAgo = new Date(now.getTime() - 15 * 60 * 1000)

    // Find tasks with reminder_schedule entries in the last 15 minutes
    // that haven't been sent yet
    const { data: tasks, error } = await supabase
        .from('tasks')
        .select(`
            id, title, description, priority, status, due_date, reminder_schedule, org_id,
            assignee:assignee_id(id, full_name, email, whatsapp_no),
            creator:creator_id(id, full_name, email)
        `)
        .neq('status', 'Completed')

    if (error) {
        console.error('[Cron] Error fetching tasks:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    let sentCount = 0

    for (const task of tasks || []) {
        if (!task.reminder_schedule || !Array.isArray(task.reminder_schedule)) continue

        for (const reminderTime of task.reminder_schedule) {
            const reminderDate = new Date(reminderTime)

            // Check if reminder is within the last 15 min window
            if (reminderDate >= fifteenMinAgo && reminderDate <= now) {
                // Check if already sent
                const { data: alreadySent } = await supabase
                    .from('sent_reminders')
                    .select('id')
                    .eq('task_id', task.id)
                    .eq('reminder_at', reminderTime)
                    .limit(1)

                if (alreadySent && alreadySent.length > 0) continue

                // Send to n8n
                const assignee = task.assignee as any
                if (assignee) {
                    try {
                        await fetch(webhookUrl, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                type: 'task_reminder',
                                task: {
                                    id: task.id,
                                    title: task.title,
                                    description: task.description,
                                    priority: task.priority,
                                    status: task.status,
                                    due_date: task.due_date,
                                },
                                recipient: {
                                    id: assignee.id,
                                    full_name: assignee.full_name,
                                    email: assignee.email,
                                    whatsapp_no: assignee.whatsapp_no,
                                },
                                timestamp: now.toISOString(),
                            }),
                        })

                        // Mark as sent
                        await supabase.from('sent_reminders').insert([{
                            task_id: task.id,
                            user_id: assignee.id,
                            channel: 'email',
                            sent_at: now.toISOString(),
                            reminder_at: reminderTime,
                        }])

                        sentCount++
                    } catch (err) {
                        console.error(`[Cron] Failed to send reminder for task ${task.id}:`, err)
                    }
                }
            }
        }
    }

    // Also check for overdue tasks (deadline passed, not completed)
    const { data: overdueTasks } = await supabase
        .from('tasks')
        .select(`
            id, title, priority, status, due_date,
            assignee:assignee_id(id, full_name, email, whatsapp_no),
            creator:creator_id(id, full_name, email)
        `)
        .neq('status', 'Completed')
        .lt('due_date', now.toISOString())

    for (const task of overdueTasks || []) {
        // Check if overdue alert already sent today
        const todayStart = new Date(now)
        todayStart.setHours(0, 0, 0, 0)

        const { data: alreadySent } = await supabase
            .from('sent_reminders')
            .select('id')
            .eq('task_id', task.id)
            .gte('sent_at', todayStart.toISOString())
            .limit(1)

        if (alreadySent && alreadySent.length > 0) continue

        const assignee = task.assignee as any
        const creator = task.creator as any

        if (assignee) {
            try {
                await fetch(webhookUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        type: 'task_overdue',
                        task: { id: task.id, title: task.title, priority: task.priority, due_date: task.due_date },
                        recipient: assignee,
                        sender: creator ? { id: creator.id, full_name: creator.full_name } : undefined,
                        timestamp: now.toISOString(),
                    }),
                })

                await supabase.from('sent_reminders').insert([{
                    task_id: task.id,
                    user_id: assignee.id,
                    channel: 'email',
                    sent_at: now.toISOString(),
                    reminder_at: now.toISOString(),
                }])

                sentCount++
            } catch (err) {
                console.error(`[Cron] Failed overdue alert for task ${task.id}:`, err)
            }
        }
    }

    return NextResponse.json({ success: true, reminders_sent: sentCount })
}
