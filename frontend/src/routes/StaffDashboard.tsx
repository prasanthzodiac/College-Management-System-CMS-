import React from 'react'
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { signOut } from 'firebase/auth'
import { auth, isDemoFirebase } from '../services/firebase'
import api, { setDemoEmail } from '../lib/api'
import socket from '../services/socket'
import { toast } from 'sonner'

export function StaffDashboard() {
    const [showCircular, setShowCircular] = React.useState(false)
    const [eventsSummary, setEventsSummary] = React.useState<any[]>([])
    const [circularSummary, setCircularSummary] = React.useState<any[]>([])
    const [selectedCircular, setSelectedCircular] = React.useState<any | null>(null)
    const [circularIndex, setCircularIndex] = React.useState(0)
    const [openAcademic, setOpenAcademic] = React.useState(true)
    const [reminderTab, setReminderTab] = React.useState<'students' | 'staffs'>('students')
    const [showSearch, setShowSearch] = React.useState(false)
    const [searchQuery, setSearchQuery] = React.useState('')
    const [showNotifications, setShowNotifications] = React.useState(false)
    const location = useLocation()
    const isSubjectCard = location.pathname.includes('/dashboard/staff/academic/subject-card')
    const isClassTimeTable = location.pathname.includes('/dashboard/staff/academic/class-time-table')
    const isEventPage = location.pathname.includes('/dashboard/staff/academic/event')
    const isStudentAttendance = location.pathname.includes('/dashboard/staff/academic/student-attendance')
    const isCircularPage = location.pathname.includes('/dashboard/staff/academic/circular')
    const isInternalMarksPage = location.pathname.includes('/dashboard/staff/academic/internal-marks')
    const isLeaveApproval = location.pathname.includes('/dashboard/staff/academic/leave-approval')
    const isAdmission = location.pathname.includes('/dashboard/staff/admission')
    const isFeedback = location.pathname.includes('/dashboard/staff/feedback')
    const isGrievance = location.pathname.includes('/dashboard/staff/grievance')
    const isReport = location.pathname.includes('/dashboard/staff/report')
    const [showProfile, setShowProfile] = React.useState(false)
    const [displayName, setDisplayName] = React.useState<string>(() => {
        const email = (typeof window !== 'undefined' ? localStorage.getItem('demoEmail') : null) || ''
        return email ? (email.split('@')[0] || 'Staff') : 'Staff'
    })
    const navigate = useNavigate()
    const onSignOut = async () => {
        try { await signOut(auth) } catch(_) {}
        navigate('/')
    }

    React.useEffect(() => {
        const load = async () => {
            const email = localStorage.getItem('demoEmail')
            if (isDemoFirebase && email) setDemoEmail(email)
            try {
                const { data } = await api.get('/api/auth/me')
                const user = data?.user
                setDisplayName(user?.name || (user?.email || '').split('@')[0] || 'Staff')
            } catch (_) {
                setDisplayName('Staff')
            }
        }
        load()
    }, [])

    React.useEffect(() => {
        const loadAnnouncements = async () => {
            try {
                const email = localStorage.getItem('demoEmail')
                if (isDemoFirebase && email) setDemoEmail(email)
                const [eventsRes, circularsRes] = await Promise.all([
                    api.get('/api/events').catch(() => ({ data: { events: [] } })),
                    api.get('/api/circulars').catch(() => ({ data: { circulars: [] } }))
                ])
                setEventsSummary(eventsRes.data?.events || [])
                setCircularSummary(circularsRes.data?.circulars || [])
            } catch (err) {
                console.error('Error loading announcements:', err)
            }
        }
        loadAnnouncements()
    }, [])

    const formatAnnouncementDate = (dateStr: string) => {
        if (!dateStr) return '—'
        const date = new Date(`${dateStr}T00:00:00`)
        if (Number.isNaN(date.getTime())) return dateStr
        return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    }

    const openCircularModalAt = (index: number) => {
        if (!circularSummary.length) return
        const normalized = ((index % circularSummary.length) + circularSummary.length) % circularSummary.length
        setCircularIndex(normalized)
        setSelectedCircular(circularSummary[normalized])
        setShowCircular(true)
    }

    const closeCircularModal = () => {
        setShowCircular(false)
        setSelectedCircular(null)
    }

    const handlePrevCircular = () => openCircularModalAt(circularIndex - 1)
    const handleNextCircular = () => openCircularModalAt(circularIndex + 1)

    const latestCircular = circularSummary[0] || null
    const eventHighlights = eventsSummary.slice(0, 4)

    const formatEventRange = (event: any) => {
        const start = formatAnnouncementDate(event.startDate)
        const end = formatAnnouncementDate(event.endDate)
        return start === end ? start : `${start} - ${end}`
    }

    const notifications = React.useMemo(() => {
        const eventNotes = eventsSummary.slice(0, 5).map((event: any) => ({
            type: 'event',
            id: event.id,
            title: `Event: ${event.title}`,
            time: event.startDate,
            action: () => navigate('/dashboard/staff/academic/event')
        }))
        const circularNotes = circularSummary.slice(0, 5).map((circular: any, index: number) => ({
            type: 'circular',
            id: circular.id,
            title: `Circular: ${circular.title}`,
            time: circular.issuedDate,
            action: () => {
                openCircularModalAt(index)
            }
        }))
        return [...eventNotes, ...circularNotes].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
    }, [eventsSummary, circularSummary, navigate])

    const handleSearch = () => {
        const term = searchQuery.trim().toLowerCase()
        if (!term) return

        const eventMatchIndex = eventsSummary.findIndex((event: any) =>
            (event.title || '').toLowerCase().includes(term) ||
            (event.department || '').toLowerCase().includes(term)
        )
        if (eventMatchIndex !== -1) {
            navigate('/dashboard/staff/academic/event')
            setShowSearch(false)
            setSearchQuery('')
            return
        }

        const circularMatchIndex = circularSummary.findIndex((circular: any) =>
            (circular.title || '').toLowerCase().includes(term) ||
            (circular.circularNo || '').toLowerCase().includes(term)
        )
        if (circularMatchIndex !== -1) {
            openCircularModalAt(circularMatchIndex)
            setShowSearch(false)
            setSearchQuery('')
            return
        }

        toast.info('No matching events or circulars found')
        setShowSearch(false)
        setSearchQuery('')
    }

	return (
        <div className="min-h-screen bg-gray-50">
            {/* Body with left sidebar */}
            <div className="min-h-screen flex">
                    {/* Sidebar */}
                    <aside className="w-64 bg-blue-700 text-white border-r border-blue-600">
                        {/* Brand */}
                        <div className="px-4 py-3 border-b border-white/10">
                            <div className="text-lg font-bold tracking-wide">CollegeConnect</div>
                        </div>
                        {/* Profile */}
                        <div className="px-4 py-5 border-b border-white/10 text-center">
                            <div className="mx-auto h-16 w-16 rounded-full bg-white/90" />
                            <div className="mt-3 text-sm font-semibold">{displayName || 'Staff'}</div>
                            <div className="text-xs opacity-90">ASSOCIATE PROFESSOR</div>
                        </div>
                        <nav className="p-2 text-sm space-y-1">
                            <NavItem label="Dashboard" icon="home" to="/dashboard/staff" />
                            {/* Academic with subsections */}
                            <button
                                className="w-full text-left px-3 py-2 rounded-md hover:bg-blue-600 focus:bg-blue-600 flex items-center justify-between"
                                onClick={() => setOpenAcademic((v) => !v)}
                            >
                                <span className="flex items-center gap-2"><SVGIcon name="book" className="w-4 h-4 opacity-90" />Academic</span>
                                <span className={`transition-transform ${openAcademic ? 'rotate-0' : '-rotate-90'}`}>▾</span>
                            </button>
                            {openAcademic && (
                                <div className="ml-2 pl-2 border-l border-white/15 space-y-1">
                                    <SubItem label="Class Time Table" icon="calendar" to="/dashboard/staff/academic/class-time-table" />
                                    <SubItem label="Event" icon="ticket" to="/dashboard/staff/academic/event" />
                                    <SubItem label="Circulars" icon="calendar" to="/dashboard/staff/academic/circular" />
                                    <SubItem label="Internal Marks" icon="document" to="/dashboard/staff/academic/internal-marks" />
                                    <SubItem label="Student attendance" icon="checklist" to="/dashboard/staff/academic/student-attendance" />
                                    <SubItem label="Subject Card" icon="idcard" to="/dashboard/staff/academic/subject-card" />
                                    <SubItem label="Leave Approval" icon="calendar" to="/dashboard/staff/academic/leave-approval" />
                                </div>
                            )}
                            <NavItem label="Grievance" icon="chat" to="/dashboard/staff/grievance" />
                            <NavItem label="Admission" icon="clipboard" to="/dashboard/staff/admission" />
                            <NavItem label="Feedback" icon="chat" to="/dashboard/staff/feedback" />
                            <NavItem label="Report" icon="document" to="/dashboard/staff/report" />
                        </nav>
                    </aside>

                    {/* Main content */}
                    <main className="flex-1 p-6">
                        {/* Right-aligned toolbar */}
                        <div className="flex items-center justify-between mb-4">
		<div>
			<h2 className="text-xl font-semibold">Staff Dashboard</h2>
                                <p className="text-sm text-gray-600">Quick overview and tools.</p>
                            </div>
                            <div className="flex items-center gap-3 relative">
                                <div className="hidden sm:block text-sm text-gray-700"><Clock /></div>
                                {socket.connected && <span className="text-xs text-green-600">● Live</span>}
                                <IconButton label="Favorite">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="#1d4ed8" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.2 3.57a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.486 20.507a.562.562 0 01-.84-.61l1.285-5.385a.563.563 0 00-.182-.557l-4.2-3.57a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                                    </svg>
                                </IconButton>
                                {showSearch ? (
                                    <div className="flex items-center gap-2 bg-white border rounded px-2 py-1">
                                        <input
                                            type="text"
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                            placeholder="Search events or circulars"
                                            className="bg-white text-sm outline-none w-48"
                                            autoFocus
                                        />
                                        <button onClick={handleSearch} className="p-1 hover:bg-gray-100 rounded">
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-4 h-4 text-blue-700">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 103.75 3.75a7.5 7.5 0 0012.9 12.9z" />
                                            </svg>
                                        </button>
                                        <button onClick={() => { setShowSearch(false); setSearchQuery('') }} className="p-1 hover:bg-gray-100 rounded text-gray-500">
                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                                                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                                            </svg>
                                        </button>
                                    </div>
                                ) : (
                                    <IconButton label="Search" onClick={() => setShowSearch(true)}>
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5 text-blue-700">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 103.75 3.75a7.5 7.5 0 0012.9 12.9z" />
                                    </svg>
                                </IconButton>
                                )}
                                <div className="relative">
                                    <IconButton label="Notifications" onClick={() => setShowNotifications((v) => !v)}>
                                        <span className="relative inline-flex">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5 text-blue-700">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.966 8.966 0 0118 9.75V9a6 6 0 10-12 0v.75a8.966 8.966 0 01-2.311 6.022c1.76.68 3.575 1.12 5.454 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
                                    </svg>
                                            {notifications.length > 0 && (
                                                <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] rounded-full h-5 w-5 flex items-center justify-center">
                                                    {notifications.length}
                                                </span>
                                            )}
                                        </span>
                                </IconButton>
                                    {showNotifications && (
                                        <div className="absolute right-0 mt-2 w-72 bg-white rounded-md shadow-lg border z-50 max-h-80 overflow-y-auto">
                                            <div className="px-4 py-2 border-b font-semibold text-sm">Notifications</div>
                                            {notifications.length === 0 ? (
                                                <div className="px-4 py-6 text-center text-sm text-gray-500">No notifications</div>
                                            ) : (
                                                <div className="divide-y">
                                                    {notifications.map((note) => (
                                                        <button
                                                            key={note.id}
                                                            onClick={() => {
                                                                setShowNotifications(false)
                                                                note.action()
                                                            }}
                                                            className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors"
                                                        >
                                                            <div className="text-sm font-medium text-gray-900">{note.title}</div>
                                                            <div className="text-xs text-gray-500 mt-1">
                                                                {formatAnnouncementDate(note.time)}
                                                            </div>
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                                <button onClick={() => setShowProfile((v) => !v)} className="h-7 w-7 rounded-full bg-gray-300" />
                                {showProfile && (
                                    <div className="absolute right-0 top-8 w-40 rounded-md bg-white text-black shadow z-50">
                                        <button onClick={onSignOut} className="block w-full text-left px-3 py-2 hover:bg-gray-100 text-sm">Sign out</button>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Nested routes render here */}
                        <Outlet />

                        {!isSubjectCard && !isClassTimeTable && !isEventPage && !isStudentAttendance && !isCircularPage && !isInternalMarksPage && !isLeaveApproval && !isAdmission && !isFeedback && !isGrievance && !isReport && (
                            <>
                                {/* Quick Links */}
                                <section className="mb-5 border rounded-md bg-white">
                                    <div className="px-4 py-2 border-b bg-gray-50 rounded-t-md text-sm font-medium">Quick Actions</div>
                                    <div className="p-4 grid grid-cols-2 gap-3">
                                        <button onClick={() => navigate('/dashboard/staff/academic/class-time-table')} className="p-3 border rounded hover:bg-gray-50 text-left">
                                            <div className="font-medium text-sm">Class Timetable</div>
                                            <div className="text-xs text-gray-500 mt-1">View weekly schedule</div>
                                        </button>
                                        <button onClick={() => navigate('/dashboard/staff/academic/student-attendance')} className="p-3 border rounded hover:bg-gray-50 text-left">
                                            <div className="font-medium text-sm">Student Attendance</div>
                                            <div className="text-xs text-gray-500 mt-1">Search by roll number</div>
                                        </button>
                                        <button onClick={() => navigate('/dashboard/staff/academic/subject-card')} className="p-3 border rounded hover:bg-gray-50 text-left">
                                            <div className="font-medium text-sm">Subject Cards</div>
                                            <div className="text-xs text-gray-500 mt-1">Update subject information</div>
                                        </button>
                                        <button onClick={() => navigate('/dashboard/staff/academic/leave-approval')} className="p-3 border rounded hover:bg-gray-50 text-left">
                                            <div className="font-medium text-sm">Review Leaves</div>
                                            <div className="text-xs text-gray-500 mt-1">Approve or reject requests</div>
                                        </button>
                                        <button onClick={() => navigate('/dashboard/staff/academic/event')} className="p-3 border rounded hover:bg-gray-50 text-left">
                                            <div className="font-medium text-sm">View Events</div>
                                            <div className="text-xs text-gray-500 mt-1">Latest announcements</div>
                                        </button>
                                        <button onClick={() => navigate('/dashboard/staff/academic/circular')} className="p-3 border rounded hover:bg-gray-50 text-left">
                                            <div className="font-medium text-sm">View Circulars</div>
                                            <div className="text-xs text-gray-500 mt-1">Official notices</div>
                                        </button>
                                        <button onClick={() => navigate('/dashboard/staff/academic/internal-marks')} className="p-3 border rounded hover:bg-gray-50 text-left">
                                            <div className="font-medium text-sm">Record Internal Marks</div>
                                            <div className="text-xs text-gray-500 mt-1">Add or review scores</div>
                                        </button>
                                    </div>
                                </section>

                                {/* Circulars and News & Events */}
                                <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                                    <div
                                        className={`lg:col-span-1 border rounded-md bg-white ${latestCircular ? 'cursor-pointer' : ''}`}
                                        onClick={() => latestCircular && openCircularModalAt(0)}
                                    >
                                <div className="px-4 py-2 border-b bg-gray-50 rounded-t-md text-sm font-medium flex items-center gap-2">
                                    <span>Circulars</span>
                                            <span className="text-xs text-gray-500">{circularSummary.length}</span>
                                </div>
                                        <div className="p-4 text-sm">
                                            {latestCircular ? (
                                    <div className="flex gap-3 items-start">
                                        <div className="w-16 h-16 rounded bg-blue-700 text-white flex flex-col items-center justify-center text-xs font-semibold">
                                                        <div>{new Date(`${latestCircular.issuedDate}T00:00:00`).getDate().toString().padStart(2, '0')}</div>
                                                        <div>{new Date(`${latestCircular.issuedDate}T00:00:00`).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}</div>
                                        </div>
                                        <div className="flex-1">
                                                        <div className="text-sm font-medium text-blue-900">{latestCircular.title}</div>
                                                        <div className="mt-1 text-xs text-gray-600">{latestCircular.circularNo || '—'}</div>
                                                        <div className="mt-1 text-xs text-gray-600">{latestCircular.department || '—'}</div>
                                        </div>
                                    </div>
                                            ) : (
                                                <div className="text-sm text-gray-500">No circulars available.</div>
                                            )}
                                </div>
                            </div>

                            <div className="lg:col-span-2 border rounded-md bg-white">
                                <div className="px-4 py-2 border-b bg-gray-50 rounded-t-md text-sm font-medium flex items-center gap-2">
                                    <span>News & Events</span>
                                            <span className="text-xs text-gray-500">{eventsSummary.length}</span>
                                </div>
                                <div className="divide-y">
                                            {eventHighlights.length === 0 ? (
                                                <div className="p-4 text-sm text-gray-500">No upcoming events.</div>
                                            ) : (
                                                eventHighlights.map((event, idx) => (
                                                    <div key={event.id || idx} className="p-4 flex items-start gap-3">
                                            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#1d4ed8" className="w-5 h-5">
                                                                <path d="M6.75 2.25a.75.75 0 01.75.75V4.5h9V3a.75.75 0 011.5 0V4.5h.75A2.25 2.25 0 0121 6.75v10.5A2.25 2.25 0 0118.75 19.5H5.25A2.25 2.25 0 013 17.75V6.75A2.25 2.25 0 015.25 4.5H6V3a.75.75 0 01.75-.75z" />
                                                    <path d="M5.25 7.5a.75.75 0 000 1.5h13.5a.75.75 0 000-1.5H5.25z" />
                                                </svg>
                                            </div>
                                            <div className="flex-1">
                                                            <div className="text-sm text-blue-900 font-medium">{event.title}</div>
                                                            <div className="text-xs text-gray-600">{event.department || '—'}</div>
                                                            <div className="text-xs text-gray-500 mt-1">Date: {formatEventRange(event)}</div>
                                                        </div>
                                            </div>
                                                ))
                                            )}
                                </div>
                            </div>
                                </section>

                                {/* Birthday / Wedding Day wishes with tab switch (moved below circulars/events) */}
                                <section className="mt-5 mb-5 border rounded-md bg-white">
                            <div className="flex items-center justify-between px-4 py-2 border-b bg-gray-50 rounded-t-md">
                                <div className="text-sm font-medium">Birthday / Wedding Day Wishes</div>
                                <div className="flex items-center gap-2 text-xs">
                                    <span className="text-gray-600">View:</span>
                                    <button
                                        className={`px-2 py-1 rounded border ${reminderTab === 'students' ? 'bg-blue-600 text-white border-blue-600' : 'hover:bg-gray-100'}`}
                                        onClick={() => setReminderTab('students')}
                                    >Students</button>
                                    <button
                                        className={`px-2 py-1 rounded border ${reminderTab === 'staffs' ? 'bg-blue-600 text-white border-blue-600' : 'hover:bg-gray-100'}`}
                                        onClick={() => setReminderTab('staffs')}
                                    >Staffs</button>
                                </div>
                            </div>
                            <div className="divide-y">
                                {(reminderTab === 'students' ? demoStudentReminders : demoStaffReminders).map((r, idx) => (
                                    <ReminderItem key={idx} name={r.name} email={r.email} phone={r.phone} details={r.details} />
                                ))}
                                    </div>
                                </section>

                                {/* Attendance Calendar */}
                                <section className="mb-6 border rounded-md bg-white">
                                    <AttendanceCalendar />
                                </section>
                            </>
                        )}

                        {showCircular && selectedCircular && (
                            <Modal onClose={closeCircularModal}>
                                <div className="w-[680px] max-w-[95vw]">
                                    <div className="bg-blue-700 text-white px-4 py-2 rounded-t-md text-sm font-semibold">Circular Details</div>
                                    <div className="bg-white p-4 rounded-b-md text-sm">
                                        <div className="space-y-4">
                                            <div>
                                                <div className="font-semibold mb-1">Circular Information</div>
                                                <div className="grid grid-cols-3 gap-3">
                                                    <LabelValue label="Circular No." value={selectedCircular.circularNo || '—'} />
                                                    <div className="col-span-2">
                                                        <LabelValue label="Title" value={selectedCircular.title || '—'} />
                                                    </div>
                                                </div>
                                            </div>
                                            <div>
                                                <div className="font-semibold mb-1">Date & Department</div>
                                                <div className="grid grid-cols-2 gap-3">
                                                    <LabelValue label="Issued Date" value={formatAnnouncementDate(selectedCircular.issuedDate)} />
                                                    <LabelValue label="Department" value={selectedCircular.department || '—'} />
                                                </div>
                                                {selectedCircular.description && (
                                                <div className="mt-2">
                                                        <LabelValue label="Description" value={selectedCircular.description} />
                                                </div>
                                                )}
                                            </div>
                                            <div>
                                                <div className="font-semibold mb-1">Attachment</div>
                                                {selectedCircular.attachmentUrl ? (
                                                    <div className="border rounded px-3 py-2">
                                                        <a className="text-blue-700 hover:underline" href={selectedCircular.attachmentUrl} target="_blank" rel="noreferrer">
                                                            View Attachment
                                                        </a>
                                                    </div>
                                                ) : (
                                                    <div className="text-gray-500">No attachment available.</div>
                                                )}
                                            </div>
                                        </div>
                                        <div className="mt-4 flex items-center justify-end gap-2">
                                            <button className="px-3 py-1.5 text-sm rounded border hover:bg-gray-100" onClick={handlePrevCircular}>Previous</button>
                                            <button className="px-3 py-1.5 text-sm rounded border hover:bg-gray-100" onClick={handleNextCircular}>Next</button>
                                            <button className="px-3 py-1.5 text-sm rounded bg-rose-600 text-white" onClick={closeCircularModal}>Close</button>
                                        </div>
                                    </div>
                                </div>
                            </Modal>
                        )}
                    </main>
            </div>
        </div>
    )
}

function NavItem({ label, icon, to }: { label: string; icon?: IconName; to?: string }) {
    return (
        to ? (
            <Link to={to} className="block w-full text-left px-3 py-2 rounded-md hover:bg-blue-600 focus:bg-blue-600 flex items-center gap-2">
                {icon && <SVGIcon name={icon} className="w-4 h-4 opacity-90" />}
                <span>{label}</span>
            </Link>
        ) : (
            <button className="w-full text-left px-3 py-2 rounded-md hover:bg-blue-600 focus:bg-blue-600 flex items-center gap-2">
                {icon && <SVGIcon name={icon} className="w-4 h-4 opacity-90" />}
                <span>{label}</span>
            </button>
        )
    )
}

function Card({ title, subtitle }: { title: string; subtitle?: string }) {
    return (
        <div className="border rounded-md p-4">
            <div className="text-sm font-medium">{title}</div>
            {subtitle && <div className="text-xs text-gray-500">{subtitle}</div>}
            <div className="h-16" />
        </div>
    )
}

function IconButton({ children, label, onClick }: { children: React.ReactNode; label: string; onClick?: () => void }) {
    return (
        <button aria-label={label} title={label} className="p-1.5 rounded hover:bg-gray-100" onClick={onClick}>
            {children}
        </button>
    )
}

function Clock() {
    const [now, setNow] = React.useState(new Date())
    React.useEffect(() => {
        const id = setInterval(() => setNow(new Date()), 1000)
        return () => clearInterval(id)
    }, [])
    return <span>{now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
}

function Modal({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
    React.useEffect(() => {
        const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
        window.addEventListener('keydown', onKey)
        return () => window.removeEventListener('keydown', onKey)
    }, [onClose])
    return (
        <div className="fixed inset-0 z-50">
            <div className="absolute inset-0 bg-black/30" onClick={onClose} />
            <div className="absolute inset-0 flex items-center justify-center p-4">
                {children}
            </div>
        </div>
    )
}

function LabelValue({ label, value }: { label: string; value: string }) {
    return (
        <div>
            <div className="text-[11px] uppercase tracking-wide text-gray-500">{label}</div>
            <div className="text-sm text-gray-900">{value}</div>
        </div>
    )
}

type IconName =
    | 'home' | 'book' | 'clipboard' | 'cube' | 'pencil' | 'chat' | 'users'
    | 'document' | 'calendar' | 'chart' | 'collection' | 'ticket' | 'building' | 'switch' | 'target' | 'checklist' | 'star' | 'money' | 'idcard'

function SubItem({ label, active, icon, to }: { label: string; active?: boolean; icon?: IconName; to?: string }) {
    return (
        to ? (
            <Link
                to={to}
                className={`block w-full text-left px-3 py-2 rounded-md flex items-center gap-2 ${
                    active ? 'bg-blue-600' : 'hover:bg-blue-600'
                }`}
            >
                {icon ? <SVGIcon name={icon} className="w-4 h-4 opacity-90" /> : <span className="opacity-90">▣</span>}
                <span className="truncate">{label}</span>
            </Link>
        ) : (
            <button
                className={`w-full text-left px-3 py-2 rounded-md flex items-center gap-2 ${
                    active ? 'bg-blue-600' : 'hover:bg-blue-600'
                }`}
            >
                {icon ? <SVGIcon name={icon} className="w-4 h-4 opacity-90" /> : <span className="opacity-90">▣</span>}
                <span className="truncate">{label}</span>
            </button>
        )
    )
}

function GroupHeader({ title }: { title: string }) {
    return <div className="px-3 py-1 text-[11px] uppercase tracking-wide text-white/80">{title}</div>
}

function SVGIcon({ name, className }: { name: IconName; className?: string }) {
    switch (name) {
        case 'home':
            return (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}><path d="M11.47 3.84a.75.75 0 011.06 0l7 7A.75.75 0 0119.75 12H18v7.25a.75.75 0 01-.75.75h-3.5a.75.75 0 01-.75-.75V15h-2v4.25c0 .414-.336.75-.75.75H6.75a.75.75 0 01-.75-.75V12H4.25a.75.75 0 01-.53-1.28l7-7z"/></svg>
            )
        case 'book':
            return (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}><path d="M4.5 3.75A2.25 2.25 0 016.75 1.5h10.5A2.25 2.25 0 0119.5 3.75v15a.75.75 0 01-.75.75H6.75A2.25 2.25 0 014.5 17.25v-13.5z"/><path d="M6.75 3h10.5v3H6.75A.75.75 0 016 5.25V3.75A.75.75 0 016.75 3z"/></svg>
            )
        case 'clipboard':
            return (<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}><path d="M9 2.25h6A1.5 1.5 0 0116.5 3.75V6H7.5V3.75A1.5 1.5 0 019 2.25z"/><path d="M6.75 6H17.25A2.25 2.25 0 0119.5 8.25v10.5A2.25 2.25 0 0117.25 21H6.75A2.25 2.25 0 014.5 18.75V8.25A2.25 2.25 0 016.75 6z"/></svg>)
        case 'cube':
            return (<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}><path d="M11.25 2.59a1.5 1.5 0 011.5 0l6.75 3.75a1.5 1.5 0 01.75 1.3v8.72a1.5 1.5 0 01-.75 1.3l-6.75 3.75a1.5 1.5 0 01-1.5 0L4.5 17.66a1.5 1.5 0 01-.75-1.3V7.64a1.5 1.5 0 01.75-1.3l6.75-3.75z"/></svg>)
        case 'pencil':
            return (<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}><path d="M16.862 3.487a1.5 1.5 0 012.121 2.121l-10.5 10.5-3.182.53.53-3.182 10.5-10.5z"/></svg>)
        case 'chat':
            return (<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}><path d="M2.25 12A8.25 8.25 0 0110.5 3.75h3A8.25 8.25 0 0121.75 12v.75A6.75 6.75 0 0115 19.5H9l-4.5 2.25.75-3A6.75 6.75 0 012.25 12.75V12z"/></svg>)
        case 'users':
            return (<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}><path d="M15.75 6.75a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z"/><path d="M4.5 18a7.5 7.5 0 0115 0v.75a.75.75 0 01-.75.75h-13.5a.75.75 0 01-.75-.75V18z"/></svg>)
        case 'document':
            return (<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}><path d="M6 3.75A2.25 2.25 0 018.25 1.5h4.5L18 6.75v13.5A2.25 2.25 0 0115.75 22.5H8.25A2.25 2.25 0 016 20.25V3.75z"/></svg>)
        case 'calendar':
            return (<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}><path d="M6.75 3a.75.75 0 01.75.75V5h9V3.75a.75.75 0 011.5 0V5h.75A2.25 2.25 0 0121 7.25v10.5A2.25 2.25 0 0118.75 20H5.25A2.25 2.25 0 013 17.75V7.25A2.25 2.25 0 015.25 5H6V3.75A.75.75 0 016.75 3z"/></svg>)
        case 'chart':
            return (<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}><path d="M4.5 19.5h15v-1.5h-15v1.5zM7.5 6.75h2.25v9H7.5v-9zM11.625 9.75H13.875v6h-2.25v-6zM15.75 7.5H18v8.25h-2.25V7.5z"/></svg>)
        case 'collection':
            return (<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}><path d="M3.75 6A2.25 2.25 0 016 3.75h12A2.25 2.25 0 0120.25 6v10.5A2.25 2.25 0 0118 18.75H6A2.25 2.25 0 013.75 16.5V6z"/></svg>)
        case 'ticket':
            return (<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}><path d="M3.75 8.25h16.5v7.5H3.75v-7.5zM12 7.5v9"/></svg>)
        case 'building':
            return (<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}><path d="M4.5 21.75h15V3.75h-15v18zM9 7.5h6v3H9v-3z"/></svg>)
        case 'switch':
            return (<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}><path d="M7.5 6h9a4.5 4.5 0 010 9h-9a4.5 4.5 0 010-9z"/></svg>)
        case 'target':
            return (<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}><path d="M12 3.75a8.25 8.25 0 110 16.5 8.25 8.25 0 010-16.5zm0 3a5.25 5.25 0 100 10.5 5.25 5.25 0 000-10.5z"/></svg>)
        case 'checklist':
            return (<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}><path d="M4.5 6.75h9v1.5h-9v-1.5zM4.5 11.25h9v1.5h-9v-1.5zM4.5 15.75h9v1.5h-9v-1.5zM16.5 7.5l1.5 1.5L21 6"/></svg>)
        case 'star':
            return (<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#facc15" className={className}><path d="M11.48 3.5a.75.75 0 011.04 0l2.125 5.11a.75.75 0 00.475.345l5.518.442c.66.053.93.87.427 1.29l-4.2 3.57a.75.75 0 00-.243.744l1.285 5.385a.75.75 0 01-1.086.84l-4.725-2.885a.75.75 0 00-.768 0L6.486 21.24a.75.75 0 01-1.086-.84l1.285-5.385a.75.75 0 00-.243-.744l-4.2-3.57c-.503-.42-.233-1.237.427-1.29l5.518-.442a.75.75 0 00.475-.345L11.48 3.5z"/></svg>)
        case 'money':
            return (<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}><path d="M4.5 7.5h15v9h-15v-9zM12 9v6"/></svg>)
        case 'idcard':
            return (<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}><path d="M3.75 6A2.25 2.25 0 016 3.75h12A2.25 2.25 0 0120.25 6v12A2.25 2.25 0 0118 20.25H6A2.25 2.25 0 013.75 18V6z"/><path d="M8.25 8.25h7.5v1.5h-7.5v-1.5zM9 12a2.25 2.25 0 114.5 0A2.25 2.25 0 019 12z"/></svg>)
        default:
            return null
    }
}

// Demo data for reminders
const demoStudentReminders = [
    { name: 'THIRAAIVID M S', email: 'thiraaavid2004@gmail.com', phone: '727622BCS114', details: '21  BCS 2022-2026 - IV' },
    { name: 'GOKUL V', email: 'gokulsujai6@gmail.com', phone: '6374364499', details: '21  BCS 2022-2026 - IV' }
]

const demoStaffReminders = [
    { name: 'Dr. JOHN DOE', email: 'john@college.edu', phone: '9876543210', details: 'CSE Department' },
    { name: 'Ms. PRIYA K', email: 'priya@college.edu', phone: '9876501234', details: 'Mathematics' }
]

function ReminderItem({ name, email, phone, details }: { name: string; email: string; phone: string; details: string }) {
    return (
        <div className="px-4 py-3 flex items-start gap-3 text-sm">
            <div className="h-8 w-8 rounded-full bg-blue-200" />
            <div className="flex-1">
                <div className="flex items-center gap-2">
                    <div className="font-semibold text-blue-900">{name}</div>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-100 text-green-800">Birthday</span>
                </div>
                <div className="mt-0.5 text-xs text-gray-600 flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span className="flex items-center gap-1"><PhoneIcon className="w-3.5 h-3.5" />{phone}</span>
                    <span className="flex items-center gap-1"><MailIcon className="w-3.5 h-3.5" />{email}</span>
                    <span className="text-gray-500">{details}</span>
                </div>
            </div>
        </div>
    )
}

// Demo subjects
type SubjectInfo = {
    title: string
    section: string
    exams: string
    periods: number
    allocatedHours: number
    pendingAttendance: string
    assignment: string
    totalStudents: number
}

const demoSubjects: SubjectInfo[] = [
    { title: '23CSP501 - Reverse Engineering Project', section: 'III CSE A', exams: 'Exams & Class', periods: 90, allocatedHours: 90, pendingAttendance: '0/0', assignment: '0/0', totalStudents: 65 },
    { title: '23CST502 - Cyber and Digital Forensics', section: 'III CSE A', exams: 'Exams & Class', periods: 45, allocatedHours: 45, pendingAttendance: '0/0', assignment: '0/0', totalStudents: 66 },
    { title: '3MENTOR - MENTOR', section: 'III CSE B', exams: 'Class Only', periods: 30, allocatedHours: 10, pendingAttendance: '0/0', assignment: '0/0', totalStudents: 66 },
]

function SubjectCard({ subj }: { subj: SubjectInfo }) {
    return (
        <div className="rounded-md border bg-white overflow-hidden shadow-sm">
            <div className="px-3 py-2 bg-blue-50 text-blue-900 text-xs font-semibold flex items-center justify-between">
                <span>{subj.section}</span>
                <button className="p-1 rounded hover:bg-blue-100">⋯</button>
            </div>
            <div className="p-3">
                <div className="text-sm font-medium text-gray-900 mb-2">{subj.title}</div>
                <div className="flex flex-wrap gap-2 text-[11px]">
                    <Badge color="blue">{subj.exams}</Badge>
                    <Badge color="purple">Others</Badge>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-[11px] text-gray-700">
                    <KV k="Tot. Periods" v={`${subj.periods}`} />
                    <KV k="Max. Mark" v="75" />
                    <KV k="Allocated Hours" v={`${subj.allocatedHours}`} />
                    <KV k="Pending Attendance" v={subj.pendingAttendance} />
                    <KV k="Assignment" v={subj.assignment} />
                </div>
            </div>
            <div className="px-3 pb-3">
                <Badge color="teal">Total Students - {subj.totalStudents}</Badge>
            </div>
        </div>
    )
}

function KV({ k, v }: { k: string; v: string }) {
    return (
        <div className="flex items-center justify-between border rounded px-2 py-1 bg-gray-50">
            <span className="text-gray-500">{k}:</span>
            <span className="font-medium text-gray-800">{v}</span>
        </div>
    )
}

function Badge({ children, color }: { children: React.ReactNode; color: 'blue' | 'purple' | 'teal' }) {
    const colorMap: Record<string, string> = {
        blue: 'bg-blue-100 text-blue-800',
        purple: 'bg-violet-100 text-violet-800',
        teal: 'bg-emerald-100 text-emerald-800'
    }
    return <span className={`px-2 py-0.5 rounded ${colorMap[color]}`}>{children}</span>
}

function MailIcon({ className }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#1d4ed8" className={className}><path d="M3.75 6.75h16.5v10.5H3.75V6.75z"/><path d="M3.75 7.5L12 12.75 20.25 7.5" fill="#1d4ed8"/></svg>
    )
}

function PhoneIcon({ className }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#1d4ed8" className={className}><path d="M6.75 3.75h3l1.5 3-2.25 1.5a12 12 0 005.25 5.25l1.5-2.25 3 1.5v3a1.5 1.5 0 01-1.5 1.5A15.75 15.75 0 014.5 6.75 1.5 1.5 0 016 5.25z"/></svg>
    )
}

// Simple attendance calendar (demo)
function AttendanceCalendar() {
    const today = new Date()
    const [month, setMonth] = React.useState<number>(today.getMonth())
    const [year, setYear] = React.useState<number>(today.getFullYear())
    const days = getCalendarGridDays(year, month)

    const monthName = new Date(year, month).toLocaleString('default', { month: 'short' })

    const changeMonth = (delta: number) => {
        const d = new Date(year, month + delta, 1)
        setYear(d.getFullYear())
        setMonth(d.getMonth())
    }

    return (
        <div>
            <div className="flex items-center justify-between px-4 py-2 border-b bg-gray-50 rounded-t-md">
                <div className="text-sm font-medium">Attendance</div>
                <div className="flex items-center gap-2 text-xs">
                    <button className="px-2 py-1 rounded border hover:bg-gray-100" onClick={() => changeMonth(-1)}>◀</button>
                    <div className="px-2 py-1 rounded border bg-white">{monthName} {year}</div>
                    <button className="px-2 py-1 rounded border hover:bg-gray-100" onClick={() => changeMonth(1)}>▶</button>
                </div>
            </div>
            <div className="p-3">
                {/* Header row with table lines */}
                <div className="grid grid-cols-7 text-[11px] text-gray-600 border-t border-l">
                    {['SUN','MON','TUE','WED','THU','FRI','SAT'].map((d) => (
                        <div key={d} className="px-2 py-1 border-r border-b bg-gray-50">{d}</div>
                    ))}
                </div>
                {/* Days grid with table-like borders */}
                <div className="grid grid-cols-7 text-xs border-l border-t">
                    {days.map((d, idx) => (
                        <div key={idx} className={`min-h-[80px] px-2 border-r border-b ${d.inMonth ? 'text-gray-900' : 'text-gray-400'}`}>
                            <div className="flex items-center justify-between">
                                <span>{d.date.getDate()}</span>
                                {d.badge && <span className={`text-[10px] px-1 rounded ${d.badgeColor}`}>{d.badge}</span>}
                            </div>
                            {d.note && <div className="mt-1 text-[10px] text-gray-600">{d.note}</div>}
                        </div>
                    ))}
                </div>
            </div>
		</div>
	)
}

function getCalendarGridDays(year: number, month: number) {
    const first = new Date(year, month, 1)
    const start = new Date(first)
    start.setDate(first.getDate() - first.getDay())
    const days = [] as Array<{ date: Date; inMonth: boolean; badge?: string; badgeColor?: string; note?: string }>
    for (let i = 0; i < 42; i++) {
        const d = new Date(start)
        d.setDate(start.getDate() + i)
        const inMonth = d.getMonth() === month
        // demo rules for badges/notes
        let badge: string | undefined
        let badgeColor: string | undefined
        let note: string | undefined
        if (d.getDay() === 0) {
            badge = 'HOLIDAY'
            badgeColor = 'bg-rose-100 text-rose-700'
        } else if (d.getDay() === 6) {
            badge = 'OD'
            badgeColor = 'bg-emerald-100 text-emerald-700'
            note = 'NH: 3'
        } else if (d.getDate() % 5 === 0) {
            badge = 'DO'
            badgeColor = 'bg-amber-100 text-amber-700'
            note = 'NH: 2'
        }
        days.push({ date: d, inMonth, badge, badgeColor, note })
    }
    return days
}

