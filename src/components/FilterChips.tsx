'use client'

import { useState } from 'react'

const STATUSES = ['All', 'Pending Acceptance', 'Not Started', 'In Progress', 'Blocked', 'Completed', 'Rejected'] as const

export default function FilterChips({
    onFilter
}: {
    onFilter: (status: string) => void
}) {
    const [active, setActive] = useState('All')

    const chipColors: Record<string, string> = {
        'All': 'bg-slate-800 text-white',
        'Pending Acceptance': 'bg-sky-100 text-sky-800',
        'Not Started': 'bg-slate-100 text-slate-800',
        'In Progress': 'bg-blue-100 text-blue-800',
        'Blocked': 'bg-red-100 text-red-800',
        'Completed': 'bg-emerald-100 text-emerald-800',
        'Rejected': 'bg-rose-100 text-rose-800',
    }

    function handleClick(status: string) {
        setActive(status)
        onFilter(status)
    }

    return (
        <div className="flex gap-2 flex-wrap">
            {STATUSES.map(status => (
                <button
                    key={status}
                    onClick={() => handleClick(status)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${active === status
                            ? chipColors[status]
                            : 'bg-white border border-slate-200 text-slate-500 hover:border-slate-300'
                        }`}
                >
                    {status}
                </button>
            ))}
        </div>
    )
}
