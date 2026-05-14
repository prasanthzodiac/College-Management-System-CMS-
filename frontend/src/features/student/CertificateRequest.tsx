import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import api from '../../lib/api'

type CertificateRequest = {
	id: string
	certificateType: string
	purpose: string
	status: 'pending' | 'approved' | 'rejected' | 'completed'
	remarks?: string | null
	processedAt?: string | null
	createdAt: string
}

export default function CertificateRequest() {
	const [requests, setRequests] = useState<CertificateRequest[]>([])
	const [showForm, setShowForm] = useState(false)
	const [certificateType, setCertificateType] = useState('')
	const [purpose, setPurpose] = useState('')
	const [loading, setLoading] = useState(false)

	useEffect(() => {
		loadRequests()
	}, [])

	const loadRequests = async () => {
		try {
			const { data } = await api.get('/api/certificates/student/current')
			setRequests(data?.requests || [])
		} catch (err: any) {
			// If endpoint doesn't exist yet, use empty array
			setRequests([])
		}
	}

	const onSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		if (!certificateType || !purpose) {
			toast.error('Please fill all required fields')
			return
		}
		setLoading(true)
		try {
			await api.post('/api/certificates', { certificateType, purpose })
			toast.success('Certificate request submitted successfully')
			setCertificateType('')
			setPurpose('')
			setShowForm(false)
			loadRequests()
		} catch (err: any) {
			toast.error(err?.response?.data?.error || 'Failed to submit request')
		} finally {
			setLoading(false)
		}
	}

	const getStatusColor = (status: string) => {
		switch (status) {
			case 'pending': return 'bg-yellow-100 text-yellow-800'
			case 'approved': return 'bg-blue-100 text-blue-800'
			case 'rejected': return 'bg-red-100 text-red-800'
			case 'completed': return 'bg-green-100 text-green-800'
			default: return 'bg-gray-100 text-gray-800'
		}
	}

	const formatDate = (dateStr: string) => {
		return new Date(dateStr).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
	}

	return (
		<div className="p-6">
			<div className="rounded-md border bg-white overflow-hidden">
				<div className="flex items-center justify-between px-4 py-2 bg-blue-700 text-white rounded-t-md">
					<h3 className="font-semibold">Certificate Requests</h3>
					<button
						onClick={() => setShowForm(true)}
						className="text-sm bg-white text-blue-700 hover:bg-gray-100 rounded px-3 py-1"
					>
						+ New Request
					</button>
				</div>

				{requests.length === 0 ? (
					<div className="p-6 text-center text-gray-500">
						<p>No certificate requests yet.</p>
						<button
							onClick={() => setShowForm(true)}
							className="mt-2 text-blue-700 hover:underline"
						>
							Create your first request
						</button>
					</div>
				) : (
					<div className="overflow-x-auto">
						<table className="min-w-full text-sm">
							<thead className="bg-gray-50">
								<tr>
									<th className="px-4 py-2 text-left border-b">Request ID</th>
									<th className="px-4 py-2 text-left border-b">Certificate Type</th>
									<th className="px-4 py-2 text-left border-b">Purpose</th>
									<th className="px-4 py-2 text-left border-b">Status</th>
									<th className="px-4 py-2 text-left border-b">Remarks</th>
									<th className="px-4 py-2 text-left border-b">Requested Date</th>
									<th className="px-4 py-2 text-left border-b">Processed Date</th>
								</tr>
							</thead>
							<tbody>
								{requests.map((req) => (
									<tr key={req.id} className="border-b hover:bg-gray-50">
										<td className="px-4 py-2">{req.id.substring(0, 8)}...</td>
										<td className="px-4 py-2">{req.certificateType}</td>
										<td className="px-4 py-2">{req.purpose}</td>
										<td className="px-4 py-2">
											<span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(req.status)}`}>
												{req.status.toUpperCase()}
											</span>
										</td>
										<td className="px-4 py-2">{req.remarks || '—'}</td>
										<td className="px-4 py-2">{formatDate(req.createdAt)}</td>
										<td className="px-4 py-2">{req.processedAt ? formatDate(req.processedAt) : '—'}</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				)}
			</div>

			{showForm && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
					<div className="w-full max-w-2xl rounded-md bg-white shadow-lg border m-4">
						<div className="flex items-center justify-between px-4 py-2 bg-blue-700 text-white rounded-t-md">
							<h3 className="font-semibold">New Certificate Request</h3>
							<button
								onClick={() => setShowForm(false)}
								className="text-white hover:text-gray-200"
							>
								✕
							</button>
						</div>
						<form onSubmit={onSubmit} className="p-4 space-y-4 text-sm">
							<div>
								<label className="block font-medium mb-1">* Certificate Type</label>
								<select
									value={certificateType}
									onChange={(e) => setCertificateType(e.target.value)}
									className="w-full border rounded px-3 py-2 bg-white"
									required
								>
									<option value="">-- Select Certificate Type --</option>
									<option value="Bonafide Certificate">Bonafide Certificate</option>
									<option value="Transfer Certificate">Transfer Certificate</option>
									<option value="Character Certificate">Character Certificate</option>
									<option value="Migration Certificate">Migration Certificate</option>
									<option value="Provisional Certificate">Provisional Certificate</option>
									<option value="Degree Certificate">Degree Certificate</option>
									<option value="Mark Sheet">Mark Sheet</option>
									<option value="Attendance Certificate">Attendance Certificate</option>
									<option value="Fee Certificate">Fee Certificate</option>
									<option value="Other">Other</option>
								</select>
							</div>
							<div>
								<label className="block font-medium mb-1">* Purpose</label>
								<textarea
									value={purpose}
									onChange={(e) => setPurpose(e.target.value)}
									placeholder="Describe the purpose for requesting this certificate"
									rows={4}
									className="w-full border rounded px-3 py-2 bg-white"
									required
								/>
							</div>
							<div className="flex items-center gap-2 pt-2">
								<button
									type="submit"
									disabled={loading}
									className="px-4 py-2 rounded bg-blue-700 text-white hover:bg-blue-800 disabled:opacity-50"
								>
									{loading ? 'Submitting...' : 'Submit Request'}
								</button>
								<button
									type="button"
									onClick={() => {
										setShowForm(false)
										setCertificateType('')
										setPurpose('')
									}}
									className="px-4 py-2 rounded border hover:bg-gray-100"
								>
									Cancel
								</button>
							</div>
						</form>
					</div>
				</div>
			)}
		</div>
	)
}
