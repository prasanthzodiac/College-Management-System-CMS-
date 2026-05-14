import React from 'react'
import { toast } from 'sonner'
import api, { setDemoEmail } from '../../lib/api'
import { isDemoFirebase } from '../../services/firebase'

export type InternalMarkRecord = {
  id: string
  studentId: string
  subjectId: string
  assessmentName: string
  maxMark: number
  obtainedMark: number
  recordedAt: string
  remarks?: string | null
  subject?: {
    id: string
    code: string
    name: string
    section?: string
  }
  student?: {
    id: string
    name: string | null
    email: string
    rollNumber?: string | null
  }
  recordedBy?: {
    id: string
    name: string | null
    email: string
  }
}

export default function InternalMarkReport() {
  const [marks, setMarks] = React.useState<InternalMarkRecord[]>([])
  const [loading, setLoading] = React.useState(true)

  const loadMarks = React.useCallback(async () => {
    try {
      setLoading(true)
      const email = localStorage.getItem('demoEmail')
      if (isDemoFirebase && email) setDemoEmail(email)
      const { data } = await api.get('/api/internal-marks/mine')
      setMarks((data?.marks || []) as InternalMarkRecord[])
    } catch (error: any) {
      toast.error(error?.response?.data?.error || 'Failed to load internal marks')
      setMarks([])
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    loadMarks()
  }, [loadMarks])

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '—'
    const date = new Date(`${dateStr}T00:00:00`)
    if (Number.isNaN(date.getTime())) return dateStr
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
  }

  const totals = React.useMemo(() => {
    return marks.reduce(
      (acc, mark) => {
        acc.max += mark.maxMark || 0
        acc.obtained += mark.obtainedMark || 0
        return acc
      },
      { max: 0, obtained: 0 }
    )
  }, [marks])

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Internal Marks</h2>
          <p className="text-sm text-gray-600">Subject-wise internal assessment scores</p>
        </div>
        <button
          onClick={loadMarks}
          className="px-3 py-1.5 text-sm rounded border hover:bg-gray-100"
        >
          {loading ? 'Loading...' : 'Refresh'}
        </button>
        </div>

      <div className="rounded-md border bg-white">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading internal marks...</div>
        ) : marks.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No internal marks recorded yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-[1000px] w-full text-left text-sm">
              <thead className="bg-gray-50">
                <tr>
                    <th className="px-3 py-2 border-b">#</th>
                  <th className="px-3 py-2 border-b">Subject</th>
                  <th className="px-3 py-2 border-b">Assessment</th>
                  <th className="px-3 py-2 border-b">Recorded On</th>
                    <th className="px-3 py-2 border-b">Max Mark</th>
                  <th className="px-3 py-2 border-b">Obtained</th>
                    <th className="px-3 py-2 border-b">Status</th>
                  <th className="px-3 py-2 border-b">Remarks</th>
                  </tr>
                </thead>
                <tbody>
                {marks.map((mark, index) => {
                  const status = mark.obtainedMark >= mark.maxMark * 0.5 ? 'Pass' : 'Needs Improvement'
                  return (
                    <tr key={mark.id} className="border-b">
                      <td className="px-3 py-2 align-top">{index + 1}</td>
                      <td className="px-3 py-2 align-top">
                        <div className="font-medium">{mark.subject?.code || '—'}</div>
                        <div className="text-xs text-gray-500">{mark.subject?.name || '—'}</div>
                      </td>
                      <td className="px-3 py-2 align-top">
                        <div className="font-medium">{mark.assessmentName}</div>
                        {mark.recordedBy?.name && (
                          <div className="text-xs text-gray-500">Recorded by {mark.recordedBy.name}</div>
                        )}
                      </td>
                      <td className="px-3 py-2 align-top">{formatDate(mark.recordedAt)}</td>
                      <td className="px-3 py-2 align-top">{mark.maxMark}</td>
                      <td className="px-3 py-2 align-top">{mark.obtainedMark}</td>
                      <td className="px-3 py-2 align-top">
                        <span className={`px-2 py-1 text-xs rounded ${status === 'Pass' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}>
                          {status}
                        </span>
                      </td>
                      <td className="px-3 py-2 align-top" style={{ maxWidth: 260 }}>
                        {mark.remarks || '—'}
                      </td>
                    </tr>
                  )
                })}
                  <tr>
                  <td className="px-3 py-2" colSpan={4}></td>
                  <td className="px-3 py-2 font-semibold">{totals.max}</td>
                  <td className="px-3 py-2 font-semibold">{totals.obtained}</td>
                  <td className="px-3 py-2" colSpan={2}></td>
                  </tr>
                </tbody>
              </table>
          </div>
        )}
      </div>
    </div>
  )
}


