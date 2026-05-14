import React from 'react'
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { signOut } from 'firebase/auth'
import { auth, isDemoFirebase } from '../services/firebase'
import api, { setDemoEmail } from '../lib/api'
import socket from '../services/socket'

export function AdminDashboard() {
    const [showCircular, setShowCircular] = React.useState(false)
    const [openUsers, setOpenUsers] = React.useState(false)
    const [openAcademic, setOpenAcademic] = React.useState(false)
    const [openRequests, setOpenRequests] = React.useState(false)
    const [reminderTab, setReminderTab] = React.useState<'students' | 'staffs'>('students')
    const location = useLocation()
    const isOverview = location.pathname === '/dashboard/admin' || location.pathname === '/dashboard/admin/'
    const isUserManagement = location.pathname.includes('/dashboard/admin/users')
    const isSubjectManagement = location.pathname.includes('/dashboard/admin/subjects')
    const isAttendanceOverview = location.pathname.includes('/dashboard/admin/attendance')
    const isAssignmentOverview = location.pathname.includes('/dashboard/admin/assignments')
    const isFeedback = location.pathname.includes('/dashboard/admin/feedback')
    const isGrievance = location.pathname.includes('/dashboard/admin/grievances')
    const isLeaves = location.pathname.includes('/dashboard/admin/leaves')
    const isCertificates = location.pathname.includes('/dashboard/admin/certificates')
    const [showProfile, setShowProfile] = React.useState(false)
    const [showSearch, setShowSearch] = React.useState(false)
    const [searchQuery, setSearchQuery] = React.useState('')
    const [showNotifications, setShowNotifications] = React.useState(false)
    const [notifications, setNotifications] = React.useState<any[]>([])
    const [displayName, setDisplayName] = React.useState<string>(() => {
        const email = (typeof window !== 'undefined' ? localStorage.getItem('demoEmail') : null) || ''
        return email ? (email.split('@')[0] || 'Admin') : 'Admin'
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
                setDisplayName(user?.name || (user?.email || '').split('@')[0] || 'Admin')
            } catch (_) {
                setDisplayName('Admin')
            }
        }
        load()
    }, [])

    React.useEffect(() => {
        if (showNotifications) {
            loadNotifications()
        }
    }, [showNotifications])

    const loadNotifications = async () => {
        try {
            const email = localStorage.getItem('demoEmail')
            if (isDemoFirebase && email) setDemoEmail(email)
            const [leavesRes, grievancesRes, certificatesRes] = await Promise.all([
                api.get('/api/leaves/all').catch(() => ({ data: { items: [] } })),
                api.get('/api/grievances/all').catch(() => ({ data: { items: [] } })),
                api.get('/api/certificates').catch(() => ({ data: { requests: [] } }))
            ])
            const pendingLeaves = (leavesRes.data?.items || []).filter((l: any) => l.status === 'pending')
            const openGrievances = (grievancesRes.data?.items || []).filter((g: any) => g.status === 'open')
            const pendingCertificates = (certificatesRes.data?.requests || []).filter((c: any) => c.status === 'pending')
            const all = [
                ...pendingLeaves.map((l: any) => ({ type: 'leave', id: l.id, title: `Leave Request from ${l.student?.name || 'Student'}`, time: l.createdAt, link: '/dashboard/admin/leaves' })),
                ...openGrievances.map((g: any) => ({ type: 'grievance', id: g.id, title: `Grievance from ${g.student?.name || 'Student'}`, time: g.createdAt, link: '/dashboard/admin/grievances' })),
                ...pendingCertificates.map((c: any) => ({ type: 'certificate', id: c.id, title: `Certificate Request from ${c.student?.name || 'Student'}`, time: c.createdAt, link: '/dashboard/admin/certificates' }))
            ]
            all.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
            setNotifications(all)
        } catch (err) {
            console.error('Error loading notifications:', err)
        }
    }

    const handleSearch = () => {
        if (!searchQuery.trim()) return
        const rollMatch = searchQuery.match(/^(\d{2}[A-Z]{3}\d{3})$/)
        if (rollMatch) {
            navigate(`/dashboard/admin/attendance?rollNo=${searchQuery}`)
            setShowSearch(false)
            setSearchQuery('')
        } else {
            navigate(`/dashboard/admin/users?search=${searchQuery}`)
            setShowSearch(false)
            setSearchQuery('')
        }
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="min-h-screen flex">
                {/* Sidebar */}
                <aside className="w-64 bg-blue-700 text-white border-r border-blue-600">
                    <div className="px-4 py-3 border-b border-white/10">
                        <div className="text-lg font-bold tracking-wide">CollegeConnect</div>
                    </div>
                    <div className="px-4 py-5 border-b border-white/10 text-center">
                        <div className="mx-auto h-16 w-16 rounded-full bg-white/90" />
                        <div className="mt-3 text-sm font-semibold">{displayName || 'Admin'}</div>
                        <div className="text-xs opacity-90">ADMINISTRATOR</div>
                    </div>
                    <nav className="p-2 text-sm space-y-1">
                        <NavItem label="Dashboard" icon="home" to="/dashboard/admin" />
                        <button
                            className="w-full text-left px-3 py-2 rounded-md hover:bg-blue-600 focus:bg-blue-600 flex items-center justify-between"
                            onClick={() => setOpenUsers((v) => !v)}
                        >
                            <span className="flex items-center gap-2"><SVGIcon name="users" className="w-4 h-4 opacity-90" />Users</span>
                            <span className={`transition-transform ${openUsers ? 'rotate-0' : '-rotate-90'}`}>▾</span>
                        </button>
                        {openUsers && (
                            <div className="ml-2 pl-2 border-l border-white/15 space-y-1">
                                <SubItem label="Students" icon="users" to="/dashboard/admin/users/students" />
                                <SubItem label="Staff" icon="users" to="/dashboard/admin/users/staff" />
                            </div>
                        )}
                        <button
                            className="w-full text-left px-3 py-2 rounded-md hover:bg-blue-600 focus:bg-blue-600 flex items-center justify-between"
                            onClick={() => setOpenAcademic((v) => !v)}
                        >
                            <span className="flex items-center gap-2"><SVGIcon name="book" className="w-4 h-4 opacity-90" />Academic</span>
                            <span className={`transition-transform ${openAcademic ? 'rotate-0' : '-rotate-90'}`}>▾</span>
                        </button>
                        {openAcademic && (
                            <div className="ml-2 pl-2 border-l border-white/15 space-y-1">
                                <SubItem label="Subjects" icon="book" to="/dashboard/admin/subjects" />
                                <SubItem label="Attendance Overview" icon="checklist" to="/dashboard/admin/attendance" />
                                <SubItem label="Assignments Overview" icon="document" to="/dashboard/admin/assignments" />
                                <SubItem label="Events" icon="calendar" to="/dashboard/admin/events" />
                                <SubItem label="Circulars" icon="calendar" to="/dashboard/admin/circulars" />
                                <SubItem label="Internal Marks" icon="document" to="/dashboard/admin/internal-marks" />
                            </div>
                        )}
                        <button
                            className="w-full text-left px-3 py-2 rounded-md hover:bg-blue-600 focus:bg-blue-600 flex items-center justify-between"
                            onClick={() => setOpenRequests((v) => !v)}
                        >
                            <span className="flex items-center gap-2"><SVGIcon name="clipboard" className="w-4 h-4 opacity-90" />Requests</span>
                            <span className={`transition-transform ${openRequests ? 'rotate-0' : '-rotate-90'}`}>▾</span>
                        </button>
                        {openRequests && (
                            <div className="ml-2 pl-2 border-l border-white/15 space-y-1">
                                <SubItem label="Feedback" icon="chat" to="/dashboard/admin/feedback" />
                                <SubItem label="Grievances" icon="chat" to="/dashboard/admin/grievances" />
                                <SubItem label="Leave Requests" icon="calendar" to="/dashboard/admin/leaves" />
                                <SubItem label="Certificates" icon="clipboard" to="/dashboard/admin/certificates" />
                            </div>
                        )}
                    </nav>
                </aside>

                {/* Main content */}
                <main className="flex-1 p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h2 className="text-xl font-semibold">Admin Dashboard</h2>
                            <p className="text-sm text-gray-600">Manage users, academics, and requests.</p>
                        </div>
                        <div className="flex items-center gap-3 relative">
                            <div className="hidden sm:block text-sm text-gray-700"><Clock /></div>
                            {socket.connected && <span className="text-xs text-green-600">● Live</span>}
                            {showSearch ? (
                                <div className="flex items-center gap-2 bg-white border rounded px-2 py-1">
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                        placeholder="Search"
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
                                            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
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
                                <IconButton label="Notifications" onClick={() => setShowNotifications(!showNotifications)}>
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5 text-blue-700">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.966 8.966 0 0118 9.75V9a6 6 0 10-12 0v.75a8.966 8.966 0 01-2.311 6.022c1.76.68 3.575 1.12 5.454 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
                                    </svg>
                                    {notifications.length > 0 && (
                                        <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] rounded-full h-5 w-5 flex items-center justify-center">
                                            {notifications.length}
                                        </span>
                                    )}
                                </IconButton>
                                {showNotifications && (
                                    <div className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg border z-50 max-h-96 overflow-y-auto">
                                        <div className="px-4 py-2 border-b font-semibold text-sm">Notifications</div>
                                        {notifications.length === 0 ? (
                                            <div className="px-4 py-8 text-center text-sm text-gray-500">No notifications</div>
                                        ) : (
                                            <div className="divide-y">
                                                {notifications.map((n) => (
                                                    <button
                                                        key={n.id}
                                                        onClick={() => {
                                                            navigate(n.link)
                                                            setShowNotifications(false)
                                                        }}
                                                        className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors"
                                                    >
                                                        <div className="text-sm font-medium text-gray-900">{n.title}</div>
                                                        <div className="text-xs text-gray-500 mt-1">
                                                            {new Date(n.time).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                            <button onClick={() => setShowProfile(v=>!v)} className="h-7 w-7 rounded-full bg-gray-300" />
                            {showProfile && (
                                <div className="absolute right-0 top-8 w-40 rounded-md bg-white text-black shadow z-50">
                                    <button onClick={onSignOut} className="block w-full text-left px-3 py-2 hover:bg-gray-100 text-sm">Sign out</button>
                                </div>
                            )}
                        </div>
                    </div>

                    <Outlet />

                    {isOverview && (
                        <>
                            <OverviewStats />
                            <section className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-6">
                                <QuickActions />
                                <RecentActivity />
                            </section>
                        </>
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

function SubItem({ label, icon, to }: { label: string; icon?: IconName; to?: string }) {
    return (
        to ? (
            <Link
                to={to}
                className="block w-full text-left px-3 py-2 rounded-md hover:bg-blue-600 flex items-center gap-2"
            >
                {icon ? <SVGIcon name={icon} className="w-4 h-4 opacity-90" /> : <span className="opacity-90">▣</span>}
                <span className="truncate">{label}</span>
            </Link>
        ) : (
            <button
                className="w-full text-left px-3 py-2 rounded-md hover:bg-blue-600 flex items-center gap-2"
            >
                {icon ? <SVGIcon name={icon} className="w-4 h-4 opacity-90" /> : <span className="opacity-90">▣</span>}
                <span className="truncate">{label}</span>
            </button>
        )
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

type IconName =
    | 'home' | 'book' | 'clipboard' | 'chat' | 'users'
    | 'document' | 'calendar' | 'checklist'

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
        case 'chat':
            return (<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}><path d="M2.25 12A8.25 8.25 0 0110.5 3.75h3A8.25 8.25 0 0121.75 12v.75A6.75 6.75 0 0115 19.5H9l-4.5 2.25.75-3A6.75 6.75 0 012.25 12.75V12z"/></svg>)
        case 'users':
            return (<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}><path d="M15.75 6.75a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z"/><path d="M4.5 18a7.5 7.5 0 0115 0v.75a.75.75 0 01-.75.75h-13.5a.75.75 0 01-.75-.75V18z"/></svg>)
        case 'document':
            return (<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}><path d="M6 3.75A2.25 2.25 0 018.25 1.5h4.5L18 6.75v13.5A2.25 2.25 0 0115.75 22.5H8.25A2.25 2.25 0 016 20.25V3.75z"/></svg>)
        case 'calendar':
            return (<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}><path d="M6.75 3a.75.75 0 01.75.75V5h9V3.75a.75.75 0 011.5 0V5h.75A2.25 2.25 0 0121 7.25v10.5A2.25 2.25 0 0118.75 20H5.25A2.25 2.25 0 013 17.75V7.25A2.25 2.25 0 015.25 5H6V3.75A.75.75 0 016.75 3z"/></svg>)
        case 'checklist':
            return (<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}><path d="M4.5 6.75h9v1.5h-9v-1.5zM4.5 11.25h9v1.5h-9v-1.5zM4.5 15.75h9v1.5h-9v-1.5zM16.5 7.5l1.5 1.5L21 6"/></svg>)
        default:
            return null
    }
}

function OverviewStats() {
    const [stats, setStats] = React.useState({
        totalStudents: 0,
        totalStaff: 0,
        totalSubjects: 0,
        pendingLeaves: 0,
        openGrievances: 0,
        pendingCertificates: 0
    })
    const [loading, setLoading] = React.useState(true)

    React.useEffect(() => {
        const load = async () => {
            try {
                const email = localStorage.getItem('demoEmail')
                if (isDemoFirebase && email) setDemoEmail(email)
                const [usersRes, subjectsRes, leavesRes, grievancesRes, certificatesRes] = await Promise.all([
                    api.get('/api/auth/all').catch(() => ({ data: { users: [] } })),
                    api.get('/api/subjects').catch(() => ({ data: { subjects: [] } })),
                    api.get('/api/leaves/all').catch(() => ({ data: { items: [] } })),
                    api.get('/api/grievances/all').catch(() => ({ data: { items: [] } })),
                    api.get('/api/certificates').catch(() => ({ data: { requests: [] } }))
                ])
                const users = usersRes.data?.users || []
                const students = users.filter((u: any) => u.role === 'student')
                const staff = users.filter((u: any) => u.role === 'staff' || u.role === 'admin')
                const subjects = subjectsRes.data?.subjects || []
                const leaves = leavesRes.data?.items || []
                const grievances = grievancesRes.data?.items || []
                const certificates = certificatesRes.data?.requests || []
                setStats({
                    totalStudents: students.length,
                    totalStaff: staff.length,
                    totalSubjects: subjects.length,
                    pendingLeaves: leaves.filter((l: any) => l.status === 'pending').length,
                    openGrievances: grievances.filter((g: any) => g.status === 'open').length,
                    pendingCertificates: certificates.filter((c: any) => c.status === 'pending').length
                })
            } catch (err) {
                console.error('Error loading stats:', err)
            } finally {
                setLoading(false)
            }
        }
        load()
    }, [])

    if (loading) {
        return <div className="text-center py-8 text-gray-500">Loading statistics...</div>
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <StatCard title="Students" value={stats.totalStudents} icon="users" color="blue" />
            <StatCard title="Staff" value={stats.totalStaff} icon="users" color="green" />
            <StatCard title="Subjects" value={stats.totalSubjects} icon="book" color="purple" />
            <StatCard title="Pending Leaves" value={stats.pendingLeaves} icon="calendar" color="yellow" />
            <StatCard title="Open Grievances" value={stats.openGrievances} icon="chat" color="orange" />
            <StatCard title="Pending Certificates" value={stats.pendingCertificates} icon="clipboard" color="red" />
        </div>
    )
}

function StatCard({ title, value, icon, color }: { title: string; value: number; icon: string; color: string }) {
    const colorClasses = {
        blue: 'bg-blue-100 text-blue-700',
        green: 'bg-green-100 text-green-700',
        purple: 'bg-purple-100 text-purple-700',
        yellow: 'bg-yellow-100 text-yellow-700',
        orange: 'bg-orange-100 text-orange-700',
        red: 'bg-red-100 text-red-700'
    }
    return (
        <div className="border rounded-md bg-white p-4">
            <div className="flex items-center justify-between">
                <div>
                    <div className="text-xs text-gray-600 mb-1">{title}</div>
                    <div className="text-2xl font-bold">{value}</div>
                </div>
                <div className={`p-3 rounded-full ${colorClasses[color as keyof typeof colorClasses]}`}>
                    <SVGIcon name={icon as IconName} className="w-6 h-6" />
                </div>
            </div>
        </div>
    )
}

function QuickActions() {
    const navigate = useNavigate()
    return (
        <div className="border rounded-md bg-white">
            <div className="px-4 py-2 border-b bg-gray-50 rounded-t-md text-sm font-medium">Quick Actions</div>
            <div className="p-4 grid grid-cols-2 gap-3">
                <button onClick={() => navigate('/dashboard/admin/users/students')} className="p-3 border rounded hover:bg-gray-50 text-left">
                    <div className="font-medium text-sm">Manage Students</div>
                    <div className="text-xs text-gray-500 mt-1">View and edit students</div>
                </button>
                <button onClick={() => navigate('/dashboard/admin/users/staff')} className="p-3 border rounded hover:bg-gray-50 text-left">
                    <div className="font-medium text-sm">Manage Staff</div>
                    <div className="text-xs text-gray-500 mt-1">View and edit staff</div>
                </button>
                <button onClick={() => navigate('/dashboard/admin/subjects')} className="p-3 border rounded hover:bg-gray-50 text-left">
                    <div className="font-medium text-sm">Manage Subjects</div>
                    <div className="text-xs text-gray-500 mt-1">View and edit subjects</div>
                </button>
                <button onClick={() => navigate('/dashboard/admin/leaves')} className="p-3 border rounded hover:bg-gray-50 text-left">
                    <div className="font-medium text-sm">Review Leaves</div>
                    <div className="text-xs text-gray-500 mt-1">Approve/reject requests</div>
                </button>
            </div>
        </div>
    )
}

function RecentActivity() {
    return (
        <div className="border rounded-md bg-white">
            <div className="px-4 py-2 border-b bg-gray-50 rounded-t-md text-sm font-medium">Recent Activity</div>
            <div className="p-4 text-sm text-gray-500">
                Activity log will be displayed here
            </div>
        </div>
    )
}
