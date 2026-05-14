import React, { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import api, { setDemoEmail } from '../../lib/api'
import { isDemoFirebase } from '../../services/firebase'

type Assignment = {
	id: string
	subjectId: string
	subjectCode: string
	subjectName: string
	assignmentName: string
	description?: string | null
	dueDate: string
	minMark: number
	maxMark: number
	createdAt: string
}

type Submission = {
	id: string
	studentId: string
	subjectCode: string
	subjectName: string
	assignmentName: string
	staffName: string
	attachmentUrl: string
	submittedAt?: string
	obtainedMark?: number | null
	minMark?: number | null
	maxMark?: number | null
	remarks?: string | null
	gradedAt?: string | null
	student: {
		id: string
		name: string
		email: string
	} | null
}

export default function AssignmentPage() {
	const navigate = useNavigate()
	const [searchParams] = useSearchParams()
	const subjectId = searchParams.get('subjectId') || ''
	const subjectName = searchParams.get('subjectName') || ''
	const section = searchParams.get('section') || ''

	const [tab, setTab] = useState<'assignments' | 'submissions'>('assignments')
	const [assignments, setAssignments] = useState<Assignment[]>([])
	const [submissions, setSubmissions] = useState<Submission[]>([])
	const [loading, setLoading] = useState(false)
	const [showCreateForm, setShowCreateForm] = useState(false)
	const [showMarkForm, setShowMarkForm] = useState(false)
	const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null)
	const [realSubjectId, setRealSubjectId] = useState<string | null>(null)

	// Form state
	const [formData, setFormData] = useState({
		assignmentName: '',
		description: '',
		dueDate: '',
		minMark: 0,
		maxMark: 100
	})

	// Mark form state
	const [markData, setMarkData] = useState({
		obtainedMark: '',
		minMark: '',
		maxMark: '',
		remarks: ''
	})

	useEffect(() => {
		// Look up subject by code to get real UUID
		const lookupSubject = async () => {
			if (!subjectId) return
			if (!subjectId.startsWith('SUBJ-')) {
				setRealSubjectId(subjectId)
				return
			}

			const email = localStorage.getItem('demoEmail')
			if (isDemoFirebase && email) setDemoEmail(email)

			const code = subjectId.replace('SUBJ-', '')
			try {
				const { data } = await api.get(`/api/subjects/code/${code}`)
				if (data?.subject?.id) {
					setRealSubjectId(data.subject.id)
				} else {
					setRealSubjectId(subjectId)
				}
			} catch (err: any) {
				console.error('Failed to lookup subject:', err)
				setRealSubjectId(subjectId)
			}
		}
		lookupSubject()
	}, [subjectId])

	useEffect(() => {
		if (!realSubjectId) return
		if (tab === 'assignments') {
			loadAssignments()
		} else {
			loadSubmissions()
		}
	}, [realSubjectId, tab])

	const loadAssignments = async () => {
		if (!realSubjectId) return
		setLoading(true)
		try {
			const email = localStorage.getItem('demoEmail')
			if (isDemoFirebase && email) setDemoEmail(email)

			const { data } = await api.get(`/api/assignments/subject/${realSubjectId}`)
			setAssignments(data?.assignments || [])
		} catch (err: any) {
			console.error('Error loading assignments:', err)
			toast.error(err?.response?.data?.error || 'Failed to load assignments')
			setAssignments([])
		} finally {
			setLoading(false)
		}
	}

	const loadSubmissions = async () => {
		if (!realSubjectId) return
		setLoading(true)
		try {
			const email = localStorage.getItem('demoEmail')
			if (isDemoFirebase && email) setDemoEmail(email)

			const { data } = await api.get(`/api/assignments/subject/${realSubjectId}/submissions`)
			setSubmissions(data?.submissions || [])
		} catch (err: any) {
			console.error('Error loading submissions:', err)
			toast.error(err?.response?.data?.error || 'Failed to load submissions')
			setSubmissions([])
		} finally {
			setLoading(false)
		}
	}

	const handleCreateAssignment = async (e: React.FormEvent) => {
		e.preventDefault()
		if (!realSubjectId) {
			toast.error('Subject ID not found')
			return
		}

		if (!formData.assignmentName || !formData.dueDate) {
			toast.error('Please fill all required fields')
			return
		}

		const minMark = Number.parseInt(formData.minMark.toString(), 10)
		const maxMark = Number.parseInt(formData.maxMark.toString(), 10)
		const safeMin = Number.isNaN(minMark) ? 0 : minMark
		const safeMax = Number.isNaN(maxMark) ? 100 : maxMark

		if (safeMin < 0 || safeMax <= 0 || safeMin > safeMax) {
			toast.error('Please enter a valid mark range')
			return
		}

		try {
			const email = localStorage.getItem('demoEmail')
			if (isDemoFirebase && email) setDemoEmail(email)

			// Get subject details
			const { data: subjectData } = await api.get(`/api/subjects/${realSubjectId}`)
			const subject = subjectData?.subject

			await api.post('/api/assignments/create', {
				subjectId: realSubjectId,
				subjectCode: subject?.code || subjectId.replace('SUBJ-', ''),
				subjectName: subject?.name || subjectName,
				assignmentName: formData.assignmentName,
				description: formData.description || undefined,
				dueDate: formData.dueDate,
				minMark: safeMin,
				maxMark: safeMax
			})

			toast.success('Assignment created successfully')
			setShowCreateForm(false)
			setFormData({ assignmentName: '', description: '', dueDate: '', minMark: 0, maxMark: 100 })
			loadAssignments()
		} catch (err: any) {
			toast.error(err?.response?.data?.error || 'Failed to create assignment')
		}
	}

	const handleMarkSubmission = async (e: React.FormEvent) => {
		e.preventDefault()
		if (!selectedSubmission) return

		try {
			const email = localStorage.getItem('demoEmail')
			if (isDemoFirebase && email) setDemoEmail(email)

			await api.put(`/api/assignments/submissions/${selectedSubmission.id}/mark`, {
				obtainedMark: markData.obtainedMark ? parseInt(markData.obtainedMark) : undefined,
				minMark: markData.minMark ? parseInt(markData.minMark) : undefined,
				maxMark: markData.maxMark ? parseInt(markData.maxMark) : undefined,
				remarks: markData.remarks || undefined
			})

			toast.success('Submission marked successfully')
			setShowMarkForm(false)
			setSelectedSubmission(null)
			setMarkData({ obtainedMark: '', minMark: '', maxMark: '', remarks: '' })
			loadSubmissions()
		} catch (err: any) {
			toast.error(err?.response?.data?.error || 'Failed to mark submission')
		}
	}

	const openMarkForm = (submission: Submission) => {
		setSelectedSubmission(submission)
		setMarkData({
			obtainedMark: submission.obtainedMark?.toString() || '',
			minMark: submission.minMark?.toString() || '',
			maxMark: submission.maxMark?.toString() || '',
			remarks: submission.remarks || ''
		})
		setShowMarkForm(true)
	}

	const formatDate = (dateStr: string) => {
		if (!dateStr) return '—'
		const date = new Date(dateStr + 'T00:00:00')
		return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
	}

	return (
		<section className="mb-6">
			{/* Header */}
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

			{/* Tabs */}
			<div className="border rounded-md bg-white overflow-hidden mb-4">
				<div className="px-4 py-2 border-b bg-gray-50 flex items-center justify-between">
					<div className="flex gap-2">
						<button
							onClick={() => setTab('assignments')}
							className={`px-3 py-1.5 text-sm rounded ${tab === 'assignments' ? 'bg-blue-700 text-white' : 'bg-white border'}`}
						>
							Assignments
						</button>
						<button
							onClick={() => setTab('submissions')}
							className={`px-3 py-1.5 text-sm rounded ${tab === 'submissions' ? 'bg-blue-700 text-white' : 'bg-white border'}`}
						>
							Submissions
						</button>
					</div>
					{tab === 'assignments' && (
						<button
							onClick={() => setShowCreateForm(true)}
							className="px-3 py-1.5 text-sm rounded bg-green-600 text-white hover:bg-green-700"
						>
							+ Create Assignment
						</button>
					)}
				</div>

				{/* Content */}
				<div className="p-4">
					{loading ? (
						<div className="text-center text-gray-500 py-8">Loading...</div>
					) : tab === 'assignments' ? (
						<div className="overflow-auto">
							<table className="min-w-full text-sm">
								<thead className="bg-gray-50">
									<tr>
										<th className="px-3 py-2 text-left border-b">Assignment Name</th>
										<th className="px-3 py-2 text-left border-b">Description</th>
										<th className="px-3 py-2 text-left border-b">Due Date</th>
										<th className="px-3 py-2 text-left border-b">Marks</th>
										<th className="px-3 py-2 text-left border-b">Created</th>
									</tr>
								</thead>
								<tbody>
									{assignments.length === 0 ? (
										<tr>
											<td colSpan={5} className="px-3 py-4 text-center text-gray-500">
												No assignments created yet
											</td>
										</tr>
									) : (
										assignments.map((a) => (
											<tr key={a.id} className="border-t hover:bg-gray-50">
												<td className="px-3 py-2">{a.assignmentName}</td>
												<td className="px-3 py-2">{a.description || '—'}</td>
												<td className="px-3 py-2">{formatDate(a.dueDate)}</td>
												<td className="px-3 py-2">{a.minMark} - {a.maxMark}</td>
												<td className="px-3 py-2">{formatDate(a.createdAt)}</td>
											</tr>
										))
									)}
								</tbody>
							</table>
						</div>
					) : (
						<div className="overflow-auto">
							<table className="min-w-full text-sm">
								<thead className="bg-gray-50">
									<tr>
										<th className="px-3 py-2 text-left border-b">Student</th>
										<th className="px-3 py-2 text-left border-b">Assignment</th>
										<th className="px-3 py-2 text-left border-b">Submitted</th>
										<th className="px-3 py-2 text-left border-b">Obtained Mark</th>
										<th className="px-3 py-2 text-left border-b">Max Mark</th>
										<th className="px-3 py-2 text-left border-b">Status</th>
										<th className="px-3 py-2 text-left border-b">Action</th>
									</tr>
								</thead>
								<tbody>
									{submissions.length === 0 ? (
										<tr>
											<td colSpan={7} className="px-3 py-4 text-center text-gray-500">
												No submissions found
											</td>
										</tr>
									) : (
										submissions.map((s) => (
											<tr key={s.id} className="border-t hover:bg-gray-50">
												<td className="px-3 py-2">
													<div className="font-medium">{s.student?.name || 'Unknown'}</div>
													<div className="text-xs text-gray-500">{s.student?.email || ''}</div>
												</td>
												<td className="px-3 py-2">{s.assignmentName}</td>
												<td className="px-3 py-2">{formatDate(s.submittedAt || '')}</td>
												<td className="px-3 py-2">
													{s.obtainedMark !== null && s.obtainedMark !== undefined ? (
														<span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-white">
															{s.obtainedMark}
														</span>
													) : (
														<span className="text-gray-400">—</span>
													)}
												</td>
												<td className="px-3 py-2">
													{s.maxMark !== null && s.maxMark !== undefined ? (
														<span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-blue-900 text-white">
															{s.maxMark}
														</span>
													) : (
														<span className="text-gray-400">—</span>
													)}
												</td>
												<td className="px-3 py-2">
													{s.obtainedMark !== null && s.obtainedMark !== undefined ? (
														<span className="text-green-700">Graded</span>
													) : (
														<span className="text-yellow-700">Pending</span>
													)}
												</td>
												<td className="px-3 py-2">
													<div className="flex gap-2">
														<button
															onClick={() => window.open(s.attachmentUrl, '_blank')}
															className="px-2 py-1 text-xs rounded bg-cyan-500 text-white hover:bg-cyan-600"
														>
															View
														</button>
														<button
															onClick={() => openMarkForm(s)}
															className="px-2 py-1 text-xs rounded bg-blue-600 text-white hover:bg-blue-700"
														>
															Mark
														</button>
													</div>
												</td>
											</tr>
										))
									)}
								</tbody>
							</table>
						</div>
					)}
				</div>
			</div>

			{/* Create Assignment Modal */}
			{showCreateForm && (
				<div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center">
					<div className="bg-white rounded-md shadow-lg w-full max-w-md m-4">
						<div className="px-4 py-3 border-b flex items-center justify-between">
							<h3 className="font-semibold">Create Assignment</h3>
							<button onClick={() => setShowCreateForm(false)} className="text-gray-500 hover:text-gray-700">
								✕
							</button>
						</div>
						<form onSubmit={handleCreateAssignment} className="p-4 space-y-4">
							<div>
								<label className="block text-sm font-medium mb-1">Assignment Name *</label>
								<input
									type="text"
									value={formData.assignmentName}
									onChange={(e) => setFormData({ ...formData, assignmentName: e.target.value })}
									className="w-full border rounded px-3 py-2 text-sm"
									required
								/>
							</div>
							<div>
								<label className="block text-sm font-medium mb-1">Description</label>
								<textarea
									value={formData.description}
									onChange={(e) => setFormData({ ...formData, description: e.target.value })}
									className="w-full border rounded px-3 py-2 text-sm"
									rows={3}
								/>
							</div>
							<div>
								<label className="block text-sm font-medium mb-1">Due Date *</label>
								<input
									type="date"
									value={formData.dueDate}
									onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
									className="w-full border rounded px-3 py-2 text-sm"
									required
								/>
							</div>
							<div className="grid grid-cols-2 gap-4">
								<div>
									<label className="block text-sm font-medium mb-1">Min Mark</label>
									<input
										type="number"
										value={formData.minMark}
										onChange={(e) => setFormData({ ...formData, minMark: parseInt(e.target.value) || 0 })}
										className="w-full border rounded px-3 py-2 text-sm"
									/>
								</div>
								<div>
									<label className="block text-sm font-medium mb-1">Max Mark</label>
									<input
										type="number"
										value={formData.maxMark}
										onChange={(e) => setFormData({ ...formData, maxMark: parseInt(e.target.value) || 100 })}
										className="w-full border rounded px-3 py-2 text-sm"
									/>
								</div>
							</div>
							<div className="flex gap-2 pt-2">
								<button
									type="button"
									onClick={() => setShowCreateForm(false)}
									className="flex-1 px-4 py-2 text-sm rounded border hover:bg-gray-100"
								>
									Cancel
								</button>
								<button
									type="submit"
									className="flex-1 px-4 py-2 text-sm rounded bg-blue-600 text-white hover:bg-blue-700"
								>
									Create
								</button>
							</div>
						</form>
					</div>
				</div>
			)}

			{/* Mark Submission Modal */}
			{showMarkForm && selectedSubmission && (
				<div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center">
					<div className="bg-white rounded-md shadow-lg w-full max-w-md m-4">
						<div className="px-4 py-3 border-b flex items-center justify-between">
							<h3 className="font-semibold">Mark Submission</h3>
							<button onClick={() => setShowMarkForm(false)} className="text-gray-500 hover:text-gray-700">
								✕
							</button>
						</div>
						<form onSubmit={handleMarkSubmission} className="p-4 space-y-4">
							<div>
								<label className="block text-sm font-medium mb-1">Student</label>
								<div className="text-sm text-gray-700">
									{selectedSubmission.student?.name || 'Unknown'} ({selectedSubmission.student?.email || ''})
								</div>
							</div>
							<div>
								<label className="block text-sm font-medium mb-1">Assignment</label>
								<div className="text-sm text-gray-700">{selectedSubmission.assignmentName}</div>
							</div>
							<div className="grid grid-cols-3 gap-4">
								<div>
									<label className="block text-sm font-medium mb-1">Obtained Mark</label>
									<input
										type="number"
										value={markData.obtainedMark}
										onChange={(e) => setMarkData({ ...markData, obtainedMark: e.target.value })}
										className="w-full border rounded px-3 py-2 text-sm"
									/>
								</div>
								<div>
									<label className="block text-sm font-medium mb-1">Min Mark</label>
									<input
										type="number"
										value={markData.minMark}
										onChange={(e) => setMarkData({ ...markData, minMark: e.target.value })}
										className="w-full border rounded px-3 py-2 text-sm"
									/>
								</div>
								<div>
									<label className="block text-sm font-medium mb-1">Max Mark</label>
									<input
										type="number"
										value={markData.maxMark}
										onChange={(e) => setMarkData({ ...markData, maxMark: e.target.value })}
										className="w-full border rounded px-3 py-2 text-sm"
									/>
								</div>
							</div>
							<div>
								<label className="block text-sm font-medium mb-1">Remarks</label>
								<textarea
									value={markData.remarks}
									onChange={(e) => setMarkData({ ...markData, remarks: e.target.value })}
									className="w-full border rounded px-3 py-2 text-sm"
									rows={3}
								/>
							</div>
							<div className="flex gap-2 pt-2">
								<button
									type="button"
									onClick={() => setShowMarkForm(false)}
									className="flex-1 px-4 py-2 text-sm rounded border hover:bg-gray-100"
								>
									Cancel
								</button>
								<button
									type="submit"
									className="flex-1 px-4 py-2 text-sm rounded bg-blue-600 text-white hover:bg-blue-700"
								>
									Save Marks
								</button>
							</div>
						</form>
					</div>
				</div>
			)}
		</section>
	)
}

