import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import api, { setDemoEmail } from '../../lib/api'
import { isDemoFirebase } from '../../services/firebase'
import DataTable, { Column } from '../../components/DataTable'

type AttendanceEntry = {
    id: string
    studentId: string
    sessionId: string
    status: 'present' | 'absent'
    createdAt: string
    student?: {
        id: string
        name: string | null
        email: string
        rollNumber?: string | null
    }
    session?: {
        id: string
        date: string
        period: string
        subject?: {
            id: string
            code: string
            name: string
            section?: string
        }
    }
}

export function AttendanceOverview() {
    const [entries, setEntries] = useState<AttendanceEntry[]>([])
    const [loading, setLoading] = useState(false)
    const [searchParams] = useSearchParams()
    const rollNo = searchParams.get('rollNo')

    useEffect(() => {
        if (rollNo) {
            loadAttendanceByRoll(rollNo)
        } else {
            loadAllAttendance()
        }
    }, [rollNo])

    const loadAllAttendance = async () => {
        setLoading(true)
        try {
            const email = localStorage.getItem('demoEmail')
            if (isDemoFirebase && email) setDemoEmail(email)
            const { data } = await api.get('/api/attendance/overview')
            setEntries((data?.entries || []) as AttendanceEntry[])
        } catch (err: any) {
            toast.error(err?.response?.data?.error || 'Failed to load attendance')
            setEntries([])
        } finally {
            setLoading(false)
        }
    }

    const loadAttendanceByRoll = async (rollNo: string) => {
        setLoading(true)
        try {
            const email = localStorage.getItem('demoEmail')
            if (isDemoFirebase && email) setDemoEmail(email)
            const { data } = await api.get('/api/attendance/overview', { params: { rollNo } })
            setEntries((data?.entries || []) as AttendanceEntry[])
        } catch (err: any) {
            toast.error(err?.response?.data?.error || 'Failed to load attendance')
            setEntries([])
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

    const columns: Column<AttendanceEntry>[] = [
        {
            key: 'studentId',
            header: 'Student',
            render: (row) => (
                <div>
                    <div className="font-medium">{row.student?.name || 'N/A'}</div>
                    <div className="text-xs text-gray-500">{row.student?.email || row.studentId}</div>
                </div>
            )
        },
        {
            key: 'subject',
            header: 'Subject',
            sortable: false,
            render: (row) => (
                <div>
                    <div className="font-medium">{row.session?.subject?.code || '—'}</div>
                    <div className="text-xs text-gray-500">{row.session?.subject?.name || '—'}</div>
                </div>
            )
        },
        {
            key: 'date',
            header: 'Date',
            sortable: false,
            render: (row) => row.session?.date ? formatDate(row.session.date) : '—'
        },
        {
            key: 'period',
            header: 'Period',
            sortable: false,
            render: (row) => row.session?.period ? `Period ${row.session.period}` : '—'
        },
        {
            key: 'status',
            header: 'Status',
            render: (row) => (
                <span className={`px-2 py-1 text-xs rounded ${
                    row.status === 'present' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                }`}>
                    {row.status === 'present' ? 'Present' : 'Absent'}
                </span>
            )
        }
    ]

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h2 className="text-xl font-semibold">Attendance Overview</h2>
                    <p className="text-sm text-gray-600">View attendance records across all students and subjects</p>
                </div>
                <button
                    onClick={() => rollNo ? loadAttendanceByRoll(rollNo) : loadAllAttendance()}
                    disabled={loading}
                    className="px-3 py-1.5 text-sm rounded border hover:bg-gray-100 disabled:opacity-50"
                >
                    {loading ? 'Loading...' : 'Refresh'}
                </button>
            </div>

            {rollNo && (
                <div className="text-sm text-gray-600">
                    Showing attendance for roll number: <span className="font-medium">{rollNo}</span>
                </div>
            )}

            <DataTable
                title="Attendance Records"
                columns={columns}
                rows={entries}
                pageSize={10}
            />
        </div>
    )
}

