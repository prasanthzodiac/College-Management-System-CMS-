import { useState } from 'react'
import { toast } from 'sonner'

type ReportOption = {
	id: string
	name: string
	description: string
	category: 'academic' | 'attendance' | 'financial' | 'general'
}

const reportOptions: ReportOption[] = [
	{
		id: 'attendance-summary',
		name: 'Attendance Summary Report',
		description: 'Generate attendance summary for students by date range',
		category: 'attendance'
	},
	{
		id: 'student-list',
		name: 'Student List Report',
		description: 'Export complete student list with details',
		category: 'academic'
	},
	{
		id: 'subject-wise-attendance',
		name: 'Subject-wise Attendance Report',
		description: 'Attendance report grouped by subjects',
		category: 'attendance'
	},
	{
		id: 'fee-status',
		name: 'Fee Payment Status Report',
		description: 'View fee payment status of all students',
		category: 'financial'
	},
	{
		id: 'certificate-requests',
		name: 'Certificate Requests Report',
		description: 'Export all certificate requests with status',
		category: 'general'
	},
	{
		id: 'feedback-summary',
		name: 'Feedback Summary Report',
		description: 'Summary of all student feedback entries',
		category: 'general'
	},
	{
		id: 'grievance-report',
		name: 'Grievance Report',
		description: 'Track and export grievance requests',
		category: 'general'
	},
	{
		id: 'performance-report',
		name: 'Student Performance Report',
		description: 'Academic performance analysis by semester',
		category: 'academic'
	}
]

export function ReportPage() {
	const [selectedCategory, setSelectedCategory] = useState<string>('all')
	const [selectedReport, setSelectedReport] = useState<ReportOption | null>(null)
	const [dateRange, setDateRange] = useState({ from: '', to: '' })
	const [format, setFormat] = useState<'pdf' | 'excel' | 'csv'>('pdf')

	const categories = [
		{ value: 'all', label: 'All Reports' },
		{ value: 'academic', label: 'Academic' },
		{ value: 'attendance', label: 'Attendance' },
		{ value: 'financial', label: 'Financial' },
		{ value: 'general', label: 'General' }
	]

	const filteredReports = selectedCategory === 'all'
		? reportOptions
		: reportOptions.filter(r => r.category === selectedCategory)

	const handleGenerateReport = () => {
		if (!selectedReport) {
			toast.error('Please select a report type')
			return
		}

		// Mock report generation
		toast.success(`Generating ${selectedReport.name} in ${format.toUpperCase()} format...`)
		// In real implementation, this would call the backend API
		setTimeout(() => {
			toast.success('Report generated successfully!')
		}, 2000)
	}

	return (
		<div className="space-y-4">
			<div className="mb-4">
				<h2 className="text-xl font-semibold">Reports</h2>
				<p className="text-sm text-gray-600">Generate and export various reports</p>
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
				{/* Report Options */}
				<div className="lg:col-span-2 space-y-4">
					<div className="border rounded-md bg-white overflow-hidden">
						<div className="px-4 py-2 bg-blue-700 text-white font-medium">Available Reports</div>
						<div className="p-4">
							<div className="mb-4">
								<label className="block text-sm font-medium mb-2">Filter by Category</label>
								<select
									value={selectedCategory}
									onChange={(e) => setSelectedCategory(e.target.value)}
									className="w-full border rounded px-3 py-2 bg-white"
								>
									{categories.map(cat => (
										<option key={cat.value} value={cat.value}>{cat.label}</option>
									))}
								</select>
							</div>

							<div className="space-y-2">
								{filteredReports.map(report => (
									<button
										key={report.id}
										onClick={() => setSelectedReport(report)}
										className={`w-full text-left p-3 rounded border transition-colors ${
											selectedReport?.id === report.id
												? 'border-blue-500 bg-blue-50'
												: 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
										}`}
									>
										<div className="font-medium text-sm">{report.name}</div>
										<div className="text-xs text-gray-600 mt-1">{report.description}</div>
										<div className="mt-2">
											<span className={`text-xs px-2 py-0.5 rounded ${
												report.category === 'academic' ? 'bg-blue-100 text-blue-800' :
												report.category === 'attendance' ? 'bg-green-100 text-green-800' :
												report.category === 'financial' ? 'bg-yellow-100 text-yellow-800' :
												'bg-gray-100 text-gray-800'
											}`}>
												{report.category.toUpperCase()}
											</span>
										</div>
									</button>
								))}
							</div>
						</div>
					</div>
				</div>

				{/* Report Configuration */}
				<div className="space-y-4">
					<div className="border rounded-md bg-white overflow-hidden">
						<div className="px-4 py-2 bg-blue-700 text-white font-medium">Report Options</div>
						<div className="p-4 space-y-4 text-sm">
							{selectedReport ? (
								<>
									<div>
										<div className="font-medium mb-2">{selectedReport.name}</div>
										<div className="text-xs text-gray-600">{selectedReport.description}</div>
									</div>

									{(selectedReport.category === 'attendance' || selectedReport.category === 'academic') && (
										<div>
											<label className="block font-medium mb-1">Date Range</label>
											<div className="space-y-2">
												<input
													type="date"
													value={dateRange.from}
													onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
													className="w-full border rounded px-3 py-2 bg-white"
													placeholder="From Date"
												/>
												<input
													type="date"
													value={dateRange.to}
													onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
													className="w-full border rounded px-3 py-2 bg-white"
													placeholder="To Date"
												/>
											</div>
										</div>
									)}

									<div>
										<label className="block font-medium mb-1">Export Format</label>
										<div className="space-y-2">
											<label className="flex items-center gap-2">
												<input
													type="radio"
													value="pdf"
													checked={format === 'pdf'}
													onChange={() => setFormat('pdf')}
													className="text-blue-600"
												/>
												<span>PDF</span>
											</label>
											<label className="flex items-center gap-2">
												<input
													type="radio"
													value="excel"
													checked={format === 'excel'}
													onChange={() => setFormat('excel')}
													className="text-blue-600"
												/>
												<span>Excel (.xlsx)</span>
											</label>
											<label className="flex items-center gap-2">
												<input
													type="radio"
													value="csv"
													checked={format === 'csv'}
													onChange={() => setFormat('csv')}
													className="text-blue-600"
												/>
												<span>CSV</span>
											</label>
										</div>
									</div>

									<button
										onClick={handleGenerateReport}
										className="w-full px-4 py-2 rounded bg-blue-700 text-white hover:bg-blue-800"
									>
										Generate Report
									</button>
								</>
							) : (
								<div className="text-center text-gray-500 text-sm py-8">
									Select a report type to configure options
								</div>
							)}
						</div>
					</div>
				</div>
			</div>
		</div>
	)
}

