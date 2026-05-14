import React from 'react'
import { toast } from 'sonner'
import api, { setDemoEmail } from '../../lib/api'
import { isDemoFirebase } from '../../services/firebase'
import { CircularsTable, type CircularRecord } from '../../components/CircularsTable'

const initialForm = {
  circularNo: '',
  title: '',
  description: '',
  department: '',
  issuedDate: '',
  attachmentUrl: ''
}

export function AdminCircularPage() {
  const [form, setForm] = React.useState(initialForm)
  const [circulars, setCirculars] = React.useState<CircularRecord[]>([])
  const [loading, setLoading] = React.useState(true)
  const [saving, setSaving] = React.useState(false)

  const loadCirculars = React.useCallback(async () => {
    try {
      setLoading(true)
      const email = localStorage.getItem('demoEmail')
      if (isDemoFirebase && email) setDemoEmail(email)
      const { data } = await api.get('/api/circulars')
      setCirculars((data?.circulars || []).map((c: any) => ({
        id: c.id,
        circularNo: c.circularNo ?? null,
        title: c.title,
        description: c.description ?? null,
        department: c.department ?? null,
        issuedDate: c.issuedDate,
        attachmentUrl: c.attachmentUrl ?? null,
        createdBy: c.createdBy ?? null
      })))
    } catch (error: any) {
      toast.error(error?.response?.data?.error || 'Failed to load circulars')
      setCirculars([])
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    loadCirculars()
  }, [loadCirculars])

  const onChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title || !form.issuedDate) {
      toast.error('Title and issued date are required')
      return
    }
    try {
      setSaving(true)
      const email = localStorage.getItem('demoEmail')
      if (isDemoFirebase && email) setDemoEmail(email)
      await api.post('/api/circulars', {
        circularNo: form.circularNo || null,
        title: form.title,
        description: form.description || null,
        department: form.department || null,
        issuedDate: form.issuedDate,
        attachmentUrl: form.attachmentUrl || null
      })
      toast.success('Circular created')
      setForm(initialForm)
      loadCirculars()
    } catch (error: any) {
      toast.error(error?.response?.data?.error || 'Failed to create circular')
    } finally {
      setSaving(false)
    }
  }

  const onDelete = async (circular: CircularRecord) => {
    if (!window.confirm(`Delete circular "${circular.title}"?`)) return
    try {
      const email = localStorage.getItem('demoEmail')
      if (isDemoFirebase && email) setDemoEmail(email)
      await api.delete(`/api/circulars/${circular.id}`)
      toast.success('Circular deleted')
      loadCirculars()
    } catch (error: any) {
      toast.error(error?.response?.data?.error || 'Failed to delete circular')
    }
  }

  return (
    <div className="space-y-6">
      <section className="border rounded-md bg-white">
        <div className="px-4 py-3 border-b bg-gray-50">
          <h2 className="text-sm font-medium">Create Circular</h2>
          <p className="text-xs text-gray-500">Publish circulars for staff and students</p>
        </div>
        <form onSubmit={onSubmit} className="p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Circular No.</label>
              <input name="circularNo" value={form.circularNo} onChange={onChange} className="mt-1 w-full border rounded px-3 py-2 text-sm bg-white" placeholder="CIR/2025/001" />
            </div>
            <div>
              <label className="text-sm font-medium">Department</label>
              <input name="department" value={form.department} onChange={onChange} className="mt-1 w-full border rounded px-3 py-2 text-sm bg-white" placeholder="Administration" />
            </div>
            <div>
              <label className="text-sm font-medium">Title *</label>
              <input name="title" value={form.title} onChange={onChange} className="mt-1 w-full border rounded px-3 py-2 text-sm bg-white" placeholder="Circular title" />
            </div>
            <div>
              <label className="text-sm font-medium">Issued Date *</label>
              <input type="date" name="issuedDate" value={form.issuedDate} onChange={onChange} className="mt-1 w-full border rounded px-3 py-2 text-sm bg-white" />
            </div>
            <div>
              <label className="text-sm font-medium">Attachment URL</label>
              <input name="attachmentUrl" value={form.attachmentUrl} onChange={onChange} className="mt-1 w-full border rounded px-3 py-2 text-sm bg-white" placeholder="https://..." />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium">Description</label>
            <textarea name="description" value={form.description} onChange={onChange} className="mt-1 w-full border rounded px-3 py-2 text-sm bg-white" rows={3} placeholder="Brief description" />
          </div>
          <div className="flex justify-end">
            <button type="submit" disabled={saving} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50">
              {saving ? 'Saving...' : 'Create Circular'}
            </button>
          </div>
        </form>
      </section>

      <section className="border rounded-md bg-white">
        <div className="px-4 py-3 border-b bg-gray-50 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-medium">All Circulars</h2>
            <p className="text-xs text-gray-500">Visible to staff and students</p>
          </div>
          <button onClick={loadCirculars} className="text-xs px-3 py-1.5 border rounded hover:bg-gray-100">Refresh</button>
        </div>
        <div className="p-4">
          {loading ? (
            <div className="text-center text-gray-500 py-6">Loading circulars...</div>
          ) : (
            <CircularsTable
              circulars={circulars}
              renderActions={(circular) => (
                <button onClick={() => onDelete(circular)} className="text-xs text-red-600 hover:underline">
                  Delete
                </button>
              )}
            />
          )}
        </div>
      </section>
    </div>
  )
}


