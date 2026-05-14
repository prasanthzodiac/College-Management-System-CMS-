import { useEffect, useRef, useState } from 'react'
import api, { setDemoEmail } from '../../lib/api'
import { isDemoFirebase } from '../../services/firebase'

export default function Grievances() {
	const [open, setOpen] = useState(false)
	// Form state
	const [category, setCategory] = useState('')
	const [subCategory, setSubCategory] = useState('')
	const [location, setLocation] = useState('')
	const [otherLocation, setOtherLocation] = useState(false)
	const [placeName, setPlaceName] = useState('')
	const [subject, setSubject] = useState('')
	const [description, setDescription] = useState('')
	const [fromDate, setFromDate] = useState('')
	const [toDate, setToDate] = useState('')
	const fromRef = useRef<HTMLInputElement | null>(null)
	const toRef = useRef<HTMLInputElement | null>(null)

const [items, setItems] = useState<any[]>([])
const [view, setView] = useState<any | null>(null)
useEffect(() => { load() }, [])

async function load() {
    const email = localStorage.getItem('demoEmail')
    if (isDemoFirebase && email) setDemoEmail(email)
    const { data } = await api.get('/api/grievances')
    setItems(data?.items || [])
}

const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!category || !subCategory || !subject || !description) {
        alert('Please fill all required fields (*)')
        return
    }
    await api.post('/api/grievances', { category, subCategory, location, placeName, subject, description, fromDate, toDate })
    setOpen(false)
    setCategory(''); setSubCategory(''); setLocation(''); setOtherLocation(false); setPlaceName(''); setSubject(''); setDescription(''); setFromDate(''); setToDate('')
    await load()
}
	return (
		<div className="bg-white rounded-md shadow-sm border">
			<div className="flex items-center justify-between px-4 py-2 bg-blue-700 text-white rounded-t-md">
				<h3 className="font-semibold">Complaint List</h3>
				<button onClick={() => setOpen(true)} className="text-sm bg-white text-blue-700 hover:bg-gray-100 rounded px-3 py-1">+Add New</button>
			</div>
			<div className="overflow-x-auto">
				<table className="min-w-[1200px] w-full text-sm">
					<thead>
						<tr className="bg-gray-50 text-gray-700">
							<th className="text-left px-3 py-2 border-b">#</th>
							<th className="text-left px-3 py-2 border-b">Grievance Id</th>
							<th className="text-left px-3 py-2 border-b">Grievance Category Desc.</th>
							<th className="text-left px-3 py-2 border-b">Grievance Subject</th>
							<th className="text-left px-3 py-2 border-b">Grievance Done by</th>
							<th className="text-left px-3 py-2 border-b">Status</th>
							<th className="text-left px-3 py-2 border-b">Place</th>
							<th className="text-left px-3 py-2 border-b">Reason</th>
							<th className="text-left px-3 py-2 border-b">How satisfied were you with our service?</th>
							<th className="text-left px-3 py-2 border-b">Please give your valuable suggestion to improve our service</th>
							<th className="text-left px-3 py-2 border-b">Available<br/><span className="text-[10px] text-gray-500">From Date</span> <span className="text-[10px] text-gray-500">To Date</span></th>
							<th className="text-left px-3 py-2 border-b">Actions</th>
						</tr>
					</thead>
                    <tbody>
                        {items.map((it, idx) => (
                            <tr key={it.id}>
                                <td className="px-3 py-2 border-b">{idx+1}</td>
                                <td className="px-3 py-2 border-b">{it.id.substring(0,8)}...</td>
                                <td className="px-3 py-2 border-b">{it.category}</td>
                                <td className="px-3 py-2 border-b">{it.subject}</td>
                                <td className="px-3 py-2 border-b">Student</td>
                                <td className="px-3 py-2 border-b">
                                    <span className={`px-2 py-1 text-xs rounded ${
                                        it.status === 'open' 
                                            ? 'bg-orange-100 text-orange-800' 
                                            : 'bg-green-100 text-green-800'
                                    }`}>
                                        {it.status === 'open' ? 'Open' : 'Closed'}
                                    </span>
                                </td>
                                <td className="px-3 py-2 border-b">{it.location || '-'}</td>
                                <td className="px-3 py-2 border-b">{it.description.slice(0,40)}...</td>
                                <td className="px-3 py-2 border-b">-</td>
                                <td className="px-3 py-2 border-b">-</td>
                                <td className="px-3 py-2 border-b">{it.fromDate || '-'} {it.toDate ? ' - ' + it.toDate : ''}</td>
                                <td className="px-3 py-2 border-b">
                                    <button onClick={() => setView(it)} title="View" className="text-blue-700 hover:text-blue-900" aria-label="View">
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 inline-block">
                                            <path d="M12 5c-7 0-10 7-10 7s3 7 10 7 10-7 10-7-3-7-10-7zm0 12a5 5 0 1 1 0-10 5 5 0 0 1 0 10z"/>
                                        </svg>
                                    </button>
                                    <button onClick={async () => { await api.delete(`/api/grievances/${it.id}`); await load() }} title="Delete" className="ml-3 text-red-600 hover:text-red-800" aria-label="Delete">
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 inline-block">
                                            <path d="M9 3a1 1 0 0 0-1 1v1H4a1 1 0 1 0 0 2h1v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7h1a1 1 0 1 0 0-2h-4V4a1 1 0 0 0-1-1H9zm2 2h4v1h-4V5zm-3 4a1 1 0 1 1 2 0v8a1 1 0 1 1-2 0V9zm6 0a1 1 0 1 1 2 0v8a1 1 0 1 1-2 0V9z"/>
                                        </svg>
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
				</table>
			</div>

            {open && (
				<div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50">
					<div className="mt-10 w-full max-w-5xl rounded-md bg-white shadow-lg border">
						<div className="flex items-center justify-between px-4 py-2 bg-blue-700 text-white rounded-t-md">
							<h3 className="font-semibold">New Complaint</h3>
						</div>
						<form onSubmit={onSubmit} className="p-4 space-y-4 text-sm">
							<div>
								<label className="block font-medium">*Select Grievance Category</label>
								<select value={category} onChange={(e) => setCategory(e.target.value)} className="mt-1 w-full border rounded px-3 py-2 bg-white">
									<option value="">-- Select Category --</option>
									<option value="General">General</option>
									<option value="IT">IT</option>
								</select>
							</div>
							<div>
								<label className="block font-medium">*Sub Category</label>
								<select value={subCategory} onChange={(e) => setSubCategory(e.target.value)} className="mt-1 w-full border rounded px-3 py-2 bg-white">
									<option value="">-- Select Sub Category --</option>
									<option value="Network">Network</option>
									<option value="Facility">Facility</option>
								</select>
							</div>
							<div>
								<label className="block font-medium">Location</label>
								<div className="flex items-center gap-3">
									<input value={location} onChange={(e) => setLocation(e.target.value)} className="mt-1 w-full border rounded px-3 py-2 bg-white" placeholder="Start typing location" />
									<label className="flex items-center gap-2 text-xs"><input checked={otherLocation} onChange={(e) => setOtherLocation(e.target.checked)} type="checkbox" /> Other Location</label>
								</div>
							</div>
							<div>
								<label className="block font-medium">Place / Item Name</label>
								<input value={placeName} onChange={(e) => setPlaceName(e.target.value)} className="mt-1 w-full border rounded px-3 py-2 bg-white" placeholder="Enter the Place / Item Name" />
							</div>
							<div>
								<label className="block font-medium">*Subject</label>
								<input value={subject} onChange={(e) => setSubject(e.target.value)} className="mt-1 w-full border rounded px-3 py-2 bg-white" placeholder="Enter the Subject" />
							</div>
							<div>
								<label className="block font-medium">*Description</label>
								<textarea value={description} onChange={(e) => setDescription(e.target.value)} className="mt-1 w-full border rounded px-3 py-2 bg-white" placeholder="Enter Complaint Description" rows={3} />
							</div>
							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								<div>
									<label className="block font-medium">Available From Date</label>
									<div className="relative">
                                    <input ref={fromRef} type="datetime-local" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="mt-1 w-full border rounded px-3 py-2 pr-10 bg-white" />
                                    <button aria-label="Open from date picker" type="button" onClick={() => fromRef.current?.showPicker?.() || fromRef.current?.focus()} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-800">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                                            <line x1="16" y1="2" x2="16" y2="6"></line>
                                            <line x1="8" y1="2" x2="8" y2="6"></line>
                                            <line x1="3" y1="10" x2="21" y2="10"></line>
                                        </svg>
                                    </button>
									</div>
								</div>
								<div>
									<label className="block font-medium">Available To Date</label>
									<div className="relative">
                                    <input ref={toRef} type="datetime-local" value={toDate} onChange={(e) => setToDate(e.target.value)} className="mt-1 w-full border rounded px-3 py-2 pr-10 bg-white" />
                                    <button aria-label="Open to date picker" type="button" onClick={() => toRef.current?.showPicker?.() || toRef.current?.focus()} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-800">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                                            <line x1="16" y1="2" x2="16" y2="6"></line>
                                            <line x1="8" y1="2" x2="8" y2="6"></line>
                                            <line x1="3" y1="10" x2="21" y2="10"></line>
                                        </svg>
                                    </button>
									</div>
								</div>
							</div>
							<div className="flex items-center gap-3 pt-2">
								<button type="submit" className="bg-blue-700 text-white rounded px-4 py-2">Submit</button>
								<button type="button" onClick={() => setOpen(false)} className="bg-pink-600 text-white rounded px-4 py-2">Cancel</button>
							</div>
						</form>
					</div>
				</div>
			)}

            {/* View modal */}
            {view && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className="w-full max-w-3xl rounded-md bg-white shadow-lg border m-4">
                        <div className="flex items-center justify-between px-4 py-2 bg-blue-700 text-white rounded-t-md">
                            <h3 className="font-semibold">Grievance Details</h3>
                            <button onClick={() => setView(null)} className="text-white">✕</button>
                        </div>
                        <div className="p-4 text-sm">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div><div className="text-xs text-gray-600">Category</div><div className="font-medium">{view.category}</div></div>
                                <div><div className="text-xs text-gray-600">Sub Category</div><div className="font-medium">{view.subCategory}</div></div>
                                <div><div className="text-xs text-gray-600">Subject</div><div className="font-medium">{view.subject}</div></div>
                                <div><div className="text-xs text-gray-600">Place</div><div className="font-medium">{view.location || '-'}</div></div>
                                <div className="md:col-span-2"><div className="text-xs text-gray-600">Description</div><div className="font-medium whitespace-pre-wrap">{view.description}</div></div>
                                <div><div className="text-xs text-gray-600">Available From</div><div className="font-medium">{view.fromDate || '-'}</div></div>
                                <div><div className="text-xs text-gray-600">Available To</div><div className="font-medium">{view.toDate || '-'}</div></div>
                                <div><div className="text-xs text-gray-600">Status</div><div className="font-medium">
                                    <span className={`px-2 py-1 text-xs rounded ${
                                        view.status === 'open' 
                                            ? 'bg-orange-100 text-orange-800' 
                                            : 'bg-green-100 text-green-800'
                                    }`}>
                                        {view.status === 'open' ? 'Open' : 'Closed'}
                                    </span>
                                </div></div>
                            </div>
                        </div>
                        <div className="px-4 py-2 border-t flex items-center justify-end">
                            <button onClick={async () => { await api.delete(`/api/grievances/${view.id}`); setView(null); await load() }} className="px-3 py-1.5 rounded bg-rose-600 text-white">Delete</button>
                        </div>
                    </div>
                </div>
            )}
		</div>
	)
}

