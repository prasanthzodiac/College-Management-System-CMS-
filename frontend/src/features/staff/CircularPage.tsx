import React from 'react'
import { toast } from 'sonner'
import api, { setDemoEmail } from '../../lib/api'
import { isDemoFirebase } from '../../services/firebase'
import { CircularsTable, type CircularRecord } from '../../components/CircularsTable'

export function StaffCircularPage() {
  const [circulars, setCirculars] = React.useState<CircularRecord[]>([])
  const [loading, setLoading] = React.useState(true)

  const loadCirculars = React.useCallback(async () => {
    try {
      setLoading(true)
      const email = localStorage.getItem('demoEmail')
      if (isDemoFirebase && email) setDemoEmail(email)
      const { data } = await api.get('/api/circulars')
      setCirculars((data?.circulars || []) as CircularRecord[])
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

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Circulars</h2>
          <p className="text-sm text-gray-600">Official notices and announcements</p>
        </div>
        <button
          onClick={loadCirculars}
          className="px-3 py-1.5 text-sm rounded border hover:bg-gray-100"
        >
          {loading ? 'Loading...' : 'Refresh'}
        </button>
      </div>

      {loading ? (
        <div className="border rounded-md bg-white p-6 text-center text-gray-500">Loading circulars...</div>
      ) : (
        <div className="border rounded-md bg-white p-4">
          <CircularsTable circulars={circulars} />
        </div>
      )}
    </section>
  )
}


