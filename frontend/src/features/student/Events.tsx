import React from 'react'
import { toast } from 'sonner'
import api, { setDemoEmail } from '../../lib/api'
import { isDemoFirebase } from '../../services/firebase'
import { EventsTable, type EventRecord } from '../../components/EventsTable'

export default function Events() {
  const [events, setEvents] = React.useState<EventRecord[]>([])
  const [loading, setLoading] = React.useState(true)

  const loadEvents = React.useCallback(async () => {
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
    loadEvents()
  }, [loadEvents])

  return (
    <div className="p-4">
      <div className="rounded-md border bg-white">
        <div className="px-4 pt-3 text-sm">
          <h2 className="text-lg font-semibold">Events</h2>
          <div className="text-[12px] opacity-70">Stay updated on college events</div>
        </div>

        <div className="mt-2 bg-blue-700 text-white px-4 py-2 text-sm font-medium flex items-center justify-between">
          <span>Events</span>
          <button onClick={loadEvents} className="text-xs bg-white/15 hover:bg-white/25 rounded px-3 py-1">
            Refresh
          </button>
        </div>

        <div className="p-4">
          {loading ? (
            <div className="text-center text-gray-500 py-10">Loading events...</div>
          ) : (
            <EventsTable events={events} />
          )}
        </div>
      </div>
    </div>
  )
}

