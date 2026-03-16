'use client'
import { createTask } from '@/app/actions/tasks'
import { useState, useRef } from 'react'
import { X, Calendar, User, AlignLeft, Flag } from 'lucide-react'

type UserProfile = {
    id: string
    full_name: string
    role: string
    department: string | null
}

export default function NewTaskModal({ subordinates, onClose }: { subordinates: UserProfile[], onClose: () => void }) {
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [selectedPriority, setSelectedPriority] = useState('Medium')
    const formRef = useRef<HTMLFormElement>(null)

    async function handleSubmit(formData: FormData) {
        setIsSubmitting(true)
        // Add priority manually since we're using custom chips
        formData.set('priority', selectedPriority)
        await createTask(formData)
        setIsSubmitting(false)
        onClose()
    }

    const priorities = [
        { name: 'Low', color: 'bg-emerald-50 text-emerald-600 border-emerald-100', active: 'bg-emerald-600 text-white border-emerald-600' },
        { name: 'Medium', color: 'bg-orange-50 text-orange-600 border-orange-100', active: 'bg-orange-600 text-white border-orange-600' },
        { name: 'High', color: 'bg-red-50 text-red-600 border-red-100', active: 'bg-red-600 text-white border-red-600' }
    ]

    return (
        <div className="fixed inset-0 w-screen h-screen bg-slate-900/60 backdrop-blur-xl flex items-center justify-center p-4 z-[60] animate-in fade-in duration-300 left-0 top-0">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-300 border border-slate-200/60">
                {/* Header */}
                <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <div>
                        <h2 className="text-xl font-bold text-slate-900 tracking-tight">Create New Task</h2>
                        <p className="text-xs text-slate-500 mt-0.5">Fill in the details to assign a new follow-up.</p>
                    </div>
                    <button 
                        onClick={onClose} 
                        className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-all"
                    >
                        <X size={20} />
                    </button>
                </div>

                <form ref={formRef} action={handleSubmit} className="p-6 space-y-5">
                    {/* Title */}
                    <div className="space-y-1.5">
                        <label className="text-[13px] font-semibold text-slate-700 flex items-center gap-2" htmlFor="title">
                            Task Title
                        </label>
                        <input
                            id="title" name="title" type="text"
                            placeholder="e.g. Review Q3 Sales Report"
                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/30 focus:bg-white focus:border-[var(--cta)] focus:ring-4 focus:ring-[var(--cta)]/5 transition-all outline-none text-sm"
                            required
                        />
                    </div>

                    {/* Description */}
                    <div className="space-y-1.5">
                        <label className="text-[13px] font-semibold text-slate-700 flex items-center gap-2" htmlFor="description">
                            Description
                        </label>
                        <div className="relative">
                            <textarea
                                id="description" name="description"
                                placeholder="Provide details about the task..."
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50/30 focus:bg-white focus:border-[var(--cta)] focus:ring-4 focus:ring-[var(--cta)]/5 transition-all outline-none text-sm h-28 resize-none leading-relaxed"
                            />
                        </div>
                    </div>

                    {/* Assignee & Due Date Row */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-[13px] font-semibold text-slate-700 flex items-center gap-2" htmlFor="assignee_id">
                                Assignee
                            </label>
                            <div className="relative">
                                <select 
                                    id="assignee_id" 
                                    name="assignee_id" 
                                    className="w-full pl-4 pr-10 py-2.5 rounded-xl border border-slate-200 bg-slate-50/30 focus:bg-white focus:border-[var(--cta)] focus:ring-4 focus:ring-[var(--cta)]/5 transition-all outline-none text-sm appearance-none"
                                    required
                                >
                                    <option value="">Select member...</option>
                                    {subordinates.map(sub => (
                                        <option key={sub.id} value={sub.id}>
                                            {sub.full_name}
                                        </option>
                                    ))}
                                </select>
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                    <User size={16} />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[13px] font-semibold text-slate-700 flex items-center gap-2" htmlFor="due_date">
                                Due Date
                            </label>
                            <div className="relative">
                                <input
                                    id="due_date" name="due_date" type="date"
                                    className="w-full pl-4 pr-10 py-2.5 rounded-xl border border-slate-200 bg-slate-50/30 focus:bg-white focus:border-[var(--cta)] focus:ring-4 focus:ring-[var(--cta)]/5 transition-all outline-none text-sm"
                                    required
                                />
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                    <Calendar size={16} />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Priority Selector */}
                    <div className="space-y-2.5">
                        <label className="text-[13px] font-semibold text-slate-700 flex items-center gap-2">
                            Priority
                        </label>
                        <div className="flex bg-slate-100/50 p-1 rounded-xl gap-1">
                            {priorities.map((p) => (
                                <button
                                    key={p.name}
                                    type="button"
                                    onClick={() => setSelectedPriority(p.name)}
                                    className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold border transition-all duration-200 ${
                                        selectedPriority === p.name ? p.active : 'text-slate-500 border-transparent hover:bg-white'
                                    }`}
                                >
                                    {p.name}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="pt-2 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-5 py-2.5 text-sm font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className={`px-6 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-sky-900/10 active:scale-95 transition-all flex items-center gap-2 ${
                                isSubmitting ? 'bg-slate-100 text-slate-400' : 'bg-sky-600 text-white hover:bg-sky-700'
                            }`}
                        >
                            {isSubmitting ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
                                    Creating...
                                </>
                            ) : 'Create Task'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
