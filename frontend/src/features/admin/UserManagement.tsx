import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import api, { setDemoEmail } from '../../lib/api'
import { isDemoFirebase } from '../../services/firebase'
import DataTable, { Column } from '../../components/DataTable'

type User = {
    id: string
    email: string
    name: string | null
    role: 'student' | 'staff' | 'admin'
    photoUrl: string | null
    createdAt: string
}

export function UserManagement({ role }: { role: 'student' | 'staff' }) {
    const [users, setUsers] = useState<User[]>([])
    const [loading, setLoading] = useState(false)
    const [showCreateModal, setShowCreateModal] = useState(false)
    const [creating, setCreating] = useState(false)
    const [form, setForm] = useState({ name: '', email: '' })
    const [deletingId, setDeletingId] = useState<string | null>(null)
    const [searchParams] = useSearchParams()
    const searchQuery = searchParams.get('search') || ''

    useEffect(() => {
        loadUsers()
    }, [role])

    const loadUsers = async () => {
        setLoading(true)
        try {
            const email = localStorage.getItem('demoEmail')
            if (isDemoFirebase && email) setDemoEmail(email)
            const { data } = await api.get('/api/auth/all')
            const allUsers = (data?.users || []) as User[]
            const filtered = allUsers.filter(u => u.role === role)
            let result = filtered
            if (searchQuery) {
                const query = searchQuery.toLowerCase()
                result = filtered.filter(u => 
                    u.email.toLowerCase().includes(query) ||
                    (u.name || '').toLowerCase().includes(query) ||
                    u.id.toLowerCase().includes(query)
                )
            }
            setUsers(result)
        } catch (err: any) {
            toast.error(err?.response?.data?.error || 'Failed to load users')
            setUsers([])
        } finally {
            setLoading(false)
        }
    }

    const onSubmitCreate = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!form.email) {
            toast.error('Email is required')
            return
        }
        try {
            setCreating(true)
            const email = localStorage.getItem('demoEmail')
            if (isDemoFirebase && email) setDemoEmail(email)
            await api.post('/api/auth/create', {
                email: form.email,
                name: form.name || undefined,
                role
            })
            toast.success(`${role === 'student' ? 'Student' : 'Staff'} created successfully`)
            setForm({ name: '', email: '' })
            setShowCreateModal(false)
            loadUsers()
        } catch (err: any) {
            toast.error(err?.response?.data?.error || 'Failed to create user')
        } finally {
            setCreating(false)
        }
    }

    const handleDelete = async (id: string) => {
        if (!window.confirm('Are you sure you want to remove this user?')) return
        try {
            setDeletingId(id)
            const email = localStorage.getItem('demoEmail')
            if (isDemoFirebase && email) setDemoEmail(email)
            await api.delete(`/api/auth/${id}`)
            toast.success('User removed')
            loadUsers()
        } catch (err: any) {
            toast.error(err?.response?.data?.error || 'Failed to remove user')
        } finally {
            setDeletingId(null)
        }
    }

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        })
    }

    const columns: Column<User>[] = [
        {
            key: 'id',
            header: 'ID',
            render: (row) => <span className="text-xs font-mono">{row.id.substring(0, 8)}...</span>
        },
        {
            key: 'name',
            header: 'Name',
            render: (row) => (
                <div className="flex items-center gap-2">
                    {row.photoUrl ? (
                        <img src={row.photoUrl} alt={row.name || ''} className="w-8 h-8 rounded-full" />
                    ) : (
                        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs">
                            {(row.name || row.email).charAt(0).toUpperCase()}
                        </div>
                    )}
                    <div>
                        <div className="font-medium">{row.name || 'N/A'}</div>
                        <div className="text-xs text-gray-500">{row.email}</div>
                    </div>
                </div>
            )
        },
        {
            key: 'role',
            header: 'Role',
            render: (row) => (
                <span className={`px-2 py-1 text-xs rounded ${
                    row.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                    row.role === 'staff' ? 'bg-blue-100 text-blue-800' :
                    'bg-green-100 text-green-800'
                }`}>
                    {row.role.toUpperCase()}
                </span>
            )
        },
        {
            key: 'createdAt',
            header: 'Created',
            render: (row) => formatDate(row.createdAt)
        },
        {
            key: 'actions',
            header: 'Actions',
            sortable: false,
            render: (row) => (
                <div className="flex justify-end">
                    <button
                        onClick={() => handleDelete(row.id)}
                        disabled={deletingId === row.id}
                        className="text-xs text-red-600 hover:underline disabled:opacity-50"
                    >
                        {deletingId === row.id ? 'Removing...' : 'Remove'}
                    </button>
                </div>
            )
        }
    ]

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h2 className="text-xl font-semibold">{role === 'student' ? 'Student' : 'Staff'} Management</h2>
                    <p className="text-sm text-gray-600">View and manage {role === 'student' ? 'students' : 'staff members'}</p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="px-3 py-1.5 text-sm rounded bg-blue-600 text-white hover:bg-blue-700"
                    >
                        Add {role === 'student' ? 'Student' : 'Staff'}
                    </button>
                    <button
                        onClick={loadUsers}
                        disabled={loading}
                        className="px-3 py-1.5 text-sm rounded border hover:bg-gray-100 disabled:opacity-50"
                    >
                        {loading ? 'Loading...' : 'Refresh'}
                    </button>
                </div>
            </div>

            {searchQuery && (
                <div className="text-sm text-gray-600">
                    Showing results for: <span className="font-medium">"{searchQuery}"</span>
                </div>
            )}

            <DataTable
                title={`${role === 'student' ? 'Students' : 'Staff Members'}`}
                columns={columns}
                rows={users}
                pageSize={10}
            />

            {showCreateModal && (
                <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-md shadow-lg w-full max-w-md">
                        <div className="px-4 py-3 border-b flex items-center justify-between">
                            <h3 className="text-sm font-semibold">Add {role === 'student' ? 'Student' : 'Staff Member'}</h3>
                            <button onClick={() => setShowCreateModal(false)} className="text-gray-500 hover:text-gray-700">✕</button>
                        </div>
                        <form onSubmit={onSubmitCreate} className="p-4 space-y-4 text-sm">
                            <div>
                                <label className="block text-xs font-medium text-gray-600 uppercase tracking-wide">Full Name</label>
                                <input
                                    type="text"
                                    value={form.name}
                                    onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                                    placeholder="Enter full name"
                                    className="mt-1 w-full border rounded px-3 py-2"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-600 uppercase tracking-wide">Email *</label>
                                <input
                                    type="email"
                                    value={form.email}
                                    onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                                    placeholder={`e.g. ${role === 'student' ? 'student11@college.edu' : 'staff6@college.edu'}`}
                                    className="mt-1 w-full border rounded px-3 py-2"
                                    required
                                />
                            </div>
                            <div className="flex justify-end gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowCreateModal(false)}
                                    className="px-4 py-2 rounded border hover:bg-gray-100"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={creating}
                                    className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                                >
                                    {creating ? 'Saving...' : 'Save'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}

