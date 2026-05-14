import React from 'react'

export type EventRecord = {
  id: string
  title: string
  department: string | null
  description: string | null
  venue: string | null
  startDate: string
  endDate: string
  contactName: string | null
  contactEmail: string | null
  contactPhone: string | null
  status: string | null
  attachmentUrl: string | null
}

export function EventsTable({
  events,
  renderActions
}: {
  events: EventRecord[]
  renderActions?: (event: EventRecord) => React.ReactNode
}) {
  const formatDate = (dateStr: string) => {
    if (!dateStr) return '—'
    const date = new Date(`${dateStr}T00:00:00`)
    if (Number.isNaN(date.getTime())) return dateStr
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
  }

  return (
    <div className="rounded border overflow-x-auto">
      <table className="min-w-[1100px] w-full text-left text-sm">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-3 py-2 border-b">#</th>
            <th className="px-3 py-2 border-b">Title</th>
            <th className="px-3 py-2 border-b">Department</th>
            <th className="px-3 py-2 border-b">Start Date</th>
            <th className="px-3 py-2 border-b">End Date</th>
            <th className="px-3 py-2 border-b">Venue</th>
            <th className="px-3 py-2 border-b">Contact</th>
            <th className="px-3 py-2 border-b">Email</th>
            <th className="px-3 py-2 border-b">Phone</th>
            <th className="px-3 py-2 border-b">Status</th>
            <th className="px-3 py-2 border-b">Attachment</th>
            <th className="px-3 py-2 border-b">Description</th>
            {renderActions && <th className="px-3 py-2 border-b text-right">Actions</th>}
          </tr>
        </thead>
        <tbody>
          {events.length === 0 ? (
            <tr>
              <td colSpan={renderActions ? 13 : 12} className="px-3 py-4 text-center text-gray-500">
                No events found.
              </td>
            </tr>
          ) : (
            events.map((event, index) => (
              <tr key={event.id} className="border-b align-top hover:bg-gray-50">
                <td className="px-3 py-2">{index + 1}.</td>
                <td className="px-3 py-2 font-medium">{event.title}</td>
                <td className="px-3 py-2">{event.department || '—'}</td>
                <td className="px-3 py-2">{formatDate(event.startDate)}</td>
                <td className="px-3 py-2">{formatDate(event.endDate)}</td>
                <td className="px-3 py-2">{event.venue || '—'}</td>
                <td className="px-3 py-2">{event.contactName || '—'}</td>
                <td className="px-3 py-2">{event.contactEmail || '—'}</td>
                <td className="px-3 py-2">{event.contactPhone || '—'}</td>
                <td className="px-3 py-2">{event.status || '—'}</td>
                <td className="px-3 py-2">{event.attachmentUrl ? <a className="text-blue-600 underline" href={event.attachmentUrl} target="_blank" rel="noreferrer">View</a> : '—'}</td>
                <td className="px-3 py-2" style={{ maxWidth: 320, whiteSpace: 'pre-wrap' }}>{event.description || '—'}</td>
                {renderActions && <td className="px-3 py-2 text-right">{renderActions(event)}</td>}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}


