import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import api, { setDemoEmail } from '../../lib/api'
import { isDemoFirebase } from '../../services/firebase'
import DataTable, { Column } from '../../components/DataTable'

type Assignment = {
    id: string
    subjectId: string
    subjectCode: string
    assignmentName: string
    description: string | null
    dueDate: string
    minMark: number
    maxMark: number
    createdAt: string
    subject?: {
        code: string
        name: string
        section?: string
    }
    createdByUser?: {
        id: string
        name: string | null
        email: string
    }
}

export function AssignmentOverview() {
    const [assignments, setAssignments] = useState<Assignment[]>([])
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        loadAssignments()
    }, [])

    const loadAssignments = async () => {
        setLoading(true)
        try {
            const email = localStorage.getItem('demoEmail')
            if (isDemoFirebase && email) setDemoEmail(email)
            const { data } = await api.get('/api/assignments/all')
            setAssignments((data?.assignments || []) as Assignment[])
        } catch (err: any) {
            toast.error(err?.response?.data?.error || 'Failed to load assignments')
            setAssignments([])
        } finally {
            setLoading(false)
        }
    }

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        })
    }

    const columns: Column<Assignment>[] = [
        {
            key: 'subjectCode',
            header: 'Subject',
            render: (row) => (
                <div>
                    <div className="font-medium">{row.subject?.code || row.subjectCode}</div>
                    <div className="text-xs text-gray-500">{row.subject?.name || '—'}</div>
                </div>
            )
        },
        {
            key: 'assignmentName',
            header: 'Assignment',
            render: (row) => <div className="font-medium">{row.assignmentName}</div>
        },
        {
            key: 'dueDate',
            header: 'Due Date',
            render: (row) => formatDate(row.dueDate)
        },
        {
            key: 'marks',
            header: 'Marks',
            sortable: false,
            render: (row) => (
                <span className="text-sm">
                    {row.minMark} - {row.maxMark}
                </span>
            )
        },
        {
            key: 'createdAt',
            header: 'Created',
            render: (row) => formatDate(row.createdAt)
        },
        {
            key: 'createdByUser',
            header: 'Created By',
            render: (row) => (
                <div className="text-xs text-gray-600">
                    {row.createdByUser?.name || '—'}
                    <div className="text-[11px] text-gray-400">{row.createdByUser?.email || ''}</div>
                </div>
            )
        }
    ]

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h2 className="text-xl font-semibold">Assignment Overview</h2>
                    <p className="text-sm text-gray-600">View all assignments across subjects</p>
                </div>
                <button
                    onClick={loadAssignments}
                    disabled={loading}
                    className="px-3 py-1.5 text-sm rounded border hover:bg-gray-100 disabled:opacity-50"
                >
                    {loading ? 'Loading...' : 'Refresh'}
                </button>
            </div>

            <DataTable
                title="Assignments"
                columns={columns}
                rows={assignments}
                pageSize={10}
            />
        </div>
    )
}

