import React from 'react'

export type CircularRecord = {
  id: string
  circularNo: string | null
  title: string
  description: string | null
  department: string | null
  issuedDate: string
  attachmentUrl: string | null
  createdBy: string | null
}

export function CircularsTable({
  circulars,
  renderActions
}: {
  circulars: CircularRecord[]
  renderActions?: (circular: CircularRecord) => React.ReactNode
}) {
  const formatDate = (dateStr: string) => {
    if (!dateStr) return '—'
    const date = new Date(`${dateStr}T00:00:00`)
    if (Number.isNaN(date.getTime())) return dateStr
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
  }

  return (
    <div className="rounded border overflow-x-auto">
      <table className="min-w-[1000px] w-full text-left text-sm">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-3 py-2 border-b">#</th>
            <th className="px-3 py-2 border-b">Circular No.</th>
            <th className="px-3 py-2 border-b">Title</th>
            <th className="px-3 py-2 border-b">Department</th>
            <th className="px-3 py-2 border-b">Issued Date</th>
            <th className="px-3 py-2 border-b">Attachment</th>
            <th className="px-3 py-2 border-b">Description</th>
            {renderActions && <th className="px-3 py-2 border-b text-right">Actions</th>}
          </tr>
        </thead>
        <tbody>
          {circulars.length === 0 ? (
            <tr>
              <td colSpan={renderActions ? 8 : 7} className="px-3 py-4 text-center text-gray-500">No circulars available.</td>
            </tr>
          ) : (
            circulars.map((circular, index) => (
              <tr key={circular.id} className="border-b align-top hover:bg-gray-50">
                <td className="px-3 py-2">{index + 1}.</td>
                <td className="px-3 py-2">{circular.circularNo || '—'}</td>
                <td className="px-3 py-2 font-medium">{circular.title}</td>
                <td className="px-3 py-2">{circular.department || '—'}</td>
                <td className="px-3 py-2">{formatDate(circular.issuedDate)}</td>
                <td className="px-3 py-2">{circular.attachmentUrl ? <a className="text-blue-600 underline" href={circular.attachmentUrl} target="_blank" rel="noreferrer">View</a> : '—'}</td>
                <td className="px-3 py-2" style={{ maxWidth: 320, whiteSpace: 'pre-wrap' }}>{circular.description || '—'}</td>
                {renderActions && <td className="px-3 py-2 text-right">{renderActions(circular)}</td>}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}


