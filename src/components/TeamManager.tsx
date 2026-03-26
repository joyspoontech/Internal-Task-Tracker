'use client'

import { useState } from 'react'
import { updateUserProfile } from '@/app/actions/org'
import { Check, Loader2, Mail, Phone, User } from 'lucide-react'

type Member = {
    id: string
    full_name: string
    email: string
    role: string
    department: string | null
    whatsapp_no: string | null
}

export default function TeamManager({ members, departments, currentUserId }: { members: Member[], departments: string[], currentUserId: string }) {
    const roles = ['Founder', 'Manager', 'Employee', 'Admin']
    const [updatingId, setUpdatingId] = useState<string | null>(null)
    const [feedback, setFeedback] = useState<{ id: string, message: string, type: 'success' | 'error' } | null>(null)

    async function handleUpdate(id: string, updates: Partial<Member>) {
        if (updatingId === id) return
        setUpdatingId(id)
        setFeedback(null)
        const res = await updateUserProfile(id, updates)
        setUpdatingId(null)
        
        if (res.success) {
            setFeedback({ id, message: 'Saved!', type: 'success' })
            setTimeout(() => setFeedback(null), 2000)
        } else {
            setFeedback({ id, message: res.error || 'Failed', type: 'error' })
        }
    }

    return (
        <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="px-6 py-4 text-[13px] font-bold text-slate-700">Member</th>
                    <th className="px-6 py-4 text-[13px] font-bold text-slate-700">Role</th>
                    <th className="px-6 py-4 text-[13px] font-bold text-slate-700">Department</th>
                    <th className="px-6 py-4 text-[13px] font-bold text-slate-700">Contact Details</th>
                    <th className="px-6 py-4 text-[13px] font-bold text-slate-700"></th>
                </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
                {members.map((m) => (
                    <tr key={m.id} className="hover:bg-slate-50/50 transition-colors group">
                        <td className="px-6 py-4">
                            <div className="flex flex-col gap-1">
                                <div className="flex items-center gap-2">
                                    <User size={12} className="text-slate-400" />
                                    <input 
                                        type="text"
                                        defaultValue={m.full_name}
                                        onBlur={(e) => e.target.value !== m.full_name && handleUpdate(m.id, { full_name: e.target.value })}
                                        className="text-sm font-bold text-slate-900 border-none bg-transparent p-0 focus:ring-0 w-full hover:bg-slate-100 rounded px-1 -ml-1 transition-colors"
                                    />
                                </div>
                                <div className="flex items-center gap-2">
                                    <Mail size={12} className="text-slate-400" />
                                    <input 
                                        type="email"
                                        defaultValue={m.email}
                                        onBlur={(e) => e.target.value !== m.email && handleUpdate(m.id, { email: e.target.value })}
                                        className="text-xs text-slate-500 border-none bg-transparent p-0 focus:ring-0 w-full hover:bg-slate-100 rounded px-1 -ml-1 transition-colors"
                                    />
                                </div>
                            </div>
                        </td>
                        <td className="px-6 py-4">
                            <select 
                                value={m.role}
                                disabled={m.id === currentUserId || updatingId === m.id}
                                onChange={(e) => handleUpdate(m.id, { role: e.target.value })}
                                className="bg-transparent border-none text-xs font-semibold text-slate-600 focus:ring-0 cursor-pointer hover:text-sky-600 disabled:opacity-50 p-0"
                            >
                                {roles.map(r => <option key={r} value={r}>{r}</option>)}
                            </select>
                        </td>
                        <td className="px-6 py-4">
                            <select 
                                value={m.department || ''}
                                disabled={updatingId === m.id}
                                onChange={(e) => handleUpdate(m.id, { department: e.target.value })}
                                className="bg-transparent border-none text-xs font-semibold text-slate-600 focus:ring-0 cursor-pointer hover:text-sky-600 disabled:opacity-50 p-0"
                            >
                                <option value="">No Department</option>
                                {departments.map(d => <option key={d} value={d}>{d}</option>)}
                            </select>
                        </td>
                        <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                                <Phone size={12} className="text-slate-400" />
                                <input 
                                    type="text"
                                    defaultValue={m.whatsapp_no || ''}
                                    placeholder="+91..."
                                    onBlur={(e) => (e.target.value || null) !== m.whatsapp_no && handleUpdate(m.id, { whatsapp_no: e.target.value || null })}
                                    className="text-xs text-slate-600 border-none bg-transparent p-0 focus:ring-0 w-32 hover:bg-slate-100 rounded px-1 -ml-1 transition-colors"
                                />
                            </div>
                        </td>
                        <td className="px-6 py-4 w-32">
                            <div className="flex items-center justify-end gap-2">
                                {updatingId === m.id && <Loader2 size={16} className="text-[var(--cta)] animate-spin" />}
                                {feedback?.id === m.id && (
                                    <>
                                        {feedback.type === 'success' ? (
                                            <Check size={16} className="text-emerald-500" />
                                        ) : (
                                            <span className="text-[10px] font-bold text-rose-500 uppercase tracking-tighter truncate max-w-[80px]">
                                                {feedback.message}
                                            </span>
                                        )}
                                    </>
                                )}
                            </div>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    )
}
