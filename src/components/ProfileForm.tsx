'use client'

import { useState } from 'react'
import { updateOwnProfile } from '@/app/actions/org'
import { User, Phone, Mail, Loader2, CheckCircle2 } from 'lucide-react'

type Profile = {
    id: string
    full_name: string
    email: string
    whatsapp_no: string | null
    role: string
    department: string | null
}

export default function ProfileForm({ profile }: { profile: Profile }) {
    const [isSaving, setIsSaving] = useState(false)
    const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null)

    async function handleSubmit(formData: FormData) {
        if (isSaving) return
        setIsSaving(true)
        setMessage(null)
        
        const full_name = formData.get('full_name') as string
        const whatsapp_no = formData.get('whatsapp_no') as string
        
        const res = await updateOwnProfile({ 
            full_name, 
            whatsapp_no: whatsapp_no || null 
        })

        setIsSaving(false)
        if (res.success) {
            setMessage({ text: 'Profile updated successfully!', type: 'success' })
        } else {
            setMessage({ text: res.error || 'Failed to update profile', type: 'error' })
        }
    }

    return (
        <form action={handleSubmit} className="space-y-6">
            {message && (
                <div className={`p-4 rounded-xl text-sm font-medium flex items-center gap-3 border ${
                    message.type === 'success' 
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                    : 'bg-rose-50 text-rose-700 border-rose-100'
                }`}>
                    {message.type === 'success' && <CheckCircle2 size={18} />}
                    {message.text}
                </div>
            )}

            <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">Email Address</label>
                <div className="flex items-center gap-3 px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-slate-500 cursor-not-allowed">
                    <Mail size={18} className="text-slate-300" />
                    <span className="text-sm font-medium">{profile.email}</span>
                </div>
                <p className="text-[10px] text-slate-400 ml-1">Email cannot be changed manually for security reasons.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1" htmlFor="full_name">Full Name</label>
                    <div className="relative group">
                        <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[var(--cta)] transition-colors" />
                        <input 
                            id="full_name"
                            name="full_name"
                            type="text"
                            defaultValue={profile.full_name}
                            required
                            className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50/10 focus:bg-white focus:border-[var(--cta)] focus:ring-4 focus:ring-[var(--cta)]/5 transition-all outline-none text-sm font-medium text-slate-700"
                        />
                    </div>
                </div>

                <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1" htmlFor="whatsapp_no">WhatsApp Number</label>
                    <div className="relative group">
                        <Phone size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[var(--cta)] transition-colors" />
                        <input 
                            id="whatsapp_no"
                            name="whatsapp_no"
                            type="text"
                            defaultValue={profile.whatsapp_no || ''}
                            placeholder="+91..."
                            className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50/10 focus:bg-white focus:border-[var(--cta)] focus:ring-4 focus:ring-[var(--cta)]/5 transition-all outline-none text-sm font-medium text-slate-700"
                        />
                    </div>
                </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
                <div className="space-y-0.5">
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Your Role</p>
                    <p className="text-sm font-bold text-slate-600">{profile.role} · {profile.department || 'No Department'}</p>
                </div>
                
                <button 
                    type="submit" 
                    disabled={isSaving}
                    className="w-full sm:w-auto px-8 py-3 bg-[var(--cta)] text-white rounded-xl font-bold text-sm shadow-lg shadow-sky-500/20 hover:bg-sky-600 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                    {isSaving ? (
                        <>
                            <Loader2 size={18} className="animate-spin" />
                            Updating...
                        </>
                    ) : 'Save Changes'}
                </button>
            </div>
        </form>
    )
}
