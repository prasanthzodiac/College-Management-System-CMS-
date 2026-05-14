import { useRef, useState, useEffect } from 'react'
import { toast } from 'sonner'
import api, { setDemoEmail } from '../../lib/api'
import { isDemoFirebase } from '../../services/firebase'

type AssignmentRow = {
	id?: string
	code: string
	subject: string
	name: string
	staff: string
	link?: string
	attachment?: string
	dueDate: string
	subjectId?: string
}

type Submission = {
	id: string
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
	dueDate?: string
}

export default function UploadAssignment() {
	const [tab, setTab] = useState<'upload' | 'marks'>('upload')
    const fileInputRef = useRef<HTMLInputElement | null>(null)
    const [pendingRow, setPendingRow] = useState<AssignmentRow | null>(null)
    const [rows, setRows] = useState<AssignmentRow[]>([])
    const [submissions, setSubmissions] = useState<Submission[]>([])
    const [loading, setLoading] = useState(false)
    const [viewerUrl, setViewerUrl] = useState<string | null>(null)
    const [alertMsg, setAlertMsg] = useState<string | null>(null)
    const showAlert = (msg: string) => {
        setAlertMsg(msg)
        window.setTimeout(() => setAlertMsg(null), 2000)
    }

    useEffect(() => {
        if (tab === 'upload') {
            loadAssignments()
        } else {
            loadSubmissions()
        }
    }, [tab])

    const loadAssignments = async () => {
        setLoading(true)
        try {
            const email = localStorage.getItem('demoEmail')
            if (isDemoFirebase && email) setDemoEmail(email)

            // Load assignments and submissions to check which are already submitted
            const [assignmentsRes, submissionsRes] = await Promise.all([
                api.get('/api/assignments'),
                api.get('/api/assignments/submissions').catch(() => ({ data: { items: [] } }))
            ])

            const assignments = assignmentsRes.data?.assignments || []
            const submissions = submissionsRes.data?.items || []
            
            // Create a map of submitted assignments
            const submittedMap = new Map<string, string>()
            submissions.forEach((s: any) => {
                const key = `${s.subjectCode}-${s.assignmentName}`
                submittedMap.set(key, s.attachmentUrl)
            })

            const assignmentRows = assignments.map((a: any) => {
                const key = `${a.subjectCode || a.subject?.code || ''}-${a.assignmentName}`
                const submittedUrl = submittedMap.get(key)
                return {
                    id: a.id,
                    code: a.subjectCode || a.subject?.code || '',
                    subject: a.subjectName || a.subject?.name || '',
                    name: a.assignmentName,
                    staff: a.staffName || 'Unknown Staff',
                    link: '-',
                    attachment: submittedUrl || '',
                    dueDate: formatDate(a.dueDate),
                    subjectId: a.subjectId
                }
            })
            setRows(assignmentRows)
        } catch (err: any) {
            console.error('Error loading assignments:', err)
            toast.error(err?.response?.data?.error || 'Failed to load assignments')
            setRows([])
        } finally {
            setLoading(false)
        }
    }

    const loadSubmissions = async () => {
        setLoading(true)
        try {
            const email = localStorage.getItem('demoEmail')
            if (isDemoFirebase && email) setDemoEmail(email)

            const { data } = await api.get('/api/assignments/submissions')
            const items = (data?.items || []).map((s: any) => ({
                id: s.id,
                subjectCode: s.subjectCode,
                subjectName: s.subjectName,
                assignmentName: s.assignmentName,
                staffName: s.staffName,
                attachmentUrl: s.attachmentUrl,
                submittedAt: s.submittedAt,
                obtainedMark: s.obtainedMark,
                minMark: s.minMark,
                maxMark: s.maxMark,
                remarks: s.remarks
            }))
            setSubmissions(items)
        } catch (err: any) {
            console.error('Error loading submissions:', err)
            toast.error(err?.response?.data?.error || 'Failed to load submissions')
            setSubmissions([])
        } finally {
            setLoading(false)
        }
    }

    const formatDate = (dateStr: string) => {
        if (!dateStr) return '—'
        const date = new Date(dateStr + 'T00:00:00')
        return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    }

    const handleChooseFile = (row: AssignmentRow) => {
        setPendingRow(row)
        fileInputRef.current?.click()
    }

    const readFileAsBase64 = (file: File) => new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(String(reader.result))
        reader.onerror = reject
        reader.readAsDataURL(file)
    })

    const onFileSelected: React.ChangeEventHandler<HTMLInputElement> = async (e) => {
        const file = e.target.files?.[0]
        e.target.value = ''
        if (!file || !pendingRow) return
        try {
            const base64 = await readFileAsBase64(file)
            const { data } = await api.post('/api/media/upload', { data: base64, folder: 'assignments' })
            const url: string | undefined = data?.url
            setRows((prev) => prev.map(r => r.code === pendingRow.code ? { ...r, attachment: url || r.attachment } : r))
            toast.success('File uploaded')
            if (url) {
                // Persist submission
                const email = localStorage.getItem('demoEmail')
                if (isDemoFirebase && email) setDemoEmail(email)

                await api.post('/api/assignments', {
                    subjectCode: pendingRow.code,
                    subjectName: pendingRow.subject,
                    assignmentName: pendingRow.name,
                    staffName: pendingRow.staff,
                    attachmentUrl: url
                })
                toast.success('Assignment submitted successfully')
                // Reload assignments to update the list
                loadAssignments()
            }
        } catch (err: any) {
            toast.error(err?.message || 'Upload failed')
        } finally {
            setPendingRow(null)
        }
    }

    const onView = (row: AssignmentRow) => {
        const url = row.attachment || ''
        if (url.startsWith('http://') || url.startsWith('https://')) {
            setViewerUrl(url)
        } else {
            showAlert('No records found')
        }
    }

	return (
		<div className="p-4">
			<div className="rounded-md border bg-white overflow-hidden">
				{/* Header (with subtitle inside red bar) */}
				<div className="px-4 py-2 bg-red-600 text-white">
					<div className="font-medium">Assignment</div>
					<div className="text-[12px] opacity-90">Manage Assignments Here</div>
				</div>

				{/* Tabs */}
				<div className="px-4">
					<div className="inline-flex gap-2 text-sm">
						<button onClick={() => setTab('upload')} className={`px-3 py-1.5 rounded ${tab==='upload' ? 'bg-blue-700 text-white' : 'bg-white border'}`}>Upload</button>
						<button onClick={() => setTab('marks')} className={`px-3 py-1.5 rounded ${tab==='marks' ? 'bg-blue-700 text-white' : 'bg-white border'}`}>View Marks</button>
					</div>
				</div>

				{/* Content */}
				<div className="p-4">
                    {loading ? (
                        <div className="text-center text-gray-500 py-8">Loading...</div>
                    ) : tab === 'upload' ? (
						<div className="overflow-x-auto">
							<table className="min-w-[1000px] w-full text-left text-sm">
								<thead>
									<tr className="bg-gray-50">
										<th className="px-3 py-2 border-b">#</th>
										<th className="px-3 py-2 border-b">Subject Code</th>
										<th className="px-3 py-2 border-b">Subject</th>
										<th className="px-3 py-2 border-b">Assignment Name</th>
										<th className="px-3 py-2 border-b">Subject Staff</th>
										<th className="px-3 py-2 border-b">Link</th>
										<th className="px-3 py-2 border-b">Attachments</th>
										<th className="px-3 py-2 border-b">Due Date</th>
										<th className="px-3 py-2 border-b">Action</th>
									</tr>
								</thead>
								<tbody>
                                    {rows.length === 0 ? (
                                        <tr>
                                            <td colSpan={9} className="px-3 py-4 text-center text-gray-500">
                                                No assignments found
                                            </td>
                                        </tr>
                                    ) : (
                                        rows.map((r, i) => (
                                            <tr key={r.id || r.code || i}>
                                                <td className="px-3 py-2 border-b">{i+1}</td>
                                                <td className="px-3 py-2 border-b">{r.code}</td>
                                                <td className="px-3 py-2 border-b">{r.subject}</td>
                                                <td className="px-3 py-2 border-b">{r.name}</td>
                                                <td className="px-3 py-2 border-b">{r.staff}</td>
                                                <td className="px-3 py-2 border-b">{r.link || '-'}</td>
                                                <td className="px-3 py-2 border-b">
                                                    {r.attachment ? (
                                                        <button onClick={() => onView(r)} className="px-2 py-0.5 rounded bg-cyan-500 text-white">View</button>
                                                    ) : (
                                                        <span className="text-gray-400">—</span>
                                                    )}
                                                </td>
                                                <td className="px-3 py-2 border-b">{r.dueDate}</td>
                                                <td className="px-3 py-2 border-b">
                                                    <button title="Upload document" onClick={() => handleChooseFile(r)} className="text-blue-700 hover:text-blue-900" aria-label="Upload">
                                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                                                            <path d="M12 5l4 4h-3v6h-2V9H8l4-4z"/>
                                                            <path d="M5 19a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-2h-2v2H7v-2H5v2z"/>
                                                        </svg>
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
								</tbody>
							</table>
						</div>
					) : (
						<div className="overflow-x-auto">
							{submissions.length === 0 ? (
								<div className="text-center text-gray-500 py-8">No submissions found</div>
							) : (
								<>
									{/* Group by subject */}
									{Array.from(new Set(submissions.map(s => s.subjectCode))).map(subjectCode => {
										const subjectSubmissions = submissions.filter(s => s.subjectCode === subjectCode)
										const subjectName = subjectSubmissions[0]?.subjectName || subjectCode
										return (
											<div key={subjectCode} className="mb-4">
												{/* Subject header row */}
												<div className="mb-2 rounded border bg-gray-100 px-3 py-2 text-sm">
													<span className="font-medium">{subjectCode} - {subjectName}</span>
													<span className="float-right opacity-70">⋮</span>
												</div>
												<table className="min-w-[1000px] w-full text-left text-sm mb-4">
													<thead>
														<tr className="bg-gray-50">
															<th className="px-3 py-2 border-b">#</th>
															<th className="px-3 py-2 border-b">Assignment Description</th>
															<th className="px-3 py-2 border-b">Staff Name</th>
															<th className="px-3 py-2 border-b">Obtained Mark</th>
															<th className="px-3 py-2 border-b">Min. Mark</th>
															<th className="px-3 py-2 border-b">Max. Mark</th>
															<th className="px-3 py-2 border-b">Due Date</th>
															<th className="px-3 py-2 border-b">Submitted Date</th>
														</tr>
													</thead>
													<tbody>
														{subjectSubmissions.map((s, idx) => (
															<tr key={s.id}>
																<td className="px-3 py-2 border-b">{idx + 1}</td>
																<td className="px-3 py-2 border-b">{s.assignmentName}</td>
																<td className="px-3 py-2 border-b">{s.staffName}</td>
																<td className="px-3 py-2 border-b">
																	{s.obtainedMark !== null && s.obtainedMark !== undefined ? (
																		<span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-white">
																			{s.obtainedMark}
																		</span>
																	) : (
																		<span className="text-gray-400">—</span>
																	)}
																</td>
																<td className="px-3 py-2 border-b">
																	{s.minMark !== null && s.minMark !== undefined ? (
																		<span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-cyan-500 text-white">
																			{s.minMark}
																		</span>
																	) : (
																		<span className="text-gray-400">—</span>
																	)}
																</td>
																<td className="px-3 py-2 border-b">
																	{s.maxMark !== null && s.maxMark !== undefined ? (
																		<span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-blue-900 text-white">
																			{s.maxMark}
																		</span>
																	) : (
																		<span className="text-gray-400">—</span>
																	)}
																</td>
																<td className="px-3 py-2 border-b">{formatDate(s.dueDate || '')}</td>
																<td className="px-3 py-2 border-b">{formatDate(s.submittedAt || '')}</td>
															</tr>
														))}
													</tbody>
												</table>
											</div>
										)
									})}
								</>
							)}
						</div>
					)}
                <input ref={fileInputRef} type="file" className="hidden" onChange={onFileSelected} />

                {viewerUrl && (
                    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center">
                        <div className="bg-white rounded-md shadow-lg w-[90vw] h-[80vh] relative">
                            <button onClick={() => setViewerUrl(null)} className="absolute right-2 top-2 px-2 py-1 border rounded">Close</button>
                            <iframe src={viewerUrl} title="Attachment" className="w-full h-full rounded-b-md" />
                        </div>
                    </div>
                )}

                {alertMsg && (
                    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 bg-black text-white text-sm px-3 py-2 rounded shadow">{alertMsg}</div>
                )}
				</div>
			</div>
		</div>
	)
}

