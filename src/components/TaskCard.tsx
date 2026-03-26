'use client'

import { updateTaskStatus, respondToTask } from '@/app/actions/tasks'
import { useState, useTransition } from 'react'
import TaskDetailModal from './TaskDetailModal'

type Task = {
    id: string
    title: string
    description: string | null
    priority: string
    status: string
    due_date: string | null
    rejection_reason: string | null
    assignee_id: string
    creator_id: string
    assignee: { full_name: string } | null
    creator: { full_name: string } | null
}

export default function TaskCard({ task, isAssignee = false }: { task: Task, isAssignee?: boolean }) {
    const [isUpdating, setIsUpdating] = useState(false)
    const [isDetailOpen, setIsDetailOpen] = useState(false)
    const [showRejectionForm, setShowRejectionForm] = useState(false)
    const [rejectionReason, setRejectionReason] = useState('')
    const [isPending, startTransition] = useTransition()

    const priorityColors: Record<string, string> = {
        'High': 'bg-red-50 text-red-600 border-red-100',
        'Medium': 'bg-orange-50 text-orange-600 border-orange-100',
        'Low': 'bg-emerald-50 text-emerald-600 border-emerald-100',
    }

    const statusColors: Record<string, string> = {
        'Pending Acceptance': 'bg-sky-50 text-sky-600 border-sky-100',
        'Not Started': 'bg-slate-50 text-slate-600 border-slate-200',
        'In Progress': 'bg-sky-50 text-sky-600 border-sky-100',
        'Completed': 'bg-emerald-50 text-emerald-600 border-emerald-100',
        'Blocked': 'bg-red-50 text-red-600 border-red-100',
        'Rejected': 'bg-rose-50 text-rose-600 border-rose-100',
    }

    async function handleStatusChange(e: React.ChangeEvent<HTMLSelectElement>) {
        if (isUpdating) return
        setIsUpdating(true)
        await updateTaskStatus(task.id, e.target.value)
        setIsUpdating(false)
    }

    function handleResponse(accept: boolean) {
        if (isPending) return
        if (!accept && !rejectionReason.trim()) return
        startTransition(async () => {
            await respondToTask(task.id, accept, rejectionReason.trim() || undefined)
            setShowRejectionForm(false)
            setRejectionReason('')
        })
    }

    return (
        <>
            <div className="card transition-all hover:-translate-y-1 hover:shadow-md">
                <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-[var(--primary)] text-lg">{task.title}</h3>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${priorityColors[task.priority]}`}>
                        {task.priority}
                    </span>
                </div>

                {task.description && (
                    <p className="text-sm text-[var(--secondary)] mb-4 line-clamp-2">
                        {task.description}
                    </p>
                )}

                <div className="grid grid-cols-2 gap-2 text-xs text-[var(--secondary)] mb-4">
                    <div>
                        <span className="block font-medium text-slate-500">Assignee</span>
                        {task.assignee?.full_name || 'Unassigned'}
                    </div>
                    <div>
                        <span className="block font-medium text-slate-500">Creator</span>
                        {task.creator?.full_name || 'System'}
                    </div>
                    <div>
                        <span className="block font-medium text-slate-500">Due Date</span>
                        {task.due_date ? new Date(task.due_date).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }) : 'No date'}
                    </div>
                </div>

                <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100">
                    <div className="flex flex-col gap-2 w-full">
                        <div className="flex items-center justify-between w-full">
                            <div className="flex items-center gap-2">
                                {isAssignee && task.status !== 'Pending Acceptance' && task.status !== 'Rejected' ? (
                                    <select
                                        className={`text-xs border-0 rounded-full px-3 py-1.5 font-bold cursor-pointer focus:ring-4 focus:ring-slate-500/5 outline-none transition-all shadow-sm ${statusColors[task.status]}`}
                                        defaultValue={task.status}
                                        onChange={handleStatusChange}
                                        disabled={isUpdating}
                                    >
                                        <option value="Not Started">Not Started</option>
                                        <option value="In Progress">In Progress</option>
                                        <option value="Blocked">Blocked</option>
                                        <option value="Completed">Completed</option>
                                    </select>
                                ) : (
                                    <span className={`text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider border ${statusColors[task.status]}`}>
                                        {task.status}
                                    </span>
                                )}
                                {isUpdating && <div className="w-3 h-3 border-2 border-slate-300 border-t-transparent rounded-full animate-spin" />}
                            </div>

                            <button
                                onClick={() => setIsDetailOpen(true)}
                                className="text-xs font-bold text-sky-600 hover:text-sky-700 transition-colors"
                            >
                                View Details
                            </button>
                        </div>

                        {/* Direct Accept/Reject Actions */}
                        {task.status === 'Pending Acceptance' && isAssignee && (
                            <div className="mt-3 p-3 bg-sky-50 rounded-xl border border-sky-100 animate-in slide-in-from-top-2 duration-300">
                                {!showRejectionForm ? (
                                    <div className="flex flex-col gap-2">
                                        <p className="text-[10px] font-bold text-sky-700 uppercase tracking-tight">New Assignment</p>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleResponse(true)}
                                                disabled={isPending}
                                                className="flex-1 py-1.5 bg-sky-600 text-white text-[10px] font-bold rounded-lg hover:bg-sky-700 transition-all shadow-md shadow-sky-600/10 active:scale-95"
                                            >
                                                Accept
                                            </button>
                                            <button
                                                onClick={() => setShowRejectionForm(true)}
                                                disabled={isPending}
                                                className="px-3 py-1.5 bg-white text-slate-600 text-[10px] font-bold rounded-lg border border-slate-200 hover:bg-slate-50 transition-all active:scale-95"
                                            >
                                                Reject
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        <textarea
                                            placeholder="Reason for rejection..."
                                            value={rejectionReason}
                                            onChange={e => setRejectionReason(e.target.value)}
                                            className="w-full p-2 text-[10px] border border-slate-200 rounded-lg focus:outline-none focus:border-sky-500 min-h-[50px] resize-none"
                                        />
                                        <div className="flex gap-2 justify-end">
                                            <button
                                                onClick={() => setShowRejectionForm(false)}
                                                className="text-[10px] text-slate-500 font-bold hover:underline"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                onClick={() => handleResponse(false)}
                                                disabled={isPending || !rejectionReason.trim()}
                                                className="px-3 py-1 bg-rose-600 text-white text-[10px] font-bold rounded-lg hover:bg-rose-700 transition-all disabled:opacity-30"
                                            >
                                                Confirm Reject
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Rejection Reason (Inline Display if Rejected) */}
                        {task.status === 'Rejected' && task.rejection_reason && (
                            <div className="mt-2 p-2 bg-rose-50 border border-rose-100 rounded-lg text-[10px]">
                                <span className="font-bold text-rose-500 block mb-0.5">REJECTED BY ME:</span>
                                <span className="text-rose-700 italic">{task.rejection_reason}</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <TaskDetailModal
                task={task}
                isAssignee={isAssignee}
                isOpen={isDetailOpen}
                onClose={() => setIsDetailOpen(false)}
            />
        </>
    )
}
