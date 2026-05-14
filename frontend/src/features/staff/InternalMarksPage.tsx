import React from 'react'
import { toast } from 'sonner'
import api, { setDemoEmail } from '../../lib/api'
import { isDemoFirebase } from '../../services/firebase'
import type { InternalMarkRecord } from '../student/InternalMarkReport'

type SubjectOption = {
  id: string
  code: string
  name: string
  section?: string
}

export function InternalMarksPage() {
  const [subjects, setSubjects] = React.useState<SubjectOption[]>([])
  const [selectedSubject, setSelectedSubject] = React.useState('')
  const [rollNumber, setRollNumber] = React.useState('')
  const [assessmentName, setAssessmentName] = React.useState('Internal Test 1')
  const [maxMark, setMaxMark] = React.useState(50)
  const [obtainedMark, setObtainedMark] = React.useState(40)
  const [recordedAt, setRecordedAt] = React.useState(() => new Date().toISOString().split('T')[0])
  const [remarks, setRemarks] = React.useState('')
  const [marks, setMarks] = React.useState<InternalMarkRecord[]>([])
  const [studentInfo, setStudentInfo] = React.useState<{ name: string | null; email: string; rollNumber?: string | null } | null>(null)
  const [loadingSubjects, setLoadingSubjects] = React.useState(true)
  const [loadingMarks, setLoadingMarks] = React.useState(false)
  const [saving, setSaving] = React.useState(false)

  const loadSubjects = React.useCallback(async () => {
    try {
      setLoadingSubjects(true)
      const email = localStorage.getItem('demoEmail')
      if (isDemoFirebase && email) setDemoEmail(email)
      const { data } = await api.get('/api/subjects/staff/assigned/current')
      setSubjects((data?.subjects || []) as SubjectOption[])
      if ((data?.subjects || []).length > 0 && !selectedSubject) {
        setSelectedSubject(data.subjects[0].id)
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.error || 'Failed to load subjects')
      setSubjects([])
    } finally {
      setLoadingSubjects(false)
    }
  }, [selectedSubject])

  React.useEffect(() => {
    loadSubjects()
  }, [loadSubjects])

  const loadMarks = async (identifier: string) => {
    if (!identifier) return
    try {
      setLoadingMarks(true)
      const email = localStorage.getItem('demoEmail')
      if (isDemoFirebase && email) setDemoEmail(email)
      const { data } = await api.get(`/api/internal-marks/student/${encodeURIComponent(identifier)}`)
      setMarks((data?.marks || []) as InternalMarkRecord[])
      setStudentInfo(data?.student || null)
    } catch (error: any) {
      toast.error(error?.response?.data?.error || 'Failed to load student marks')
      setMarks([])
      setStudentInfo(null)
    } finally {
      setLoadingMarks(false)
    }
  }

  const onFindStudent = async () => {
    if (!rollNumber) {
      toast.warning('Enter a roll number to search')
      return
    }
    loadMarks(rollNumber)
  }

  const onCreateMark = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedSubject) {
      toast.warning('Select a subject')
      return
    }
    if (!rollNumber) {
      toast.warning('Enter a roll number')
      return
    }
    if (!assessmentName) {
      toast.warning('Enter an assessment name')
      return
    }
    if (obtainedMark > maxMark) {
      toast.warning('Obtained mark cannot exceed max mark')
      return
    }
    try {
      setSaving(true)
      const email = localStorage.getItem('demoEmail')
      if (isDemoFirebase && email) setDemoEmail(email)
      await api.post('/api/internal-marks', {
        subjectId: selectedSubject,
        rollNumber,
        assessmentName,
        maxMark: Number(maxMark),
        obtainedMark: Number(obtainedMark),
        recordedAt,
        remarks: remarks || undefined
      })
      toast.success('Internal mark recorded')
      await loadMarks(rollNumber)
      setAssessmentName('')
      setObtainedMark(0)
      setRemarks('')
    } catch (error: any) {
      toast.error(error?.response?.data?.error || 'Failed to record mark')
    } finally {
      setSaving(false)
    }
  }

  const onDeleteMark = async (id: string) => {
    if (!window.confirm('Delete this mark?')) return
    try {
      const email = localStorage.getItem('demoEmail')
      if (isDemoFirebase && email) setDemoEmail(email)
      await api.delete(`/api/internal-marks/${id}`)
      toast.success('Mark deleted')
      if (rollNumber) loadMarks(rollNumber)
    } catch (error: any) {
      toast.error(error?.response?.data?.error || 'Failed to delete mark')
    }
  }

  const formatDate = (date?: string) => {
    if (!date) return '—'
    const parsed = new Date(`${date}T00:00:00`)
    if (Number.isNaN(parsed.getTime())) return date
    return parsed.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
  }

  return (
    <div className="space-y-6">
      <section className="border rounded-md bg-white">
        <div className="px-4 py-3 border-b flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold">Record Internal Mark</h2>
            <p className="text-xs text-gray-500">Add internal assessment scores for students</p>
          </div>
          <button onClick={loadSubjects} className="text-xs px-3 py-1.5 border rounded hover:bg-gray-100" disabled={loadingSubjects}>
            {loadingSubjects ? 'Loading...' : 'Reload Subjects'}
          </button>
        </div>
        <form onSubmit={onCreateMark} className="p-4 space-y-4 text-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium uppercase text-gray-600">Subject *</label>
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="mt-1 w-full border rounded px-3 py-2 bg-white"
                required
              >
                <option value="">Select subject</option>
                {subjects.map((subject) => (
                  <option key={subject.id} value={subject.id}>
                    {subject.code} — {subject.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium uppercase text-gray-600">Roll Number *</label>
              <div className="mt-1 flex gap-2">
                <input
                  type="text"
                  value={rollNumber}
                  onChange={(e) => setRollNumber(e.target.value.toUpperCase())}
                  placeholder="21BCS001"
                  className="flex-1 border rounded px-3 py-2 bg-white"
                  required
                />
                <button type="button" onClick={onFindStudent} className="px-3 py-2 border rounded hover:bg-gray-100">
                  Find
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium uppercase text-gray-600">Assessment Name *</label>
              <input
                type="text"
                value={assessmentName}
                onChange={(e) => setAssessmentName(e.target.value)}
                className="mt-1 w-full border rounded px-3 py-2 bg-white"
                placeholder="e.g. Internal Test 1"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium uppercase text-gray-600">Recorded Date *</label>
              <input
                type="date"
                value={recordedAt}
                onChange={(e) => setRecordedAt(e.target.value)}
                className="mt-1 w-full border rounded px-3 py-2 bg-white"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium uppercase text-gray-600">Maximum Mark *</label>
              <input
                type="number"
                value={maxMark}
                min={1}
                onChange={(e) => setMaxMark(Number(e.target.value))}
                className="mt-1 w-full border rounded px-3 py-2 bg-white"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium uppercase text-gray-600">Obtained Mark *</label>
              <input
                type="number"
                value={obtainedMark}
                min={0}
                onChange={(e) => setObtainedMark(Number(e.target.value))}
                className="mt-1 w-full border rounded px-3 py-2 bg-white"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium uppercase text-gray-600">Remarks</label>
            <textarea
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              className="mt-1 w-full border rounded px-3 py-2 bg-white"
              rows={3}
              placeholder="Optional remarks"
            />
          </div>

          <div className="flex justify-end gap-2">
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50" disabled={saving}>
              {saving ? 'Saving...' : 'Save Mark'}
            </button>
          </div>
        </form>
      </section>

      <section className="border rounded-md bg-white">
        <div className="px-4 py-3 border-b flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold">Student Internal Marks</h3>
            {studentInfo ? (
              <p className="text-xs text-gray-500">{studentInfo.name || 'Unnamed'} ({studentInfo.rollNumber || rollNumber || 'N/A'})</p>
            ) : (
              <p className="text-xs text-gray-500">Search using a roll number to view marks</p>
            )}
          </div>
          <button onClick={() => rollNumber && loadMarks(rollNumber)} className="text-xs px-3 py-1.5 border rounded hover:bg-gray-100" disabled={loadingMarks || !rollNumber}>
            {loadingMarks ? 'Loading...' : 'Refresh'}
          </button>
        </div>
        {loadingMarks ? (
          <div className="p-6 text-center text-gray-500">Loading marks...</div>
        ) : marks.length === 0 ? (
          <div className="p-6 text-center text-gray-500">No marks recorded yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-[900px] w-full text-left text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 border-b">#</th>
                  <th className="px-3 py-2 border-b">Subject</th>
                  <th className="px-3 py-2 border-b">Assessment</th>
                  <th className="px-3 py-2 border-b">Recorded On</th>
                  <th className="px-3 py-2 border-b">Max</th>
                  <th className="px-3 py-2 border-b">Obtained</th>
                  <th className="px-3 py-2 border-b">Remarks</th>
                  <th className="px-3 py-2 border-b text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {marks.map((mark, index) => (
                  <tr key={mark.id} className="border-b">
                    <td className="px-3 py-2">{index + 1}</td>
                    <td className="px-3 py-2">
                      <div className="font-medium">{mark.subject?.code || '—'}</div>
                      <div className="text-xs text-gray-500">{mark.subject?.name || '—'}</div>
                    </td>
                    <td className="px-3 py-2">{mark.assessmentName}</td>
                    <td className="px-3 py-2">{formatDate(mark.recordedAt)}</td>
                    <td className="px-3 py-2">{mark.maxMark}</td>
                    <td className="px-3 py-2">{mark.obtainedMark}</td>
                    <td className="px-3 py-2" style={{ maxWidth: 220 }}>{mark.remarks || '—'}</td>
                    <td className="px-3 py-2 text-right">
                      <button onClick={() => onDeleteMark(mark.id)} className="text-xs text-red-600 hover:underline">
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}


