import { useEffect, useMemo, useState } from 'react'
import { Link, Outlet, useNavigate } from 'react-router-dom'
import { auth, isDemoFirebase } from '../services/firebase'
import api, { setDemoEmail } from '../lib/api'
import { signOut } from 'firebase/auth'

function Clock() {
	const [now, setNow] = useState(new Date())
	useEffect(() => {
		const id = setInterval(() => setNow(new Date()), 1000)
		return () => clearInterval(id)
	}, [])
	const time = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
	const date = now.toLocaleDateString([], { day: '2-digit', month: '2-digit', year: 'numeric' })
	return (
		<div className="text-right leading-tight">
			<div className="text-xs">{time}</div>
			<div className="text-xs opacity-90">{date}</div>
		</div>
	)
}

export function StudentDashboard() {
    const navigate = useNavigate()
    const [showProfile, setShowProfile] = useState(false)
    const [showMenu, setShowMenu] = useState(false)
    const [displayName, setDisplayName] = useState<string>('')
    const [userEmail, setUserEmail] = useState<string>('')
    const [userPhotoUrl, setUserPhotoUrl] = useState<string>('')

    const onSignOut = async () => {
        try {
            await signOut(auth)
        } catch (_) {
            // ignore in demo
        }
        navigate('/')
    }

    useEffect(() => {
        const load = async () => {
            try {
                // help demo mode propagate email header
                const email = localStorage.getItem('demoEmail')
                if (isDemoFirebase && email) setDemoEmail(email)
                const { data } = await api.get('/api/auth/me')
                const user = data?.user
                let name = user?.name as string | null
                if (!name) {
                    const mail = (user?.email || email || '').split('@')[0]
                    const m = mail.match(/student(\d+)/i)
                    name = m ? `Student ${m[1]}` : mail
                }
                setDisplayName(name || 'Student')
                setUserEmail(user?.email || email || '')
                setUserPhotoUrl(user?.photoUrl || '')
            } catch (_) {
                setDisplayName('Student')
            }
        }
        load()
    }, [])

    // Refresh user details when opening modal (ensures values are present)
    useEffect(() => {
        if (!showProfile) return
        const load = async () => {
            try {
                const emailLS = localStorage.getItem('demoEmail')
                if (isDemoFirebase && emailLS) setDemoEmail(emailLS)
                const { data } = await api.get('/api/auth/me')
                const user = data?.user
                let name = user?.name as string | null
                const mail = (user?.email || emailLS || '').split('@')[0]
                if (!name || /^\d+$/.test(name)) {
                    const m = mail.match(/student(\d+)/i)
                    name = m ? `Student ${m[1]}` : mail
                }
                setDisplayName(name || 'Student')
                setUserEmail(user?.email || emailLS || '')
                setUserPhotoUrl(user?.photoUrl || '')
            } catch (_) {}
        }
        load()
    }, [showProfile])

    // Close dropdown on outside click
    useEffect(() => {
        const onDocClick = () => setShowMenu(false)
        if (showMenu) document.addEventListener('click', onDocClick)
        return () => document.removeEventListener('click', onDocClick)
    }, [showMenu])

    const derived = useMemo(() => {
        const email = userEmail || ''
        let roll = ''
        let batch = ''
        if (email) {
            const prefix = email.split('@')[0]
            const match = prefix.match(/student(\d+)/i)
            if (match) {
                const num = match[1].padStart(3, '0')
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
        return { roll, batch }
    }, [userEmail])

    return (
		<div className="min-h-screen bg-gray-50">
			{/* Top navigation */}
			<div className="w-full bg-blue-700 text-white">
				<div className="px-4">
					<div className="h-12 flex items-center justify-between text-sm">
						<div className="flex items-center gap-6">
							<span className="font-semibold">CollegeConnect</span>
							<nav className="hidden md:flex items-center gap-4 opacity-95">
								<div className="relative group inline-block">
									<button className="hover:underline flex items-center gap-1">Master <span>▾</span></button>
								<div className="absolute left-0 top-full hidden group-hover:block group-focus-within:block pt-1 z-50">
										<div className="w-56 rounded-md bg-white text-black shadow p-2 space-y-2">
											<Link className="block hover:bg-gray-100 rounded px-2 py-1" to="/dashboard/student/grievances">Student Grievance Request</Link>
										</div>
									</div>
								</div>

								<div className="relative group inline-block">
									<button className="hover:underline flex items-center gap-1">Admission <span>▾</span></button>
								<div className="absolute left-0 top-full hidden group-hover:block group-focus-within:block pt-1 z-50">
										<div className="w-56 rounded-md bg-white text-black shadow p-2 space-y-2">
											<Link className="block hover:bg-gray-100 rounded px-2 py-1" to="/dashboard/student/certificates">Certificate Requests</Link>
										</div>
									</div>
								</div>

								<div className="relative group inline-block">
									<button className="hover:underline flex items-center gap-1">Academic <span>▾</span></button>
								<div className="absolute left-0 top-full hidden group-hover:block group-focus-within:block pt-1 z-50">
									<div className="w-64 rounded-md bg-white text-black shadow p-2 space-y-2">
                            <Link className="block hover:bg-gray-100 rounded px-2 py-1" to="/dashboard/student/academic/upload-assignment">Upload Assignment</Link>
                            <Link className="block hover:bg-gray-100 rounded px-2 py-1" to="/dashboard/student/academic/program-outcome">Program Outcome</Link>
								<Link className="block hover:bg-gray-100 rounded px-2 py-1" to="/dashboard/student/academic/attendance">Attendance</Link>
								<Link className="block hover:bg-gray-100 rounded px-2 py-1" to="/dashboard/student/academic/circular">Circular</Link>
								<Link className="block hover:bg-gray-100 rounded px-2 py-1" to="/dashboard/student/academic/internal-marks">Internal Mark Report</Link>
								<Link className="block hover:bg-gray-100 rounded px-2 py-1" to="/dashboard/student/academic/events">Events</Link>
								<Link className="block hover:bg-gray-100 rounded px-2 py-1" to="/dashboard/student/academic/leave-apply">Leave Apply</Link>
										</div>
									</div>
								</div>

							<div>
                            <Link className="hover:underline" to="/dashboard/student/feedback">Feedback</Link>
                        </div>
							</nav>
						</div>
                        <div className="flex items-center gap-4">
							<Clock />
                            {/* Profile text opens details modal */}
                            <button onClick={() => setShowProfile(true)} className="text-xs hover:underline">Profile</button>
                            {/* Avatar+name opens sign-out dropdown */}
                            <div className="relative">
                                <button onClick={() => setShowProfile((v) => v === true ? true : false)} className="hidden" aria-hidden="true" />
                                <button onClick={() => setShowProfile(false)} className="hidden" aria-hidden="true" />
                                <button onClick={(e) => {
                                        e.stopPropagation()
                                        setShowProfile(false)
                                        setShowMenu((v: boolean) => !v as any)
                                    }} className="text-xs hover:underline flex items-center gap-2">
                                    <div className="h-6 w-6 rounded-full bg-white/80" />
                                    <span className="text-xs">{displayName}</span>
                                </button>
                                {showProfile && (
                                    <div className="fixed inset-0 z-50 flex items-center justify-center">
                                        <div className="absolute inset-0 bg-black/30" onClick={() => setShowProfile(false)} />
                                        <div className="relative z-10 w-[800px] max-w-[95vw] bg-white text-black rounded-md shadow-lg">
                                            <div className="px-4 py-3 border-b flex items-center justify-between">
                                                <div className="font-medium">Student Profile</div>
                                                <button className="text-sm text-blue-700" onClick={() => setShowProfile(false)}>Close</button>
                                            </div>
                                            <div className="p-5">
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                                    {/* Photo */}
                                                    <div className="md:col-span-1 flex items-start justify-center">
                                                        {userPhotoUrl ? (
                                                            <img src={userPhotoUrl} alt="Profile" className="w-40 h-48 object-cover rounded-md border" />
                                                        ) : (
                                                            <div className="w-40 h-48 rounded-md bg-gray-200 flex items-center justify-center text-3xl font-semibold text-gray-700">
                                                                {(displayName || 'S').split(' ').map(p=>p[0]).join('').slice(0,2)}
                                                            </div>
                                                        )}
                                                    </div>
                                                    {/* Details */}
                                                    <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        <div>
                                                            <div className="text-xs text-gray-600">Student</div>
                                                            <div className="font-medium">{displayName}</div>
                                                        </div>
                                                        <div>
                                                            <div className="text-xs text-gray-600">Email</div>
                                                            <div className="font-medium break-all">{userEmail}</div>
                                                        </div>
                                                        <div>
                                                            <div className="text-xs text-gray-600">Roll No</div>
                                                            <div className="font-medium">{derived.roll || '—'}</div>
                                                        </div>
                                                        <div>
                                                            <div className="text-xs text-gray-600">Batch</div>
                                                            <div className="font-medium">{derived.batch || '—'}</div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="px-4 py-3 border-t flex items-center justify-end gap-2">
                                                <button onClick={onSignOut} className="px-3 py-1.5 bg-blue-700 text-white rounded">Sign out</button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                {showMenu && (
                                    <div className="absolute right-0 mt-1 w-40 rounded-md bg-white text-black shadow z-50">
                                        <button onClick={onSignOut} className="block w-full text-left px-3 py-2 hover:bg-gray-100">Sign out</button>
                                    </div>
                                )}
                            </div>
						</div>
					</div>
				</div>
			</div>

			{/* Content area full width/height */}
			<div className="px-4 py-6">
				<div className="rounded-md bg-white" style={{minHeight: 'calc(100vh - 72px)'}}>
					<Outlet />
				</div>
			</div>
		</div>
	)
}

