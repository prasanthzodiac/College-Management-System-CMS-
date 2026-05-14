import React from 'react'
import { toast } from 'sonner'
import DataTable, { Column } from '../../components/DataTable'
import ComingSoon from '../common/ComingSoon'
import { EventsTable, type EventRecord } from '../../components/EventsTable'
import api, { setDemoEmail } from '../../lib/api'
import { isDemoFirebase } from '../../services/firebase'

type Row = { id: string; name: string; code?: string; date?: string; status?: string }

const PERIOD_CONFIG = [
    { period: 'I', time: '09:00 AM - 09:45 AM' },
    { period: 'II', time: '09:45 AM - 10:30 AM' },
    { period: 'III', time: '10:45 AM - 11:30 AM' },
    { period: 'IV', time: '11:30 AM - 12:15 PM' },
    { period: 'V', time: '01:15 PM - 02:00 PM' },
    { period: 'VI', time: '02:00 PM - 02:45 PM' },
    { period: 'VII', time: '03:00 PM - 03:45 PM' },
    { period: 'VIII', time: '03:45 PM - 04:30 PM' }
]

function makeRows(prefix: string): Row[] {
    return Array.from({ length: 23 }).map((_, i) => ({ id: `${prefix}-${i + 1}`, name: `${prefix} Item ${i + 1}`, code: `C${(i + 1).toString().padStart(3, '0')}`, date: `2025-10-${(i + 1).toString().padStart(2, '0')}`, status: i % 3 === 0 ? 'Active' : 'Draft' }))
}

const cols: Column<Row>[] = [
    { key: 'id', header: 'ID' },
    { key: 'code', header: 'Code' },
    { key: 'name', header: 'Name' },
    { key: 'date', header: 'Date' },
    { key: 'status', header: 'Status' }
]

export const AcademicRegulations = () => <DataTable title="Academic Regulations" columns={cols} rows={makeRows('Reg')} />
export const ClassTimeTable = () => <WeeklyTimetable />
export const ContinuousAssessment = () => <DataTable title="Continuous Assessment" columns={cols} rows={makeRows('CA')} />
export const CourseSubject = () => <DataTable title="Course / Subject" columns={cols} rows={makeRows('Course')} />
export const EventPage = () => {
    const [events, setEvents] = React.useState<EventRecord[]>([])
    const [loading, setLoading] = React.useState<boolean>(true)

    const loadEvents = React.useCallback(async () => {
        try {
            setLoading(true)
            const email = localStorage.getItem('demoEmail')
            if (isDemoFirebase && email) setDemoEmail(email)
            const { data } = await api.get('/api/events')
            setEvents((data?.events || []).map((event: any) => ({
                id: event.id,
                title: event.title,
                department: event.department ?? null,
                description: event.description ?? null,
                venue: event.venue ?? null,
                startDate: event.startDate,
                endDate: event.endDate,
                contactName: event.contactName ?? null,
                contactEmail: event.contactEmail ?? null,
                contactPhone: event.contactPhone ?? null,
                status: event.status ?? null,
                attachmentUrl: event.attachmentUrl ?? null
            })))
        } catch (error: any) {
            toast.error(error?.response?.data?.error || 'Failed to load events')
            setEvents([])
        } finally {
            setLoading(false)
        }
    }, [])

    React.useEffect(() => {
        loadEvents()
    }, [loadEvents])

    return (
        <section className="mb-5 border rounded-md bg-white overflow-hidden">
            <div className="px-4 py-2 border-b bg-gray-50 flex items-center justify-between">
                <div>
                    <div className="text-sm font-medium">Events</div>
                    <div className="text-xs text-gray-500">Upcoming and recent college events</div>
                </div>
                <button onClick={loadEvents} className="text-xs px-3 py-1.5 border rounded hover:bg-gray-100">Refresh</button>
            </div>
            <div className="p-4">
                {loading ? <div className="text-center text-gray-500 py-6">Loading events...</div> : <EventsTable events={events} />}
            </div>
        </section>
    )
}
export const HallBooking = () => <ComingSoon title="Hall Booking" />
export const LessonPlan = () => <ComingSoon title="Lesson Plan" />
export const OpenElectiveCBCS = () => <ComingSoon title="Open Elective and CBCS" />
export const OutcomeBasedEducation = () => <ComingSoon title="Outcome-based education" />
export const StudentAttendanceList = () => <StudentAttendancePage />
export const TutorWardSystem = () => <ComingSoon title="Tutor-ward System" />

// Non-academic sections
export { AdmissionPage } from './AdmissionPage'
export const CorePage = () => <ComingSoon title="Core" />
export const ExamPage = () => <ComingSoon title="Exam" />
export { FeedbackPage } from './FeedbackPage'
export const HumanResourcePage = () => <ComingSoon title="Human Resource" />
export { ReportPage } from './ReportPage'

// Student Attendance Page Component
type AttendanceRecord = {
    id: string
    date: string
    period: string
    present: boolean
    subject: {
        id: string
        code: string
        name: string
        section: string
    } | null
    createdAt: string
}

type Student = {
    id: string
    name?: string | null
    email: string
    rollNo?: string | null
    sections: string[]
}

function StudentAttendancePage() {
    const [rollQuery, setRollQuery] = React.useState('')
    const [student, setStudent] = React.useState<Student | null>(null)
    const [attendanceData, setAttendanceData] = React.useState<AttendanceRecord[]>([])
    const [loading, setLoading] = React.useState(false)
    const [error, setError] = React.useState<string | null>(null)

    const periodIds = React.useMemo(() => PERIOD_CONFIG.map((p) => p.period), [])

    const fetchAttendance = async () => {
        const roll = rollQuery.trim().toUpperCase()
        if (!roll) {
            setError('Please enter a roll number')
            toast.error('Please enter a roll number')
            return
        }
        try {
            setLoading(true)
            setError(null)
            const storedEmail = localStorage.getItem('demoEmail')
            if (isDemoFirebase && storedEmail) setDemoEmail(storedEmail)
            const { data } = await api.get(`/api/attendance/student-by-roll/${encodeURIComponent(roll)}`)
            setStudent(data.student)
            setAttendanceData(data.entries || [])
            if (!data.entries?.length) {
                toast.info('No attendance records found for this student yet.')
            }
        } catch (err: any) {
            const message = err?.response?.data?.error || err?.message || 'Failed to load attendance'
            setError(message)
            setStudent(null)
            setAttendanceData([])
            toast.error(message)
        } finally {
            setLoading(false)
        }
    }

    const onSubmit = (event: React.FormEvent) => {
        event.preventDefault()
        fetchAttendance()
    }

    const totals = React.useMemo(() => {
        const total = attendanceData.length
        const present = attendanceData.filter((entry) => entry.present).length
        const absent = total - present
        const presentPercentage = total ? (present / total) * 100 : 0
        const absentPercentage = total ? (absent / total) * 100 : 0
        return { total, present, absent, presentPercentage, absentPercentage }
    }, [attendanceData])

    const orderedDates = React.useMemo(() => {
        const uniqueDates = new Set(attendanceData.map((entry) => entry.date))
        return Array.from(uniqueDates).sort((a, b) => new Date(`${a}T00:00:00`).getTime() - new Date(`${b}T00:00:00`).getTime())
    }, [attendanceData])

    const getAttendanceForDatePeriod = React.useCallback(
        (date: string, period: string) => {
            return attendanceData.find((entry) => entry.date === date && entry.period === period) || null
        },
        [attendanceData]
    )

    const formatDate = (dateStr: string) => {
        const dateObj = new Date(`${dateStr}T00:00:00`)
        return {
            full: dateObj.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
            dayName: dateObj.toLocaleDateString('en-GB', { weekday: 'long' })
        }
    }

    const sectionsLabel = student?.sections?.length ? student.sections.join(', ') : '—'

    return (
        <section className="mb-5">
            <div className="border rounded-md bg-white overflow-hidden mb-4">
                <form onSubmit={onSubmit} className="px-4 py-3 border-b bg-gray-50 flex flex-col gap-3 md:flex-row md:items-center md:gap-4">
                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <label className="text-sm font-medium">Roll Number:</label>
                        <input
                            value={rollQuery}
                            onChange={(e) => setRollQuery(e.target.value)}
                            placeholder="e.g. 21BCS001"
                            className="border rounded px-3 py-1.5 text-sm bg-white w-full md:min-w-[200px]"
                        />
                    </div>
                    <div className="flex items-center gap-3">
                        <button 
                            type="submit"
                            disabled={loading}
                            className="px-4 py-1.5 text-sm rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                        >
                            {loading ? 'Searching...' : 'Search'}
                        </button>
                        <button 
                            type="button"
                            onClick={() => {
                                setRollQuery('')
                                setStudent(null)
                                setAttendanceData([])
                                setError(null)
                            }}
                            className="px-4 py-1.5 text-sm rounded border border-gray-300 bg-white text-gray-700 hover:bg-gray-100"
                        >
                            Clear
                        </button>
                    </div>
                    {error && <div className="text-sm text-red-600">{error}</div>}
                </form>
            </div>

            {student && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
                    <div className="border rounded-md bg-white p-3">
                        <div className="text-xs text-gray-500">Student</div>
                        <div className="font-medium">{student.name || '—'}</div>
                    </div>
                    <div className="border rounded-md bg-white p-3">
                        <div className="text-xs text-gray-500">Roll No</div>
                        <div className="font-medium">{student.rollNo || rollQuery.trim().toUpperCase()}</div>
                    </div>
                    <div className="border rounded-md bg-white p-3">
                        <div className="text-xs text-gray-500">Email</div>
                        <div className="font-medium break-all">{student.email}</div>
                    </div>
                    <div className="border rounded-md bg-white p-3">
                        <div className="text-xs text-gray-500">Section(s)</div>
                        <div className="font-medium">{sectionsLabel}</div>
                    </div>
                </div>
            )}

            {attendanceData.length > 0 && (
                <div className="space-y-4">
                    <div className="rounded border bg-white p-4">
                        <div className="text-sm font-medium mb-3">Attendance Summary</div>
                        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 text-sm">
                            <div className="flex items-center gap-2"><span className="text-gray-600">Total sessions:</span><span className="font-medium">{totals.total}</span></div>
                            <div className="flex items-center gap-2"><span className="text-gray-600">Present:</span><span className="font-medium text-emerald-700">{totals.present}</span></div>
                            <div className="flex items-center gap-2"><span className="text-gray-600">Absent:</span><span className="font-medium text-rose-700">{totals.absent}</span></div>
                            <div className="flex items-center gap-2"><span className="text-gray-600">Present %:</span><span className="font-medium">{totals.presentPercentage.toFixed(2)}%</span></div>
                            <div className="flex items-center gap-2"><span className="text-gray-600">Absent %:</span><span className="font-medium">{totals.absentPercentage.toFixed(2)}%</span></div>
                        </div>
                    </div>

                    <section className="border rounded-md bg-white overflow-hidden">
                    <div className="px-4 py-2 border-b bg-gray-50">
                            <div className="text-sm font-medium">Period-wise Attendance</div>
                    </div>
                    <div className="overflow-auto">
                        <table className="min-w-full text-sm">
                            <thead className="bg-white border-b">
                                <tr>
                                    <th className="px-3 py-2 text-left text-gray-700 border-r">Date</th>
                                        {periodIds.map((period) => (
                                            <th key={period} className="px-3 py-2 text-center text-gray-700 border-r min-w-[80px]">{period}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                    {orderedDates.map((date) => {
                                        const formatted = formatDate(date)
                                        return (
                                    <tr key={date} className="border-b">
                                                <td className="px-3 py-2 border-r">
                                                    <div className="font-medium">{formatted.full}</div>
                                                    <div className="text-xs text-gray-500">{formatted.dayName}</div>
                                                </td>
                                                {periodIds.map((period) => {
                                            const record = getAttendanceForDatePeriod(date, period)
                                                    if (!record) {
                                                        return <td key={period} className="px-3 py-2 border-r text-center text-gray-300">—</td>
                                                    }
                                                    const label = record.present ? 'P' : 'A'
                                                    const badgeClass = record.present ? 'text-emerald-700 font-medium' : 'text-rose-700 font-medium'
                                                    const subjectLabel = record.subject ? `${record.subject.code} • ${record.subject.name}` : 'Unknown subject'
                                                    return (
                                                        <td key={period} className="px-3 py-2 border-r text-center">
                                                            <div className={badgeClass}>{label}</div>
                                                            <div className="text-xs text-gray-500 mt-1">{subjectLabel}</div>
                                                </td>
                                            )
                                        })}
                                    </tr>
                                        )
                                    })}
                            </tbody>
                        </table>
                    </div>
                </section>
                </div>
            )}

            {!loading && student && attendanceData.length === 0 && !error && (
                <div className="border rounded-md bg-white p-6 text-center text-gray-500">
                    No attendance sessions recorded for this student yet.
                </div>
            )}
        </section>
    )
}

// Weekly Timetable Component
type TimetableSlot = {
    sessionId: string
    period: string
    subjectId: string
    subjectCode: string
    subjectName: string
    section: string
}

function WeeklyTimetable() {
    const [loading, setLoading] = React.useState(true)
    const [error, setError] = React.useState<string | null>(null)
    const [timetable, setTimetable] = React.useState<{
        staff?: { id: string; name?: string | null; email: string }
        periodOrder: string[]
        days: Array<{ date: string; dayName: string; slots: Record<string, TimetableSlot[]> }>
        range: { startDate: string; endDate: string } | null
    } | null>(null)

    React.useEffect(() => {
        const load = async () => {
            try {
                setLoading(true)
                setError(null)
                const storedEmail = localStorage.getItem('demoEmail')
                if (isDemoFirebase && storedEmail) setDemoEmail(storedEmail)
                const { data } = await api.get('/api/attendance/staff/timetable')
                setTimetable(data)
                if (!data?.days?.length) {
                    toast.info('No timetable entries found for this staff member yet.')
                }
            } catch (err: any) {
                const message = err?.response?.data?.error || err?.message || 'Failed to load timetable'
                setError(message)
                toast.error(message)
            } finally {
                setLoading(false)
            }
        }
        load()
    }, [])

    const periodOrder = React.useMemo(() => timetable?.periodOrder || PERIOD_CONFIG.map((p) => p.period), [timetable])
    const days = React.useMemo(() => {
        const rawDays = timetable?.days || []
        return [...rawDays].sort((a, b) => a.date.localeCompare(b.date))
    }, [timetable])

    const formatDate = (dateStr: string) => {
        const dateObj = new Date(`${dateStr}T00:00:00`)
        return dateObj.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    }

    return (
        <section className="mb-5 border rounded-md bg-white overflow-hidden">
            <div className="px-4 py-2 border-b bg-gray-50 flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
                <div>
                <div className="text-sm font-medium">Class Time Table</div>
                    {timetable?.range && (
                        <div className="text-xs text-gray-500">{formatDate(timetable.range.startDate)} – {formatDate(timetable.range.endDate)}</div>
                    )}
                </div>
                {timetable?.staff && (
                    <div className="text-xs text-gray-600">
                        <span className="font-medium">Staff:</span> {timetable.staff.name || 'Unknown'} ({timetable.staff.email})
                    </div>
                )}
            </div>
            <div className="overflow-auto">
                {loading ? (
                    <div className="p-6 text-center text-gray-500">Loading timetable...</div>
                ) : error ? (
                    <div className="p-6 text-center text-red-600">{error}</div>
                ) : !days.length ? (
                    <div className="p-6 text-center text-gray-500">No timetable scheduled yet.</div>
                ) : (
                <table className="min-w-full text-sm">
                    <thead className="bg-white border-b">
                        <tr>
                            <th className="px-3 py-2 text-left text-gray-700 border-r">Period</th>
                            <th className="px-3 py-2 text-left text-gray-700 border-r">Time</th>
                            {days.map((day) => (
                                    <th key={day.date} className="px-3 py-2 text-left text-gray-700 border-r min-w-[200px]">
                                        <div className="font-medium">{day.dayName || 'Day'}</div>
                                        <div className="text-xs text-gray-500">{formatDate(day.date)}</div>
                                    </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                            {periodOrder.map((periodId) => {
                                const periodConfig = PERIOD_CONFIG.find((p) => p.period === periodId)
                                return (
                                    <tr key={periodId} className="border-b">
                                        <td className="px-3 py-3 border-r font-medium">{periodId}</td>
                                        <td className="px-3 py-3 border-r text-gray-600">{periodConfig?.time || '—'}</td>
                                {days.map((day) => {
                                            const slotList = day.slots?.[periodId] || []
                                    return (
                                                <td key={day.date} className="px-3 py-3 border-r align-top">
                                                    {slotList.length ? (
                                                        <div className="flex flex-col gap-2">
                                                            {slotList.map((slot) => (
                                                                <div key={slot.sessionId} className="bg-blue-50 rounded p-2 border border-blue-100">
                                                                    <div className="font-medium text-blue-900">{slot.subjectCode}</div>
                                                                    <div className="text-xs text-blue-700">{slot.subjectName}</div>
                                                                    <div className="text-xs text-gray-600 mt-1">Section: {slot.section}</div>
                                                                </div>
                                                            ))}
                                                </div>
                                            ) : (
                                                <div className="text-gray-400 text-xs">—</div>
                                            )}
                                        </td>
                                    )
                                })}
                            </tr>
                                )
                            })}
                    </tbody>
                </table>
                )}
            </div>
        </section>
    )
}


