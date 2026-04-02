'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// ── Update Organization Departments ──────────────────────────
export async function updateOrgDepartments(orgId: string, departments: string[]) {
    try {
        const supabase = await createClient()

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return { error: 'Unauthorized' }

        // Verify user is Founder or Admin
        const { data: profile } = await supabase
            .from('users')
            .select('role')
            .eq('id', user.id)
            .single()

        const userRole = profile?.role?.toLowerCase()
        if (userRole !== 'founder' && userRole !== 'admin') {
            return { error: 'Forbidden' }
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
    } catch (e: any) {
        console.error('Unexpected error in updateOrgDepartments:', e)
        return { error: e.message || 'An unexpected error occurred' }
    }
}

// ── Update User Role and Department (Founder/Admin only) ───────
export async function updateUserProfile(targetUserId: string, updates: { 
    role?: string, 
    department?: string | null, 
    full_name?: string,
    email?: string,
    whatsapp_no?: string | null
}) {
    try {
        const supabase = await createClient()

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return { error: 'Unauthorized' }

        // Verify user is Founder or Admin
        const { data: profile } = await supabase
            .from('users')
            .select('role, org_id')
            .eq('id', user.id)
            .single()

        if (!profile) return { error: 'Profile not found' }

        const userRole = profile.role?.toLowerCase()
        if (userRole !== 'founder' && userRole !== 'admin') {
            return { error: 'Forbidden' }
        }

        // Clean and validate updates
        if (updates.role) {
            updates.role = updates.role.trim()
            // Map common typos to correct values
            const roleMap: Record<string, string> = {
                'manger': 'Manager',
                'employee': 'Employee',
                'founder': 'Founder',
                'admin': 'Admin'
            }
            const normalizedRole = updates.role.toLowerCase()
            if (roleMap[normalizedRole]) {
                updates.role = roleMap[normalizedRole]
            }
        }
        if (updates.full_name) updates.full_name = updates.full_name.trim()
        if (updates.email) updates.email = updates.email.trim()

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
    } catch (e: any) {
        console.error('Unexpected error in updateUserProfile:', e)
        return { error: e.message || 'An unexpected error occurred' }
    }
}

// ── Update Own Profile ──────────────────────────────────────────
export async function updateOwnProfile(updates: { 
    full_name?: string,
    whatsapp_no?: string | null
}) {
    try {
        const supabase = await createClient()

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return { error: 'Unauthorized' }

        // Clean updates
        if (updates.full_name) updates.full_name = updates.full_name.trim()

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
    } catch (e: any) {
        console.error('Unexpected error in updateOwnProfile:', e)
        return { error: e.message || 'An unexpected error occurred' }
    }
}
