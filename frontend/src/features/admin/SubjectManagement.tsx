import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import api, { setDemoEmail } from '../../lib/api'
import { isDemoFirebase } from '../../services/firebase'
import DataTable, { Column } from '../../components/DataTable'

type Subject = {
    id: string
    code: string
    name: string
    section: string | null
    credits: number | null
    createdAt: string
}

export function SubjectManagement() {
    const [subjects, setSubjects] = useState<Subject[]>([])
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        loadSubjects()
    }, [])

    const loadSubjects = async () => {
        setLoading(true)
        try {
            const email = localStorage.getItem('demoEmail')
            if (isDemoFirebase && email) setDemoEmail(email)
            const { data } = await api.get('/api/subjects')
            const items = (data?.subjects || []) as Subject[]
            setSubjects(items)
        } catch (err: any) {
            toast.error(err?.response?.data?.error || 'Failed to load subjects')
            setSubjects([])
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

    const columns: Column<Subject>[] = [
        {
            key: 'code',
            header: 'Code',
            render: (row) => <span className="font-mono font-medium">{row.code}</span>
        },
        {
            key: 'name',
            header: 'Name',
            render: (row) => <div className="font-medium">{row.name}</div>
        },
        {
            key: 'section',
            header: 'Section',
            render: (row) => <span>{row.section || '—'}</span>
        },
        {
            key: 'credits',
            header: 'Credits',
            render: (row) => <span>{row.credits || '—'}</span>
        },
        {
            key: 'createdAt',
            header: 'Created',
            render: (row) => formatDate(row.createdAt)
        }
    ]

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h2 className="text-xl font-semibold">Subject Management</h2>
                    <p className="text-sm text-gray-600">View and manage all subjects</p>
                </div>
                <button
                    onClick={loadSubjects}
                    disabled={loading}
                    className="px-3 py-1.5 text-sm rounded border hover:bg-gray-100 disabled:opacity-50"
                >
                    {loading ? 'Loading...' : 'Refresh'}
                </button>
            </div>

            <DataTable
                title="Subjects"
                columns={columns}
                rows={subjects}
                pageSize={10}
            />
        </div>
    )
}

