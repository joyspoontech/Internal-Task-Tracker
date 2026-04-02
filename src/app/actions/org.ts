'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// ── Update Organization Departments ──────────────────────────
export async function updateOrgDepartments(orgId: string, departments: string[]) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    // Verify user is Founder or Admin
    const { data: profile } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single()

    if (profile?.role !== 'Founder' && profile?.role !== 'Admin') {
        throw new Error('Forbidden')
    }

    const { error } = await supabase
        .from('organisations')
        .update({ departments })
        .eq('id', orgId)

    if (error) {
        console.error('Error updating departments:', error)
        return { error: error.message }
    }

    revalidatePath('/dashboard/settings')
    return { success: true }
}

// ── Update User Role and Department (Founder/Admin only) ───────
export async function updateUserProfile(targetUserId: string, updates: { 
    role?: string, 
    department?: string | null, 
    full_name?: string,
    email?: string,
    whatsapp_no?: string | null
}) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    // Verify user is Founder or Admin
    const { data: profile } = await supabase
        .from('users')
        .select('role, org_id')
        .eq('id', user.id)
        .single()

    if (profile?.role !== 'Founder' && profile?.role !== 'Admin') {
        throw new Error('Forbidden')
    }

    const { error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', targetUserId)
        .eq('org_id', profile.org_id) // Ensure they are in the same org

    if (error) {
        console.error('Error updating user profile:', error)
        return { error: error.message }
    }

    revalidatePath('/dashboard/settings')
    revalidatePath('/dashboard/profile')
    return { success: true }
}

// ── Update Own Profile ──────────────────────────────────────────
export async function updateOwnProfile(updates: { 
    full_name?: string,
    whatsapp_no?: string | null
}) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    const { error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', user.id)

    if (error) {
        console.error('Error updating own profile:', error)
        return { error: error.message }
    }

    revalidatePath('/dashboard/profile')
    revalidatePath('/dashboard', 'layout')
    return { success: true }
}
