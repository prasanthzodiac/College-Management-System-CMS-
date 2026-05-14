import { useEffect, useState, useMemo } from 'react'
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

export default function AttendanceRealTime() {
	const [entries, setEntries] = useState<AttendanceEntry[]>([])
	const [loading, setLoading] = useState(true)
	const [studentId, setStudentId] = useState<string | null>(null)
	const [lastUpdate, setLastUpdate] = useState<Date | null>(null)

	useEffect(() => {
		// Get current user ID from backend
		const loadUser = async () => {
			try {
				// In demo mode, try to get email from localStorage first
				if (isDemoFirebase) {
					const storedEmail = localStorage.getItem('demoEmail')
					if (storedEmail) {
						setDemoEmail(storedEmail)
						// Try to sync/get user first
						try {
							const syncRes = await api.post('/api/auth/sync', { 
								email: storedEmail 
							})
							if (syncRes.data?.user?.id) {
								setStudentId(syncRes.data.user.id)
								loadAttendance(syncRes.data.user.id)
								return
							}
						} catch (syncErr) {
							console.error('Failed to sync user:', syncErr)
						}
					}
				}
				
				// Try to get user from /api/auth/me
				const { data } = await api.get('/api/auth/me')
				if (data?.user?.id) {
					setStudentId(data.user.id)
					loadAttendance(data.user.id)
				} else if (data?.user?.email) {
					// If we have email but no ID, try to sync first
					if (isDemoFirebase) {
						setDemoEmail(data.user.email)
					}
					try {
						const syncRes = await api.post('/api/auth/sync', { 
							email: data.user.email 
						})
						if (syncRes.data?.user?.id) {
							setStudentId(syncRes.data.user.id)
							loadAttendance(syncRes.data.user.id)
						}
					} catch (err) {
						console.error('Failed to sync user:', err)
					}
				}
			} catch (err: any) {
				console.error('Failed to load user:', err)
				// Fallback: try Firebase UID if demo mode
				const user = auth.currentUser
				if (user?.email && isDemoFirebase) {
					setDemoEmail(user.email)
					// Try to find user by email
					try {
						const syncRes = await api.post('/api/auth/sync', { 
							email: user.email 
						})
						if (syncRes.data?.user?.id) {
							setStudentId(syncRes.data.user.id)
							loadAttendance(syncRes.data.user.id)
						}
					} catch (syncErr) {
						console.error('Failed to sync user:', syncErr)
					}
				} else if (user?.uid) {
					setStudentId(user.uid)
					loadAttendance(user.uid)
				}
			}
		}
		loadUser()
	}, [])

	useEffect(() => {
		if (!studentId) return

		// Join student room for real-time updates
		socket.emit('attendance:join', { studentId })

		const handleUpdate = (data: {
			sessionId: string
			studentId: string
			present: boolean
			subjectId?: string
			date?: string
			period?: string
		}) => {
			if (data.studentId === studentId) {
				toast.success(`Attendance updated: ${data.present ? 'Present' : 'Absent'}`, {
					description: `Updated for ${data.date || 'today'}`
				})
				setLastUpdate(new Date())
				// Reload attendance data
				loadAttendance(studentId)
			}
		}

		socket.on('attendance:updated', handleUpdate)

		// Listen for custom refresh event
		const handleRefresh = () => {
			if (studentId) loadAttendance(studentId)
		}
		window.addEventListener('attendance:refresh', handleRefresh)

		return () => {
			socket.off('attendance:updated', handleUpdate)
			window.removeEventListener('attendance:refresh', handleRefresh)
		}
	}, [studentId])

	const loadAttendance = async (sid: string) => {
		setLoading(true)
		try {
			const { data } = await api.get(`/api/attendance/student/${sid}/entries`)
			setEntries(data?.entries || [])
		} catch (err: any) {
			console.error('Failed to load attendance:', err)
			// Fallback to empty array on error
			setEntries([])
		} finally {
			setLoading(false)
		}
	}

	// Group entries by subject
	const groupedBySubject = useMemo(() => {
		const grouped: Record<string, AttendanceEntry[]> = {}
		entries.forEach(entry => {
			const key = entry.subject?.code || 'unknown'
			if (!grouped[key]) grouped[key] = []
			grouped[key].push(entry)
		})
		return grouped
	}, [entries])

	// Calculate statistics
	const stats = useMemo(() => {
		const total = entries.length
		const present = entries.filter(e => e.present).length
		const absent = total - present
		const percentage = total > 0 ? (present / total * 100).toFixed(2) : '0.00'
		return { total, present, absent, percentage }
	}, [entries])

	const formatDate = (dateStr: string) => {
		return new Date(dateStr).toLocaleDateString('en-GB', {
			day: '2-digit',
			month: 'short',
			year: 'numeric'
		})
	}

	return (
		<div className="p-4">
			{/* Status indicator */}
			{lastUpdate && (
				<div className="mb-4 text-xs text-green-600">
					Last updated: {lastUpdate.toLocaleTimeString()}
				</div>
			)}

			<div className="rounded-md border overflow-hidden bg-white">
				<div className="px-4 py-2 bg-blue-700 text-white text-sm font-medium">
					Attendance Summary {socket.connected && <span className="text-xs ml-2">● Live</span>}
				</div>

				{loading ? (
					<div className="p-8 text-center text-gray-500">Loading attendance...</div>
				) : entries.length === 0 ? (
					<div className="p-8 text-center text-gray-500">
						No attendance records found. Attendance will appear here when marked by staff.
					</div>
				) : (
					<div className="p-4 space-y-6">
						{/* Summary Statistics */}
						<div className="grid grid-cols-4 gap-4">
							<div className="border rounded p-3">
								<div className="text-xs text-gray-500">Total Sessions</div>
								<div className="text-2xl font-bold">{stats.total}</div>
							</div>
							<div className="border rounded p-3 bg-green-50">
								<div className="text-xs text-gray-500">Present</div>
								<div className="text-2xl font-bold text-green-700">{stats.present}</div>
							</div>
							<div className="border rounded p-3 bg-red-50">
								<div className="text-xs text-gray-500">Absent</div>
								<div className="text-2xl font-bold text-red-700">{stats.absent}</div>
							</div>
							<div className="border rounded p-3 bg-blue-50">
								<div className="text-xs text-gray-500">Attendance %</div>
								<div className="text-2xl font-bold text-blue-700">{stats.percentage}%</div>
							</div>
						</div>

						{/* Subject-wise breakdown */}
						{Object.entries(groupedBySubject).map(([code, subjectEntries]) => {
							const subject = subjectEntries[0]?.subject
							const subjPresent = subjectEntries.filter(e => e.present).length
							const subjTotal = subjectEntries.length
							const subjPercent = subjTotal > 0 ? (subjPresent / subjTotal * 100).toFixed(2) : '0.00'

							return (
								<div key={code} className="border rounded p-4">
									<div className="flex items-center justify-between mb-3">
										<div>
											<div className="font-semibold">{subject?.name || code}</div>
											<div className="text-xs text-gray-500">{subject?.code} - {subject?.section}</div>
										</div>
										<div className="text-right">
											<div className="text-sm font-medium">{subjPresent}/{subjTotal}</div>
											<div className="text-xs text-gray-500">{subjPercent}%</div>
										</div>
									</div>
									<div className="space-y-1">
										{subjectEntries.slice(0, 10).map(entry => (
											<div key={entry.id} className="flex items-center justify-between text-xs py-1 border-b">
												<div>
													<span className="font-medium">{formatDate(entry.date)}</span>
													<span className="ml-2 text-gray-500">Period {entry.period}</span>
												</div>
												<span className={`px-2 py-0.5 rounded ${entry.present ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
													{entry.present ? 'Present' : 'Absent'}
												</span>
											</div>
										))}
										{subjectEntries.length > 10 && (
											<div className="text-xs text-gray-500 text-center pt-2">
												... and {subjectEntries.length - 10} more
											</div>
										)}
									</div>
								</div>
							)
						})}
					</div>
				)}
			</div>
		</div>
	)
}

