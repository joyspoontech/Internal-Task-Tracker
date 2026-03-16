'use server'

/**
 * Notification Service — sends task events to n8n webhook.
 * The n8n workflow handles the actual Email + WhatsApp delivery.
 * 
 * Set N8N_WEBHOOK_URL in your .env.local file.
 */

type NotificationType = 'task_created' | 'task_blocked' | 'task_completed' | 'task_reminder' | 'task_overdue' | 'task_accepted' | 'task_rejected'

interface NotificationPayload {
    type: NotificationType
    task: {
        id: string
        title: string
        description?: string | null
        priority?: string
        status?: string
        due_date?: string | null
        rejection_reason?: string | null
    }
    recipient: {
        id: string
        full_name: string
        email: string
        whatsapp_no?: string | null
    }
    sender?: {
        id: string
        full_name: string
    }
    org_name?: string
    extra?: Record<string, unknown>
}

export async function sendNotification(payload: NotificationPayload) {
    const webhookUrl = process.env.N8N_WEBHOOK_URL

    if (!webhookUrl) {
        console.warn('[Notification] N8N_WEBHOOK_URL not configured, skipping notification:', payload.type)
        return { skipped: true }
    }

    try {
        const res = await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                ...payload,
                timestamp: new Date().toISOString(),
            }),
        })

        if (!res.ok) {
            console.error('[Notification] Webhook failed:', res.status, await res.text())
            return { error: `Webhook returned ${res.status}` }
        }

        console.log(`[Notification] Sent ${payload.type} for task "${payload.task.title}" to ${payload.recipient.email}`)
        return { success: true }
    } catch (err) {
        console.error('[Notification] Network error:', err)
        return { error: 'Network error sending notification' }
    }
}
