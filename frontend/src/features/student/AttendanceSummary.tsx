import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import api, { setDemoEmail } from '../../lib/api'
import socket from '../../services/socket'
import { auth, isDemoFirebase } from '../../services/firebase'

type AttendanceEntry = {
    id: string
    sessionId: string
    studentId: string
    present: boolean
    date: string
    period: string
    subject: {
        id: string
        code: string
        name: string
        section: string
    } | null
    createdAt: string
}

type SubjectSummary = {
    subjectId: string
    code: string
    name: string
    section: string
    total: number
    present: number
    absent: number
    od: number
    leave: number
    presentPercent: number
    absentPercent: number
    odPercent: number
    leavePercent: number
}

export default function AttendanceSummary() {
    const [entries, setEntries] = useState<AttendanceEntry[]>([])
    const [loading, setLoading] = useState(true)
    const [studentId, setStudentId] = useState<string | null>(null)
    const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
    const [selectedSemester, setSelectedSemester] = useState<number>(1)
    const [page, setPage] = useState<number>(1)
    const [userInfo, setUserInfo] = useState<{ name?: string | null; email?: string | null } | null>(null)
    const [loadError, setLoadError] = useState<string | null>(null)

    useEffect(() => {
        const loadUser = async () => {
            setLoading(true)
            try {
                if (isDemoFirebase) {
                    const storedEmail = localStorage.getItem('demoEmail')
                    if (storedEmail) {
                        setDemoEmail(storedEmail)
                        try {
                            const syncRes = await api.post('/api/auth/sync', { email: storedEmail })
                            if (syncRes.data?.user?.id) {
                                setStudentId(syncRes.data.user.id)
                                setUserInfo({ name: syncRes.data.user.name, email: storedEmail })
                                loadAttendance(syncRes.data.user.id)
                                return
                            }
                        } catch (_) {
                            // Even if sync fails, keep email so we can derive fields
                            setUserInfo({ name: null, email: storedEmail })
                        }
                    }
                }

                const { data } = await api.get('/api/auth/me')
                if (data?.user?.id) {
                    setStudentId(data.user.id)
                    setUserInfo({ name: data.user.name, email: data.user.email })
                    loadAttendance(data.user.id)
                } else if (data?.user?.email && isDemoFirebase) {
                    setDemoEmail(data.user.email)
                    try {
                        const syncRes = await api.post('/api/auth/sync', { email: data.user.email })
                        if (syncRes.data?.user?.id) {
                            setStudentId(syncRes.data.user.id)
                            setUserInfo({ name: syncRes.data.user.name, email: data.user.email })
                            loadAttendance(syncRes.data.user.id)
                        }
                    } catch (_) {}
                } else {
                    setLoadError('No user found. Please login first.')
                    setLoading(false)
                }
            } catch (err: any) {
                const user = auth.currentUser
                if (user?.email && isDemoFirebase) {
                    setDemoEmail(user.email)
                    try {
                        const syncRes = await api.post('/api/auth/sync', { email: user.email })
                        if (syncRes.data?.user?.id) {
                            setStudentId(syncRes.data.user.id)
                            setUserInfo({ name: syncRes.data.user.name, email: user.email })
                            loadAttendance(syncRes.data.user.id)
                        }
                    } catch (_) {}
                } else {
                    setLoadError('Unable to load user. Check server or login.')
                    setLoading(false)
                }
            }
        }
        loadUser()
    }, [])

    useEffect(() => {
        if (!studentId) return
        socket.emit('attendance:join', { studentId })
        const handleUpdate = (data: any) => {
            // Only refresh if the update is for this student
            if (data && data.studentId === studentId) {
                setLastUpdate(new Date())
                loadAttendance(studentId)
                toast.success('Attendance updated')
            }
        }
        socket.on('attendance:updated', handleUpdate)
        const handleRefresh = () => { 
            if (studentId) loadAttendance(studentId) 
        }
        window.addEventListener('attendance:refresh', handleRefresh)
        
        // Also listen for session updates that might affect this student
        socket.on('attendance:session:updated', handleRefresh)
        
        return () => {
            socket.off('attendance:updated', handleUpdate)
            socket.off('attendance:session:updated', handleRefresh)
            window.removeEventListener('attendance:refresh', handleRefresh)
        }
    }, [studentId])

    // Derive roll number and batch from email/name in demo mode
    const derived = useMemo(() => {
        const email = userInfo?.email || ''
        const nameFromState = (userInfo?.name || '')
        let displayName = nameFromState
        let roll = ''
        let batch = ''

        if (!displayName && email) {
            const prefix = email.split('@')[0]
            displayName = prefix.replace(/^(student|staff|admin)/i, '')
        }

        // If name is numeric (e.g., "1" from demo sync), make it human-friendly
        if (displayName && /^\d+$/.test(displayName)) {
            const m = (userInfo?.email || '').match(/student(\d+)/i)
            if (m) {
                displayName = `Student ${m[1]}`
            } else if (email) {
                displayName = email.split('@')[0]
            }
        }

        if (email) {
            const prefix = email.split('@')[0]
            const match = prefix.match(/student(\d+)/i)
            if (match) {
                const num = match[1].padStart(3, '0')
                // Use "21" as default admission year for demo IDs
                const yearPrefix = '21'
                roll = `${yearPrefix}BCS${num}`
            }
        }

        if (roll) {
            const year2 = roll.slice(0, 2)
            const program = roll.replace(/^[0-9]{2}([A-Z]+)/, '$1')
            const startYear = 2000 + parseInt(year2, 10)
            const endYear = startYear + 4
            batch = `${program} ${startYear}-${endYear}`
        }

        return { name: displayName || '—', roll: roll || '—', batch: batch || '—' }
    }, [userInfo])

    const loadAttendance = async (sid: string) => {
        setLoading(true)
        try {
            const email = localStorage.getItem('demoEmail')
            if (isDemoFirebase && email) setDemoEmail(email)
            
            const { data } = await api.get(`/api/attendance/student/${sid}/entries`)
            const fetchedEntries = data?.entries || []
            
            // Ensure entries are sorted by date (newest first) and then by period
            const sortedEntries = fetchedEntries.sort((a: any, b: any) => {
                const dateCompare = new Date(b.date).getTime() - new Date(a.date).getTime()
                if (dateCompare !== 0) return dateCompare
                
                // If same date, sort by period order
                const periodOrder = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII']
                const aIndex = periodOrder.indexOf(a.period)
                const bIndex = periodOrder.indexOf(b.period)
                return aIndex - bIndex
            })
            
            setEntries(sortedEntries)
        } catch (err) {
            console.error('Error loading attendance:', err)
            setEntries([])
        } finally {
            setLoading(false)
        }
    }

    const totals = useMemo(() => {
        const total = entries.length
        const present = entries.filter(e => e.present).length
        const absent = total - present
        const od = 0 // OD hours (On Duty) - not implemented yet
        const leave = 0 // Leave hours - not implemented yet
        const presentPercentage = total > 0 ? (present / total) * 100 : 0
        const absentPercentage = total > 0 ? (absent / total) * 100 : 0
        const odPercentage = 0
        const leavePercentage = 0
        return { total, present, absent, od, leave, presentPercentage, absentPercentage, odPercentage, leavePercentage }
    }, [entries])

    const bySubject: SubjectSummary[] = useMemo(() => {
        const map = new Map<string, SubjectSummary>()
        for (const e of entries) {
            if (!e.subject) continue
            const key = e.subject.id
            if (!map.has(key)) {
                map.set(key, {
                    subjectId: key,
                    code: e.subject.code,
                    name: e.subject.name,
                    section: e.subject.section,
                    total: 0,
                    present: 0,
                    absent: 0,
                    od: 0,
                    leave: 0,
                    presentPercent: 0,
                    absentPercent: 0,
                    odPercent: 0,
                    leavePercent: 0
                })
            }
            const s = map.get(key)!
            s.total += 1
            if (e.present) s.present += 1
            else s.absent += 1
        }
        for (const s of map.values()) {
            s.presentPercent = s.total > 0 ? Math.round((s.present / s.total) * 10000) / 100 : 0
            s.absentPercent = s.total > 0 ? Math.round((s.absent / s.total) * 10000) / 100 : 0
            s.odPercent = 0
            s.leavePercent = 0
        }
        return Array.from(map.values()).sort((a, b) => a.code.localeCompare(b.code))
    }, [entries])

    // Build period-wise grid for recent days (I..VIII)
    const periodGrid = useMemo(() => {
        const periodOrder = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII']
        const byDate: Record<string, Record<string, { present: boolean; subject: string; createdAt: string }>> = {}
        
        for (const e of entries) {
            const d = e.date
            if (!byDate[d]) byDate[d] = {}
            
            // Normalize period to match periodOrder format (handle any variations)
            let period = e.period
            // Ensure period matches exactly (trim whitespace, handle case)
            period = period.trim()
            
            // Only add if period is in our valid period order
            if (periodOrder.includes(period)) {
                // If multiple entries for same date+period, keep the most recent one
                const existing = byDate[d][period]
                if (!existing || new Date(e.createdAt) > new Date(existing.createdAt)) {
                    byDate[d][period] = {
                        present: e.present,
                        subject: e.subject ? `${e.subject.code} - ${e.subject.name}` : 'Unknown',
                        createdAt: e.createdAt
                    }
                }
            }
        }
        
        const dates = Object.keys(byDate).sort((a, b) => new Date(b + 'T00:00:00').getTime() - new Date(a + 'T00:00:00').getTime())
        // Show all dates
        return { periodOrder, rows: dates.map(d => ({ date: d, periods: byDate[d] })) }
    }, [entries])

    return (
        <div className="p-4">
            <div className="rounded-md border overflow-hidden bg-white">
                <div className="px-4 py-2 bg-blue-700 text-white text-sm font-medium flex items-center gap-2">
                    <span className="truncate">Attendance Summary</span>
                    {socket.connected && <span className="text-xs">● Live</span>}
                    <div className="ml-auto flex items-center gap-3">
                        <button
                            onClick={() => studentId && loadAttendance(studentId)}
                            disabled={loading}
                            className="px-2 py-1 text-xs rounded bg-blue-600 text-white hover:bg-blue-500 disabled:opacity-50"
                            title="Refresh attendance"
                        >
                            {loading ? 'Loading...' : 'Refresh'}
                        </button>
                        <div className="hidden md:flex items-center gap-2">
                            <span className="text-xs opacity-85">Semester</span>
                            <div className="flex items-center rounded overflow-hidden border border-white/30">
                                {Array.from({ length: 8 }, (_, i) => i + 1).map(s => (
                                    <button key={s} onClick={() => setSelectedSemester(s)} className={`px-2 py-1 text-xs ${selectedSemester === s ? 'bg-white text-blue-700' : 'bg-blue-600 text-white'} ${s !== 1 ? 'border-l border-white/20' : ''}`}>{s}</button>
                                ))}
                            </div>
                        </div>
                        <div className="flex items-center gap-1">
                            <button aria-label="Prev page" onClick={() => setPage(p => Math.max(1, p - 1))} className="px-2 py-1 text-xs rounded bg-blue-600 text-white">◄</button>
                            <button onClick={() => setPage(1)} className={`px-2 py-1 text-xs rounded ${page === 1 ? 'bg-white text-blue-700' : 'bg-blue-600 text-white'}`}>1</button>
                            <button onClick={() => setPage(2)} className={`px-2 py-1 text-xs rounded ${page === 2 ? 'bg-white text-blue-700' : 'bg-blue-600 text-white'}`}>2</button>
                            <button aria-label="Next page" onClick={() => setPage(p => Math.min(2, p + 1))} className="px-2 py-1 text-xs rounded bg-blue-600 text-white">►</button>
                        </div>
                    </div>
                </div>

                {loading ? (
                    <div className="p-8 text-center text-gray-500">Loading attendance...</div>
                ) : entries.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">No attendance records found. Attendance will appear here when marked by staff.</div>
                ) : (
                    <div className="p-4 space-y-6">
                        {page === 1 && (
                            <>
                                {/* Title row + run date */}
                                <div className="flex items-center justify-between">
                                    <h2 className="text-lg font-semibold">{selectedSemester}th Semester Attendance</h2>
                                    <div className="text-xs">Run Date: {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-')}</div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="border rounded p-3">
                                        <div className="text-xs text-gray-500">Student</div>
                                        <div className="font-medium">{derived.name}</div>
                                    </div>
                                    <div className="border rounded p-3">
                                        <div className="text-xs text-gray-500">Roll no</div>
                                        <div className="font-medium">{derived.roll}</div>
                                    </div>
                                    <div className="border rounded p-3">
                                        <div className="text-xs text-gray-500">Batch</div>
                                        <div className="font-medium">{derived.batch}</div>
                                    </div>
                                </div>

                                {/* Current Semester Attendance details (label-value style) */}
                                <div className="rounded border p-4">
                                    <div className="text-sm font-medium mb-2">Current Semester Attendance details</div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-y-1 text-sm">
                                        <div className="flex items-center gap-2"><span className="w-40 text-gray-600">Total hours :</span><span className="font-medium">{totals.total}</span></div>
                                        <div className="flex items-center gap-2"><span className="w-40 text-gray-600">Present hours :</span><span className="font-medium">{totals.present}</span></div>
                                        <div className="flex items-center gap-2"><span className="w-40 text-gray-600">Absent hours :</span><span className="font-medium">{totals.absent}</span></div>
                                        <div className="flex items-center gap-2"><span className="w-40 text-gray-600">OD hours :</span><span className="font-medium">{totals.od}</span></div>
                                        <div className="flex items-center gap-2"><span className="w-40 text-gray-600">Leave hours :</span><span className="font-medium">{totals.leave}</span></div>
                                        <div className="flex items-center gap-2"><span className="w-40 text-gray-600">Present % :</span><span className="font-medium">{totals.presentPercentage.toFixed(2)}</span></div>
                                        <div className="flex items-center gap-2"><span className="w-40 text-gray-600">Absent % :</span><span className="font-medium">{totals.absentPercentage.toFixed(2)}</span></div>
                                        <div className="flex items-center gap-2"><span className="w-40 text-gray-600">OD % :</span><span className="font-medium">{totals.odPercentage.toFixed(2)}</span></div>
                                        <div className="flex items-center gap-2"><span className="w-40 text-gray-600">Leave % :</span><span className="font-medium">{totals.leavePercentage.toFixed(2)}</span></div>
                                    </div>
                                </div>

                                {/* Semester wise attendance graph */}
                                <div className="border rounded p-4 bg-white">
                                    <div className="text-sm font-medium mb-4">Semester wise attendance details</div>
                                    <div className="flex items-end justify-center gap-8 h-48">
                                        <div className="flex flex-col items-center gap-2">
                                            <div className="bg-blue-600 w-12 rounded-t" style={{ height: `${totals.presentPercentage}%`, minHeight: totals.presentPercentage > 0 ? '4px' : '0' }} />
                                            <span className="text-xs font-medium">Total Present</span>
                                            <span className="text-xs text-gray-500">{totals.presentPercentage.toFixed(2)}%</span>
                                        </div>
                                        <div className="flex flex-col items-center gap-2">
                                            <div className="bg-rose-500 w-12 rounded-t" style={{ height: `${totals.absentPercentage}%`, minHeight: totals.absentPercentage > 0 ? '4px' : '0' }} />
                                            <span className="text-xs font-medium">Total Absent</span>
                                            <span className="text-xs text-gray-500">{totals.absentPercentage.toFixed(2)}%</span>
                                        </div>
                                        <div className="flex flex-col items-center gap-2">
                                            <div className="bg-yellow-500 w-12 rounded-t" style={{ height: `${totals.odPercentage}%`, minHeight: totals.odPercentage > 0 ? '4px' : '0' }} />
                                            <span className="text-xs font-medium">Total OD</span>
                                            <span className="text-xs text-gray-500">{totals.odPercentage.toFixed(2)}%</span>
                                        </div>
                                        <div className="flex flex-col items-center gap-2">
                                            <div className="bg-purple-500 w-12 rounded-t" style={{ height: `${totals.leavePercentage}%`, minHeight: totals.leavePercentage > 0 ? '4px' : '0' }} />
                                            <span className="text-xs font-medium">Total Leave</span>
                                            <span className="text-xs text-gray-500">{totals.leavePercentage.toFixed(2)}%</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="rounded-md border bg-white overflow-hidden">
                                    <div className="px-3 py-2 text-sm font-medium border-b bg-gray-50">Subject wise attendance details</div>
                                    <div className="overflow-auto">
                                        <table className="min-w-full text-sm">
                                            <thead className="bg-white">
                                                <tr className="text-left text-gray-600">
                                                    <th className="px-3 py-2 whitespace-nowrap">Code</th>
                                                    <th className="px-3 py-2">Name</th>
                                                    <th className="px-3 py-2 whitespace-nowrap">Total hours</th>
                                                    <th className="px-3 py-2 whitespace-nowrap">Present hours</th>
                                                    <th className="px-3 py-2 whitespace-nowrap">Absent hours</th>
                                                    <th className="px-3 py-2 whitespace-nowrap">OD hours</th>
                                                    <th className="px-3 py-2 whitespace-nowrap">Leave hours</th>
                                                    <th className="px-3 py-2 whitespace-nowrap">Present %</th>
                                                    <th className="px-3 py-2 whitespace-nowrap">Absent %</th>
                                                    <th className="px-3 py-2 whitespace-nowrap">OD %</th>
                                                    <th className="px-3 py-2 whitespace-nowrap">Leave %</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {bySubject.length === 0 ? (
                                                    <tr>
                                                        <td colSpan={11} className="px-3 py-4 text-center text-gray-500">
                                                            No attendance records found for any subject
                                                        </td>
                                                    </tr>
                                                ) : (
                                                    bySubject.map((s) => (
                                                        <tr key={s.subjectId} className="border-t hover:bg-gray-50">
                                                            <td className="px-3 py-2 whitespace-nowrap font-medium">{s.code}</td>
                                                            <td className="px-3 py-2">{s.name}</td>
                                                            <td className="px-3 py-2 text-center">{s.total}</td>
                                                            <td className="px-3 py-2 text-center text-emerald-700 font-medium">{s.present}</td>
                                                            <td className="px-3 py-2 text-center text-rose-700 font-medium">{s.absent}</td>
                                                            <td className="px-3 py-2 text-center text-yellow-700">{s.od}</td>
                                                            <td className="px-3 py-2 text-center text-purple-700">{s.leave}</td>
                                                            <td className="px-3 py-2 text-center font-medium text-emerald-700">{s.presentPercent.toFixed(2)}%</td>
                                                            <td className="px-3 py-2 text-center font-medium text-rose-700">{s.absentPercent.toFixed(2)}%</td>
                                                            <td className="px-3 py-2 text-center font-medium text-yellow-700">{s.odPercent.toFixed(2)}%</td>
                                                            <td className="px-3 py-2 text-center font-medium text-purple-700">{s.leavePercent.toFixed(2)}%</td>
                                                        </tr>
                                                    ))
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </>
                        )}

                        {page === 2 && (
                            <div className="rounded-md border bg-white overflow-hidden">
                                <div className="px-3 py-2 text-sm font-medium border-b bg-gray-50">Period wise attendance details</div>
                                <div className="overflow-auto">
                                    <table className="min-w-full text-sm">
                                        <thead className="bg-white">
                                            <tr className="text-left text-gray-600">
                                                <th className="px-3 py-2">Date</th>
                                                {periodGrid.periodOrder.map(p => (
                                                    <th key={p} className="px-3 py-2 text-center">{p}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {periodGrid.rows.length === 0 ? (
                                                <tr>
                                                    <td colSpan={9} className="px-3 py-4 text-center text-gray-500">
                                                        No attendance records found
                                                    </td>
                                                </tr>
                                            ) : (
                                                periodGrid.rows.map(r => {
                                                    const dateObj = new Date(r.date + 'T00:00:00') // Ensure proper date parsing
                                                    const day = dateObj.getDate().toString().padStart(2, '0')
                                                    const month = (dateObj.getMonth() + 1).toString().padStart(2, '0')
                                                    const year = dateObj.getFullYear()
                                                    const formattedDate = `${day}/${month}/${year}`
                                                    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
                                                    const dayName = dayNames[dateObj.getDay()]
                                                    return (
                                                        <tr key={r.date} className="border-t hover:bg-gray-50">
                                                            <td className="px-3 py-2 whitespace-nowrap">
                                                                <div className="font-medium">{formattedDate}</div>
                                                                <div className="text-xs text-gray-500">{dayName}</div>
                                                            </td>
                                                            {periodGrid.periodOrder.map(p => {
                                                                const periodData = r.periods[p]
                                                                if (!periodData) {
                                                                    return <td key={p} className="px-3 py-2 text-center text-gray-300">—</td>
                                                                }
                                                                const cls = periodData.present ? 'text-emerald-700 font-medium' : 'text-rose-700 font-medium'
                                                                const label = periodData.present ? 'P' : 'A'
                                                                const title = `${periodData.subject} - ${periodData.present ? 'Present' : 'Absent'}`
                                                                return (
                                                                    <td key={p} className={`px-3 py-2 text-center ${cls}`} title={title}>
                                                                        <span className="inline-block w-6">{label}</span>
                                                                    </td>
                                                                )
                                                            })}
                                                        </tr>
                                                    )
                                                })
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}


