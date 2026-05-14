import React from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import api, { setDemoEmail } from '../../lib/api'
import { isDemoFirebase } from '../../services/firebase'

type StudentAttendance = { id: string; name: string; roll: string; present: boolean }

type AttendanceSession = {
	id: string
	subjectId: string
	date: string
	formattedDate: string
	dayName: string
	period: string
	completed: boolean
	totalStudents: number
	createdAt?: string
}

export default function StaffSubjectAttendance() {
	const navigate = useNavigate()
	const [searchParams] = useSearchParams()
	const subjectId = searchParams.get('subjectId') || 'SUBJ-DEMO-1'
	const subjectName = searchParams.get('subjectName') || 'Reverse Engineering Project'
	const section = searchParams.get('section') || 'III CSE A'

	const [sessions, setSessions] = React.useState<AttendanceSession[]>([])
	const [loading, setLoading] = React.useState(false)
	const [openRow, setOpenRow] = React.useState<number | null>(null)
	const [students, setStudents] = React.useState<StudentAttendance[]>([])
	const [loadingStudents, setLoadingStudents] = React.useState(false)
	const [realSubjectId, setRealSubjectId] = React.useState<string | null>(null)


	// Check if a date is today
	const isToday = (dateStr: string) => {
		const today = new Date()
		const checkDate = new Date(dateStr + 'T00:00:00')
		return today.toDateString() === checkDate.toDateString()
	}

	React.useEffect(() => {
		// Look up subject by code to get real UUID
		const lookupSubject = async () => {
			if (!subjectId || subjectId === 'SUBJ-DEMO-1') return
			
			const email = localStorage.getItem('demoEmail')
			if (isDemoFirebase && email) setDemoEmail(email)
			
			// Extract subject code from "SUBJ-23CSP501" format
			const code = subjectId.replace('SUBJ-', '')
			try {
				const { data } = await api.get(`/api/subjects/code/${code}`)
				if (data?.subject?.id) {
					setRealSubjectId(data.subject.id)
				} else {
					// If not found by code, try using subjectId as UUID
					setRealSubjectId(subjectId)
				}
			} catch (err: any) {
				console.error('Failed to lookup subject:', err)
				// If lookup fails, try using the subjectId as-is (might be a UUID)
				setRealSubjectId(subjectId)
			}
		}
		lookupSubject()
	}, [subjectId])

	React.useEffect(() => {
		if (!realSubjectId) return
		// Load all attendance sessions for this subject
		loadAllSessions()
		// Load students enrolled in this subject
		loadStudents()
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [realSubjectId])

	const loadStudents = async () => {
		if (!realSubjectId) return
		setLoadingStudents(true)
		try {
			const email = localStorage.getItem('demoEmail')
			if (isDemoFirebase && email) setDemoEmail(email)
			
			const { data } = await api.get(`/api/attendance/subject/${realSubjectId}/students`)
			const studentList = (data?.students || [])
				.map((s: any) => ({
					id: s.id,
					name: s.name || s.email.split('@')[0],
					roll: s.rollNo || s.email.split('@')[0],
					present: true // Default to present
				}))
				.sort((a: any, b: any) => {
					// Sort by roll number (extract numeric part for proper sorting)
					const aNum = parseInt(a.roll.replace(/[^0-9]/g, ''), 10) || 0
					const bNum = parseInt(b.roll.replace(/[^0-9]/g, ''), 10) || 0
					return aNum - bNum
				})
			if (studentList.length === 0) {
				toast.warning('No students enrolled in this subject')
			}
			setStudents(studentList)
		} catch (err: any) {
			console.error('Failed to load students:', err)
			toast.error(err?.response?.data?.error || 'Failed to load students')
			setStudents([])
		} finally {
			setLoadingStudents(false)
		}
	}

	const loadSessionAttendance = async (sessionId: string) => {
		if (!sessionId || sessionId.startsWith('session-')) return // Skip demo sessions
		
		try {
			const email = localStorage.getItem('demoEmail')
			if (isDemoFirebase && email) setDemoEmail(email)
			
			const { data } = await api.get(`/api/attendance/session/${sessionId}/entries`)
			const existingEntries = data?.entries || []
			
			// Create a map of studentId -> present status
			const attendanceMap = new Map<string, boolean>()
			existingEntries.forEach((entry: any) => {
				attendanceMap.set(entry.studentId, entry.present)
			})
			
			// Update students list with existing attendance, maintaining roll number order
			setStudents((prev) => {
				return prev
					.map((student) => {
						const existingStatus = attendanceMap.get(student.id)
						return {
							...student,
							present: existingStatus !== undefined ? existingStatus : true // Default to present if no entry exists
						}
					})
					.sort((a, b) => {
						// Maintain roll number order
						const aNum = parseInt(a.roll.replace(/[^0-9]/g, ''), 10) || 0
						const bNum = parseInt(b.roll.replace(/[^0-9]/g, ''), 10) || 0
						return aNum - bNum
					})
			})
		} catch (err: any) {
			console.error('Failed to load session attendance:', err)
			// If session doesn't exist yet, that's fine - use default present status
		}
	}

	const loadAllSessions = async () => {
		if (!realSubjectId) {
			toast.error('Subject ID is required')
			return
		}

		setLoading(true)
		try {
			const email = localStorage.getItem('demoEmail')
			if (isDemoFirebase && email) setDemoEmail(email)
			
			// Load all sessions for this subject (no date filter)
			const params = new URLSearchParams({ 
				subjectId: realSubjectId
			})

			const { data } = await api.get(`/api/attendance/sessions?${params.toString()}`)
			setSessions(data?.sessions || [])
			if (data?.sessions?.length === 0) {
				toast.info('No attendance sessions found for this subject')
			}
		} catch (err: any) {
			console.error('Error loading sessions:', err)
			toast.error(err?.response?.data?.error || 'Failed to load attendance sessions')
			setSessions([])
		} finally {
			setLoading(false)
		}
	}

	const onToggle = (i: number) => {
		setStudents((prev) => {
			const next = [...prev]
			next[i] = { ...next[i], present: !next[i].present }
			return next
		})
	}

	const onPost = async () => {
		if (openRow === null) return
		if (students.length === 0) {
			toast.error('No students to mark attendance for')
			return
		}
		if (!realSubjectId) {
			toast.error('Subject ID not found. Please refresh the page.')
			return
		}
		
		const session = sessions[openRow]
		
		// Format date as YYYY-MM-DD
		let dateStr = session.date.includes('T') 
			? session.date.split('T')[0] 
			: session.date
		
		// If date is in formatted format, convert it
		if (dateStr.includes(',')) {
			// Parse formatted date like "31, Mar 2025"
			const dateMatch = dateStr.match(/(\d{1,2}),\s*(\w+)\s*(\d{4})/)
			if (dateMatch) {
				const [, day, monthName, year] = dateMatch
				const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
				const month = monthNames.indexOf(monthName) + 1
				dateStr = `${year}-${month.toString().padStart(2, '0')}-${day.padStart(2, '0')}`
			}
		}

		// Check if the date is today - only allow editing today's attendance
		if (!isToday(dateStr)) {
			toast.error('You can only edit attendance for today. Previous days cannot be edited.')
			return
		}

		const email = localStorage.getItem('demoEmail')
		if (isDemoFirebase && email) setDemoEmail(email)

		const body = {
			sessionId: session.id && !session.id.startsWith('session-') ? session.id : undefined, // Only send if it's a real session ID
			subjectId: realSubjectId,
			date: dateStr,
			period: session.period || 'I',
			entries: students.map((s) => ({ studentId: s.id, present: s.present }))
		}

		console.log('Posting attendance:', {
			sessionId: body.sessionId,
			subjectId: body.subjectId,
			date: body.date,
			period: body.period,
			entriesCount: body.entries.length,
			entries: body.entries.map(e => ({ studentId: e.studentId, present: e.present }))
		})

		try {
			const response = await api.post('/api/attendance/session', body)
			toast.success(`Attendance posted successfully for ${students.length} students`)
			setOpenRow(null)
			loadAllSessions() // Refresh the list
		} catch (err: any) {
			console.error('Error posting attendance:', err)
			toast.error(err?.response?.data?.error || err?.message || 'Failed to post attendance')
		}
	}

	const formatTime = (period: string) => {
		// Extract time from period string if available (e.g., "VII - 03:46 PM - 04:30 PM")
		const timeMatch = period.match(/(\d{1,2}:\d{2}\s*(?:AM|PM))\s*-\s*(\d{1,2}:\d{2}\s*(?:AM|PM))/)
		if (timeMatch) {
			return `${timeMatch[1]} - ${timeMatch[2]}`
		}
		return period
	}

	const getDueDate = (createdAt: string) => {
		if (!createdAt) return '—'
		const date = new Date(createdAt)
		date.setHours(date.getHours() + 3) // 3 hours after creation
		return date.toLocaleString('en-GB', {
			day: '2-digit',
			month: '2-digit',
			year: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		}).replace(',', '')
	}

	return (
		<section className="mb-6">
			{/* Header with back button */}
			<div className="flex items-center gap-4 mb-4">
				<button
					onClick={() => navigate('/dashboard/staff/academic/subject-card')}
					className="flex items-center gap-2 px-3 py-1.5 text-sm rounded border hover:bg-gray-100"
				>
					<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-4 h-4">
						<path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
					</svg>
					Back
				</button>
				<div className="flex-1">
					<h2 className="text-lg font-semibold">{subjectName}</h2>
					<p className="text-sm text-gray-600">{section}</p>
				</div>
			</div>

			{/* Attendance Sessions */}
			<div className="rounded-md border bg-white overflow-hidden">
				<div className="px-3 py-2 text-sm font-medium border-b bg-gray-50">
					Attendance Sessions
				</div>
				{loading ? (
					<div className="p-6 text-center text-gray-500">Loading attendance sessions...</div>
				) : sessions.length === 0 ? (
					<div className="p-6 text-center text-gray-500">
						No attendance sessions found for this subject.
					</div>
				) : (
					<div className="overflow-auto">
						<table className="min-w-full text-sm">
							<thead className="bg-white">
								<tr className="text-left text-gray-600">
									<th className="px-3 py-2">Date</th>
									<th className="px-3 py-2">Period</th>
									<th className="px-3 py-2">Day</th>
									<th className="px-3 py-2">Details</th>
									<th className="px-3 py-2">Attendance Status</th>
									<th className="px-3 py-2">Due Date</th>
								</tr>
							</thead>
							<tbody>
								{sessions.map((session, i) => {
									// Format date as YYYY-MM-DD for comparison
									let dateStr = session.date.includes('T') 
										? session.date.split('T')[0] 
										: session.date
									
									// If date is in formatted format, convert it
									if (dateStr.includes(',')) {
										const dateMatch = dateStr.match(/(\d{1,2}),\s*(\w+)\s*(\d{4})/)
										if (dateMatch) {
											const [, day, monthName, year] = dateMatch
											const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
											const month = monthNames.indexOf(monthName) + 1
											dateStr = `${year}-${month.toString().padStart(2, '0')}-${day.padStart(2, '0')}`
										}
									}
									
									const canEdit = isToday(dateStr)
									const isPast = !canEdit && new Date(dateStr + 'T00:00:00') < new Date()
									
									return (
										<tr key={session.id} className="border-t">
											<td className="px-3 py-2">{session.formattedDate}</td>
											<td className="px-3 py-2">{formatTime(session.period)}</td>
											<td className="px-3 py-2">{session.dayName}</td>
											<td className="px-3 py-2">{subjectName} - {section}</td>
											<td className="px-3 py-2">
												{session.completed ? (
													canEdit ? (
														<button
															className="text-blue-700 hover:underline"
															onClick={() => {
																setOpenRow(i)
																loadSessionAttendance(session.id)
															}}
														>
															Edit
														</button>
													) : (
														<span className="text-green-700">Completed</span>
													)
												) : canEdit ? (
													<button
														className="text-blue-700 hover:underline"
														onClick={() => {
															setOpenRow(i)
															loadSessionAttendance(session.id)
														}}
													>
														Click here
													</button>
												) : (
													<span className="text-gray-500">
														{isPast ? 'Cannot edit past attendance' : 'Completed'}
													</span>
												)}
											</td>
											<td className="px-3 py-2">{session.createdAt ? getDueDate(session.createdAt) : '—'}</td>
										</tr>
									)
								})}
							</tbody>
						</table>
					</div>
				)}
			</div>

			{/* Post Attendance Form */}
			{openRow !== null && (
				<div className="mt-4 rounded-md border bg-white overflow-hidden">
					<div className="px-3 py-2 text-sm font-medium border-b bg-gray-50 flex items-center justify-between">
						<span>Post Attendance</span>
						<button
							className="px-3 py-1.5 text-sm rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
							onClick={onPost}
							disabled={loadingStudents || students.length === 0}
						>
							{loadingStudents ? 'Loading...' : 'Post Attendance'}
						</button>
					</div>
					{loadingStudents ? (
						<div className="p-4 text-center text-gray-500">Loading students...</div>
					) : students.length === 0 ? (
						<div className="p-4 text-center text-gray-500">No students enrolled in this subject</div>
					) : (
						<div className="divide-y">
							{students.map((s, idx) => (
								<div key={s.id} className="px-3 py-2 flex items-center gap-3">
									<div className="h-8 w-8 rounded-full bg-blue-200" />
									<div className="flex-1">
										<div className="text-sm font-medium">{s.name}</div>
										<div className="text-xs text-gray-600">{s.roll}</div>
									</div>
									<button
										className={`px-2 py-1 text-xs rounded border ${s.present ? 'bg-emerald-100 text-emerald-800 border-emerald-200' : 'bg-rose-100 text-rose-800 border-rose-200'}`}
										onClick={() => onToggle(idx)}
									>
										{s.present ? 'Present' : 'Absent'}
									</button>
								</div>
							))}
						</div>
					)}
				</div>
			)}
		</section>
	)
}

// Demo data fallback
const demoRows = [
	{ date: '16, Oct 2025', period: 'VII - 03:46 PM - 04:30 PM', day: 'Thursday', details: 'Reverse Engineering Project - III CSE A', due: '16-10-2025 8:46 PM', completed: true },
	{ date: '16, Oct 2025', period: 'VII - 03:01 PM - 03:45 PM', day: 'Thursday', details: 'Reverse Engineering Project - III CSE A', due: '16-10-2025 8:01 PM', completed: true },
	{ date: '16, Oct 2025', period: 'VII - 01:56 PM - 02:40 PM', day: 'Thursday', details: 'Reverse Engineering Project - III CSE A', due: '16-10-2025 6:56 PM', completed: false },
]

const demoStudents: StudentAttendance[] = [
	{ id: '1', name: 'Arun Kumar', roll: '21BCS001', present: true },
	{ id: '2', name: 'Bhavya R', roll: '21BCS002', present: true },
	{ id: '3', name: 'Charan S', roll: '21BCS003', present: false },
]
