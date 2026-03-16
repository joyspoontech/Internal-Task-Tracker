'use client'

import { useState } from 'react'
import TaskCard from './TaskCard'
import FilterChips from './FilterChips'

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

export default function TaskListClient({
    tasks,
    isAssignee,
    emptyMessage = 'No tasks to display.'
}: {
    tasks: Task[]
    isAssignee: boolean
    emptyMessage?: string
}) {
    const [filter, setFilter] = useState('All')

    const filteredTasks = filter === 'All'
        ? tasks
        : tasks.filter(t => t.status === filter)

    return (
        <div>
            <div className="mb-4">
                <FilterChips onFilter={setFilter} />
            </div>

            <div className="space-y-4">
                {filteredTasks.length === 0 ? (
                    <div className="card text-center py-12 text-[var(--secondary)]">
                        {filter === 'All' ? emptyMessage : `No ${filter.toLowerCase()} tasks.`}
                    </div>
                ) : (
                    filteredTasks.map(task => (
                        <TaskCard key={task.id} task={task as any} isAssignee={isAssignee} />
                    ))
                )}
            </div>
        </div>
    )
}
