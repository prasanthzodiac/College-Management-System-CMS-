import React from 'react'
import { toast } from 'sonner'
import api, { setDemoEmail } from '../../lib/api'
import { isDemoFirebase } from '../../services/firebase'

export default function Circular() {
  const [tab, setTab] = React.useState<'active' | 'past'>('active')
  const [circulars, setCirculars] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(true)

  const loadCirculars = React.useCallback(async () => {
    try {
      setLoading(true)
      const email = localStorage.getItem('demoEmail')
      if (isDemoFirebase && email) setDemoEmail(email)
      const { data } = await api.get('/api/circulars')
      setCirculars(data?.circulars || [])
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

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '—'
    const date = new Date(`${dateStr}T00:00:00`)
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
  }

  const now = new Date()
  const active = circulars.filter((c) => new Date(`${c.issuedDate}T00:00:00`) >= now)
  const past = circulars.filter((c) => new Date(`${c.issuedDate}T00:00:00`) < now)
  const data = tab === 'active' ? active : past

  return (
    <div className="p-4">
      <div className="rounded-md border bg-white">
        <div className="flex items-center justify-between px-4 py-3 border-b bg-zinc-50">
          <h2 className="text-lg font-semibold">Circulars</h2>
          <div className="flex items-center gap-2 text-sm">
            <button onClick={() => setTab('active')} className={`px-3 py-1.5 rounded ${tab === 'active' ? 'bg-blue-700 text-white' : 'bg-white border'}`}>
              Active Circular
            </button>
            <button onClick={() => setTab('past')} className={`px-3 py-1.5 rounded ${tab === 'past' ? 'bg-blue-700 text-white' : 'bg-white border'}`}>
              Past Circular
            </button>
            <button onClick={loadCirculars} className="px-3 py-1.5 rounded border hover:bg-gray-100">Refresh</button>
          </div>
        </div>

        <div className="p-4">
          <div className="rounded border">
            <div className="px-4 py-2 border-b text-sm font-medium">Circular</div>
            <div className="p-4 text-sm">
              {loading ? (
                <div className="text-center text-gray-500">Loading...</div>
              ) : data.length === 0 ? (
                <div className="text-blue-700">Information! No circular details available.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-[700px] w-full text-left">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="px-3 py-2 border-b">#</th>
                        <th className="px-3 py-2 border-b">Title</th>
                        <th className="px-3 py-2 border-b">Date</th>
                        <th className="px-3 py-2 border-b">Department</th>
                        <th className="px-3 py-2 border-b">Circular No.</th>
                        <th className="px-3 py-2 border-b">Attachment</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.map((circular: any, i: number) => (
                        <tr key={circular.id} className="border-b">
                          <td className="px-3 py-2">{i + 1}</td>
                          <td className="px-3 py-2 font-medium">{circular.title}</td>
                          <td className="px-3 py-2">{formatDate(circular.issuedDate)}</td>
                          <td className="px-3 py-2">{circular.department || '—'}</td>
                          <td className="px-3 py-2">{circular.circularNo || '—'}</td>
                          <td className="px-3 py-2">{circular.attachmentUrl ? <a className="text-blue-600 underline" href={circular.attachmentUrl} target="_blank" rel="noreferrer">View</a> : '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

