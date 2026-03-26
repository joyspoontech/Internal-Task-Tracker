'use client'
import { useState, useEffect, useTransition } from 'react'
import { addComment, getComments, updateTaskStatus, respondToTask } from '@/app/actions/tasks'
import { X, Send, Calendar, User, Info, MessageSquare, AlignLeft } from 'lucide-react'

type Comment = {
    id: string
    body: string
    created_at: string
    user: { full_name: string } | null
}

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

export default function TaskDetailModal({
    task,
    isAssignee,
    isOpen,
    onClose,
}: {
    task: Task
    isAssignee: boolean
    isOpen: boolean
    onClose: () => void
}) {
    const [comments, setComments] = useState<Comment[]>([])
    const [newComment, setNewComment] = useState('')
    const [rejectionReason, setRejectionReason] = useState('')
    const [showRejectionForm, setShowRejectionForm] = useState(false)
    const [isPending, startTransition] = useTransition()
    const [isLoadingComments, setIsLoadingComments] = useState(false)

    useEffect(() => {
        if (isOpen) {
            loadComments()
            setShowRejectionForm(false)
            setRejectionReason('')
        }
    }, [isOpen, task.id])

    async function loadComments() {
        setIsLoadingComments(true)
        const data = await getComments(task.id)
        setComments(data as unknown as Comment[])
        setIsLoadingComments(false)
    }

    function handleAddComment() {
        if (isPending || !newComment.trim()) return
        startTransition(async () => {
            await addComment(task.id, newComment.trim())
            setNewComment('')
            await loadComments()
        })
    }

    function handleStatusChange(e: React.ChangeEvent<HTMLSelectElement>) {
        if (isPending) return
        startTransition(async () => {
            await updateTaskStatus(task.id, e.target.value)
        })
    }

    function handleResponse(accept: boolean) {
        if (isPending) return
        if (!accept && !rejectionReason.trim()) return
        startTransition(async () => {
            await respondToTask(task.id, accept, rejectionReason.trim() || undefined)
            if (accept) onClose()
        })
    }

    if (!isOpen) return null

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

    return (
        <div className="fixed inset-0 w-screen h-screen z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xl animate-in fade-in duration-300 left-0 top-0" onClick={onClose}>
            <div
                className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-300 border border-slate-200/60 overflow-hidden"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50">
                    <div className="flex justify-between items-start">
                        <div className="flex-1">
                            <h2 className="text-xl font-bold text-slate-900 tracking-tight leading-tight">{task.title}</h2>
                            <div className="flex items-center gap-2 mt-2.5">
                                <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-md font-bold border ${priorityColors[task.priority]}`}>
                                    {task.priority}
                                priority</span>
                                {isAssignee ? (
                                    <div className="relative">
                                        <select
                                            className={`text-[10px] uppercase tracking-wider border rounded-md px-2 py-0.5 font-bold cursor-pointer focus:ring-4 focus:ring-slate-200 outline-none transition-all appearance-none pr-6 ${statusColors[task.status]}`}
                                            defaultValue={task.status}
                                            onChange={handleStatusChange}
                                            disabled={isPending}
                                        >
                                            <option value="Not Started">Not Started</option>
                                            <option value="In Progress">In Progress</option>
                                            <option value="Blocked">Blocked</option>
                                            <option value="Completed">Completed</option>
                                        </select>
                                        <div className="absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none scale-75 opacity-50">
                                            ▼
                                        </div>
                                    </div>
                                ) : (
                                    <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-md font-bold border ${statusColors[task.status]}`}>
                                        {task.status}
                                    </span>
                                )}
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-all"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto px-6 py-6 custom-scrollbar">
                    {/* Acceptance Actions (Only for assignee when Pending) */}
                    {task.status === 'Pending Acceptance' && isAssignee && (
                        <div className="mb-8 p-5 bg-sky-50 rounded-2xl border border-sky-100 animate-in slide-in-from-top-4 duration-300">
                            {!showRejectionForm ? (
                                <div className="text-center">
                                    <h4 className="text-sm font-bold text-sky-900 mb-1">Accept New Task</h4>
                                    <p className="text-xs text-sky-600 mb-4">Would you like to take on this assignment?</p>
                                    <div className="flex gap-3 justify-center">
                                        <button
                                            onClick={() => handleResponse(true)}
                                            disabled={isPending}
                                            className="px-6 py-2 bg-sky-600 text-white text-xs font-bold rounded-xl hover:bg-sky-700 transition-all shadow-lg shadow-sky-600/20 active:scale-95"
                                        >
                                            Accept Task
                                        </button>
                                        <button
                                            onClick={() => setShowRejectionForm(true)}
                                            disabled={isPending}
                                            className="px-6 py-2 bg-white text-slate-600 text-xs font-bold rounded-xl border border-slate-200 hover:bg-slate-50 transition-all active:scale-95"
                                        >
                                            Reject
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    <h4 className="text-sm font-bold text-slate-900">Rejection Reason</h4>
                                    <textarea
                                        placeholder="Briefly explain why you're rejecting this task..."
                                        value={rejectionReason}
                                        onChange={e => setRejectionReason(e.target.value)}
                                        className="w-full p-3 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-sky-500/5 focus:border-sky-500 min-h-[80px] resize-none"
                                    />
                                    <div className="flex gap-2 justify-end">
                                        <button
                                            onClick={() => setShowRejectionForm(false)}
                                            className="px-4 py-1.5 text-xs text-slate-500 font-medium hover:bg-slate-100 rounded-lg transition-all"
                                        >
                                            Back
                                        </button>
                                        <button
                                            onClick={() => handleResponse(false)}
                                            disabled={isPending || !rejectionReason.trim()}
                                            className="px-4 py-1.5 bg-rose-600 text-white text-xs font-bold rounded-lg hover:bg-rose-700 transition-all disabled:opacity-30"
                                        >
                                            Submit Rejection
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Rejection Reason Display (If Rejected) */}
                    {task.status === 'Rejected' && task.rejection_reason && (
                        <div className="mb-8 p-4 bg-rose-50 border border-rose-100 rounded-xl">
                            <h4 className="text-[10px] font-bold text-rose-400 uppercase tracking-wider mb-1">Rejection Reason</h4>
                            <p className="text-sm text-rose-700 italic">{task.rejection_reason}</p>
                        </div>
                    )}

                    {/* Task Description */}
                    <div className="mb-8">
                        <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.1em] mb-3 flex items-center gap-2">
                            <AlignLeft size={14} /> Description
                        </h3>
                        <p className="text-sm text-slate-700 leading-relaxed bg-slate-50/50 p-4 rounded-xl border border-slate-100 italic">
                            {task.description || 'No description provided for this task.'}
                        </p>
                    </div>

                    {/* Metadata Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
                        <div className="bg-slate-50/50 p-3 rounded-xl border border-slate-100/50">
                            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                                <User size={12} /> Assignee
                            </span>
                            <span className="text-sm text-slate-900 font-semibold">{task.assignee?.full_name || 'Unassigned'}</span>
                        </div>
                        <div className="bg-slate-50/50 p-3 rounded-xl border border-slate-100/50">
                            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                                <Info size={12} /> Created by
                            </span>
                            <span className="text-sm text-slate-900 font-semibold">{task.creator?.full_name || 'System'}</span>
                        </div>
                        <div className="bg-slate-50/50 p-3 rounded-xl border border-slate-100/50">
                            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                                <Calendar size={12} /> Due Date
                            </span>
                            <span className="text-sm text-slate-900 font-semibold whitespace-nowrap">
                                {task.due_date ? new Date(task.due_date).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }) : 'No date'}
                            </span>
                        </div>
                    </div>

                    {/* Comments Section */}
                    <div className="space-y-4">
                        <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.1em] flex items-center gap-2">
                            <MessageSquare size={14} /> Comments & Updates
                        </h3>

                        {isLoadingComments ? (
                            <div className="flex flex-col items-center justify-center py-10 gap-3">
                                <div className="w-5 h-5 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
                                <span className="text-xs text-slate-400 animate-pulse">Retrieving conversation...</span>
                            </div>
                        ) : comments.length === 0 ? (
                            <div className="text-center py-10 bg-slate-50/30 rounded-2xl border-2 border-dashed border-slate-100">
                                <p className="text-sm text-slate-400">No updates yet. Start the conversation!</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {comments.map(comment => (
                                    <div key={comment.id} className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm hover:border-slate-200 transition-all">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-xs font-bold text-slate-900">
                                                {comment.user?.full_name || 'Unknown User'}
                                            </span>
                                            <span className="text-[10px] text-slate-400">
                                                {new Date(comment.created_at).toLocaleDateString('en-US', {
                                                    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                                                })}
                                            </span>
                                        </div>
                                        <p className="text-sm text-slate-600 leading-relaxed">{comment.body}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer Input */}
                <div className="px-6 py-5 border-t border-slate-100 bg-white">
                    <div className="flex gap-2">
                        <input
                            type="text"
                            placeholder="Add a comment or share an update..."
                            value={newComment}
                            onChange={e => setNewComment(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter') handleAddComment() }}
                            className="flex-1 px-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-sky-500/5 focus:border-sky-500 focus:bg-white placeholder:text-slate-400 transition-all"
                            disabled={isPending}
                        />
                        <button
                            onClick={handleAddComment}
                            disabled={isPending || !newComment.trim()}
                            className="p-3 bg-sky-600 text-white rounded-xl hover:bg-sky-700 active:scale-95 transition-all disabled:opacity-30 flex items-center justify-center shadow-lg shadow-sky-600/20"
                        >
                            <Send size={18} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
