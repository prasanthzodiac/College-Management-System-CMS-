import React from 'react'
import { toast } from 'sonner'
import api, { setDemoEmail } from '../../lib/api'
import { isDemoFirebase } from '../../services/firebase'
import { EventsTable, type EventRecord } from '../../components/EventsTable'

const initialForm = {
  title: '',
  department: '',
  description: '',
  venue: '',
  startDate: '',
  endDate: '',
  contactName: '',
  contactEmail: '',
  contactPhone: '',
  status: '',
  attachmentUrl: ''
}

export function AdminEventsPage() {
  const [form, setForm] = React.useState(initialForm)
  const [events, setEvents] = React.useState<EventRecord[]>([])
  const [loading, setLoading] = React.useState(true)
  const [saving, setSaving] = React.useState(false)

  const fetchEvents = React.useCallback(async () => {
    try {
      setLoading(true)
      const email = localStorage.getItem('demoEmail')
      if (isDemoFirebase && email) setDemoEmail(email)
      const { data } = await api.get('/api/events')
      setEvents((data?.events || []).map((event: any) => ({
        id: event.id,
        title: event.title,
        department: event.department ?? null,
        description: event.description ?? null,
        venue: event.venue ?? null,
        startDate: event.startDate,
        endDate: event.endDate,
        contactName: event.contactName ?? null,
        contactEmail: event.contactEmail ?? null,
        contactPhone: event.contactPhone ?? null,
        status: event.status ?? null,
        attachmentUrl: event.attachmentUrl ?? null
      })))
    } catch (error: any) {
      toast.error(error?.response?.data?.error || 'Failed to load events')
      setEvents([])
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    fetchEvents()
  }, [fetchEvents])

  const onChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title || !form.startDate || !form.endDate) {
      toast.error('Title, start date and end date are required')
      return
    }
    try {
      setSaving(true)
      const email = localStorage.getItem('demoEmail')
      if (isDemoFirebase && email) setDemoEmail(email)
      await api.post('/api/events', {
        title: form.title,
        department: form.department || null,
        description: form.description || null,
        venue: form.venue || null,
        startDate: form.startDate,
        endDate: form.endDate,
        contactName: form.contactName || null,
        contactEmail: form.contactEmail || null,
        contactPhone: form.contactPhone || null,
        status: form.status || null,
        attachmentUrl: form.attachmentUrl || null
      })
      toast.success('Event created')
      setForm(initialForm)
      fetchEvents()
    } catch (error: any) {
      toast.error(error?.response?.data?.error || 'Failed to create event')
    } finally {
      setSaving(false)
    }
  }

  const onDelete = async (event: EventRecord) => {
    if (!window.confirm(`Delete event "${event.title}"?`)) return
    try {
      const email = localStorage.getItem('demoEmail')
      if (isDemoFirebase && email) setDemoEmail(email)
      await api.delete(`/api/events/${event.id}`)
      toast.success('Event deleted')
      fetchEvents()
    } catch (error: any) {
      toast.error(error?.response?.data?.error || 'Failed to delete event')
    }
  }

  return (
    <div className="space-y-6">
      <section className="border rounded-md bg-white">
        <div className="px-4 py-3 border-b bg-gray-50">
          <h2 className="text-sm font-medium">Create New Event</h2>
          <p className="text-xs text-gray-500">Publish events for staff and students</p>
        </div>
        <form onSubmit={onSubmit} className="p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Title *</label>
              <input name="title" value={form.title} onChange={onChange} className="mt-1 w-full border rounded px-3 py-2 text-sm bg-white" placeholder="Event title" />
            </div>
            <div>
              <label className="text-sm font-medium">Department</label>
              <input name="department" value={form.department} onChange={onChange} className="mt-1 w-full border rounded px-3 py-2 text-sm bg-white" placeholder="Department/Club" />
            </div>
            <div>
              <label className="text-sm font-medium">Venue</label>
              <input name="venue" value={form.venue} onChange={onChange} className="mt-1 w-full border rounded px-3 py-2 text-sm bg-white" placeholder="Auditorium" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium">Start Date *</label>
                <input type="date" name="startDate" value={form.startDate} onChange={onChange} className="mt-1 w-full border rounded px-3 py-2 text-sm bg-white" />
              </div>
              <div>
                <label className="text-sm font-medium">End Date *</label>
                <input type="date" name="endDate" value={form.endDate} onChange={onChange} className="mt-1 w-full border rounded px-3 py-2 text-sm bg-white" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium">Contact Name</label>
                <input name="contactName" value={form.contactName} onChange={onChange} className="mt-1 w-full border rounded px-3 py-2 text-sm bg-white" placeholder="Event coordinator" />
              </div>
              <div>
                <label className="text-sm font-medium">Contact Email</label>
                <input type="email" name="contactEmail" value={form.contactEmail} onChange={onChange} className="mt-1 w-full border rounded px-3 py-2 text-sm bg-white" placeholder="events@college.edu" />
              </div>
              <div>
                <label className="text-sm font-medium">Contact Phone</label>
                <input name="contactPhone" value={form.contactPhone} onChange={onChange} className="mt-1 w-full border rounded px-3 py-2 text-sm bg-white" placeholder="9999999999" />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Status</label>
              <input name="status" value={form.status} onChange={onChange} className="mt-1 w-full border rounded px-3 py-2 text-sm bg-white" placeholder="Upcoming / Completed" />
            </div>
            <div>
              <label className="text-sm font-medium">Attachment URL</label>
              <input name="attachmentUrl" value={form.attachmentUrl} onChange={onChange} className="mt-1 w-full border rounded px-3 py-2 text-sm bg-white" placeholder="https://..." />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium">Description</label>
            <textarea name="description" value={form.description} onChange={onChange} className="mt-1 w-full border rounded px-3 py-2 text-sm bg-white" rows={3} placeholder="Event highlights, agenda, etc." />
          </div>
          <div className="flex justify-end">
            <button type="submit" disabled={saving} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50">
              {saving ? 'Saving...' : 'Create Event'}
            </button>
          </div>
        </form>
      </section>

      <section className="border rounded-md bg-white">
        <div className="px-4 py-3 border-b bg-gray-50 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-medium">All Events</h2>
            <p className="text-xs text-gray-500">Visible to staff and students</p>
          </div>
          <button onClick={fetchEvents} className="text-xs px-3 py-1.5 border rounded hover:bg-gray-100">Refresh</button>
        </div>
        <div className="p-4">
          {loading ? (
            <div className="text-center text-gray-500 py-6">Loading events...</div>
          ) : (
            <EventsTable
              events={events}
              renderActions={(event) => (
                <button onClick={() => onDelete(event)} className="text-xs text-red-600 hover:underline">
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


