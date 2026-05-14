import React, { useEffect, useRef, useState } from 'react'
import api, { setDemoEmail } from '../../lib/api'
import { isDemoFirebase } from '../../services/firebase'

type LeaveItem = {
    id: string
    fromDate: string
    toDate: string | null
    session: 'FN' | 'AN' | 'Full Day'
    type: string
    reason: string | null
    halfday: boolean
    hourly: boolean
    status: 'pending' | 'approved' | 'rejected'
    createdAt?: string
}

export default function LeaveApply() {
    const [items, setItems] = useState<LeaveItem[]>([])
    const [loading, setLoading] = useState(false)
    const [showForm, setShowForm] = useState(false as boolean)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [form, setForm] = useState({ from: '', to: '', session: '', type: '', reason: '', halfday: false, hourly: false })
    const fromRef = useRef<HTMLInputElement | null>(null)
    const toRef = useRef<HTMLInputElement | null>(null)

    const load = async () => {
        setLoading(true)
        try {
            // ensure demo header if present
            const email = localStorage.getItem('demoEmail')
            if (isDemoFirebase && email) setDemoEmail(email)
            const { data } = await api.get('/api/leaves')
            setItems(data?.items || [])
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => { load() }, [])

    const resetForm = () => setForm({ from: '', to: '', session: '', type: '', reason: '', halfday: false, hourly: false })

    const onApply = async () => {
        if (!form.from || !form.type || !form.session) return
        const payload = { fromDate: form.from, toDate: form.to || null, session: form.session as any, type: form.type, reason: form.reason, halfday: form.halfday, hourly: form.hourly }
        if (editingId) {
            await api.put(`/api/leaves/${editingId}`, payload)
        } else {
            await api.post('/api/leaves', payload)
        }
        setShowForm(false)
        setEditingId(null)
        resetForm()
        await load()
    }

    const onEdit = (it: LeaveItem) => {
        setEditingId(it.id)
        setForm({ from: it.fromDate, to: it.toDate || '', session: it.session, type: it.type, reason: it.reason || '', halfday: it.halfday, hourly: it.hourly })
        setShowForm(true)
    }

    const onDelete = async (id: string) => {
        await api.delete(`/api/leaves/${id}`)
        await load()
    }

    return (
        <div className="p-4">
            <div className="rounded-md border bg-white">
                {/* Title */}
                <div className="px-4 pt-3 text-lg font-semibold">Leave Apply</div>

                {/* Blue header bar */}
                <div className="flex items-center justify-between bg-blue-700 text-white px-4 py-2 text-sm font-medium mt-2">
                    <div>Leave Apply</div>
                    <button onClick={() => setShowForm(true)} className="px-2 py-1 border border-white/40 rounded">+ Add New</button>
                </div>

                {/* Add New Form */}
                {showForm && (
                    <div className="px-4 pt-4">
                        <div className="rounded border p-3 text-sm">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-xs font-medium mb-1">*From Date :</label>
                                    <div className="relative">
                                        <input ref={fromRef} type="date" value={form.from} onChange={e => setForm({ ...form, from: e.target.value })} className="w-full border rounded px-3 py-2 pr-10 bg-white" />
                                        <button aria-label="Open from date picker" type="button" onClick={() => (fromRef.current as any)?.showPicker?.() || fromRef.current?.focus()} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-800">
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
                                    <label className="block text-xs font-medium mb-1">To Date :</label>
                                    <div className="relative">
                                        <input ref={toRef} type="date" value={form.to} onChange={e => setForm({ ...form, to: e.target.value })} className="w-full border rounded px-3 py-2 pr-10 bg-white" />
                                        <button aria-label="Open to date picker" type="button" onClick={() => (toRef.current as any)?.showPicker?.() || toRef.current?.focus()} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-800">
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
                                    <label className="block text-xs font-medium mb-1">*Leave Type :</label>
                                    <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} className="w-full border rounded px-3 py-2 bg-white">
                                        <option value="">--Leave Type--</option>
                                        <option>Leave</option>
                                        <option>Medical</option>
                                        <option>OD</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium mb-1">* Session :</label>
                                    <select value={form.session} onChange={e => setForm({ ...form, session: e.target.value })} className="w-full border rounded px-3 py-2 bg-white">
                                        <option value="">-- Choose Session --</option>
                                        <option>FN</option>
                                        <option>AN</option>
                                        <option>Full Day</option>
                                    </select>
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-medium mb-1">Reason :</label>
                                    <input type="text" value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })} placeholder="Reasons" className="w-full border rounded px-3 py-2 bg-white" />
                                </div>
                                <div className="flex items-center gap-6 md:col-span-3">
                                    <label className="inline-flex items-center gap-2 text-xs">
                                        <input type="checkbox" checked={form.halfday} onChange={e => setForm({ ...form, halfday: e.target.checked })} />
                                        Is halfday?
                                    </label>
                                    <label className="inline-flex items-center gap-2 text-xs">
                                        <input type="checkbox" checked={form.hourly} onChange={e => setForm({ ...form, hourly: e.target.checked })} />
                                        Is Hourly?
                                    </label>
                                </div>
                            </div>
                            <div className="mt-4 flex items-center gap-2">
                                <button onClick={onApply} className="px-3 py-1.5 rounded bg-blue-700 text-white">{editingId ? 'Update' : 'Apply'}</button>
                                <button onClick={resetForm} className="px-3 py-1.5 rounded border">Clear</button>
                                <button onClick={() => setShowForm(false)} className="px-3 py-1.5 rounded bg-rose-600 text-white">Cancel</button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Table */}
                <div className="p-4">
                    <div className="rounded border">
                        <div className="overflow-x-auto">
                            <table className="min-w-[900px] w-full text-left text-sm">
                                <thead>
                                    <tr className="bg-gray-50">
                                        <th className="px-3 py-2 border-b">S.No.</th>
                                        <th className="px-3 py-2 border-b">Requested Date</th>
                                        <th className="px-3 py-2 border-b">Leave Type</th>
                                        <th className="px-3 py-2 border-b">Details</th>
                                        <th className="px-3 py-2 border-b">Reason</th>
                                        <th className="px-3 py-2 border-b">Approved Status</th>
                                        <th className="px-3 py-2 border-b">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {items.map((r, i) => (
                                        <tr key={i}>
                                            <td className="px-3 py-2 border-b">{i+1}</td>
                                            <td className="px-3 py-2 border-b">{new Date(r.createdAt || r.fromDate).toLocaleDateString('en-GB')}</td>
                                            <td className="px-3 py-2 border-b">{r.type}</td>
                                            <td className="px-3 py-2 border-b">{r.fromDate}{r.toDate ? ` → ${r.toDate}` : ''} ({r.session})</td>
                                            <td className="px-3 py-2 border-b">{r.reason || '—'}</td>
                                            <td className="px-3 py-2 border-b">
                                                <span className={`px-2 py-1 text-xs rounded ${
                                                    r.status === 'pending' 
                                                        ? 'bg-yellow-100 text-yellow-800' 
                                                        : r.status === 'approved'
                                                        ? 'bg-green-100 text-green-800'
                                                        : 'bg-red-100 text-red-800'
                                                }`}>
                                                    {r.status === 'pending' ? 'Pending' : r.status === 'approved' ? 'Approved' : 'Rejected'}
                                                </span>
                                            </td>
                                            <td className="px-3 py-2 border-b">
                                                <button onClick={() => onEdit(r)} title="Edit" className="mr-2 text-blue-700">✎</button>
                                                <button onClick={() => onDelete(r.id)} title="Delete" className="text-red-600">🗑</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}


