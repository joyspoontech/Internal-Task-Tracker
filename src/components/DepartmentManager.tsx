'use client'

import { useState } from 'react'
import { Plus, X } from 'lucide-react'
import { updateOrgDepartments } from '@/app/actions/org'

export default function DepartmentManager({ orgId, initialDepartments }: { orgId: string, initialDepartments: string[] }) {
    const [departments, setDepartments] = useState<string[]>(initialDepartments)
    const [newDept, setNewDept] = useState('')
    const [isSaving, setIsSaving] = useState(false)

    async function handleAdd() {
        if (isSaving || !newDept.trim()) return
        if (departments.includes(newDept.trim())) return
        
        const updated = [...departments, newDept.trim()]
        setDepartments(updated)
        setNewDept('')
        await save(updated)
    }

    async function handleRemove(name: string) {
        if (isSaving) return
        const updated = departments.filter(d => d !== name)
        setDepartments(updated)
        await save(updated)
    }

    async function save(list: string[]) {
        setIsSaving(true)
        await updateOrgDepartments(orgId, list)
        setIsSaving(false)
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap gap-2">
                {departments.map((dept) => (
                    <div 
                        key={dept} 
                        className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium border border-slate-200 group hover:bg-white hover:border-slate-300 transition-all"
                    >
                        {dept}
                        <button 
                            disabled={isSaving}
                            onClick={() => handleRemove(dept)}
                            className="p-0.5 hover:bg-rose-100 hover:text-rose-600 rounded transition-colors opacity-0 group-hover:opacity-100"
                        >
                            <X size={14} />
                        </button>
                    </div>
                ))}
            </div>

            <div className="flex gap-2 max-w-sm">
                <input 
                    type="text" 
                    value={newDept}
                    onChange={(e) => setNewDept(e.target.value)}
                    placeholder="New department name..."
                    className="flex-1 px-4 py-2 rounded-xl border border-slate-200 bg-slate-50/30 focus:bg-white focus:border-[var(--cta)] focus:ring-4 focus:ring-[var(--cta)]/5 transition-all outline-none text-sm"
                    onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                />
                <button 
                    onClick={handleAdd}
                    disabled={isSaving || !newDept.trim()}
                    className="p-2 bg-[var(--cta)] text-white rounded-xl hover:bg-sky-600 disabled:opacity-50 transition-all shadow-sm active:scale-95"
                >
                    <Plus size={20} />
                </button>
            </div>
            
            {isSaving && (
                <p className="text-[10px] text-slate-400 animate-pulse font-medium uppercase tracking-wider">Saving changes...</p>
            )}
        </div>
    )
}
