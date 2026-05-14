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

export function AdminInternalMarksPage() {
  const [marks, setMarks] = React.useState<InternalMarkRecord[]>([])
  const [subjects, setSubjects] = React.useState<SubjectOption[]>([])
  const [students, setStudents] = React.useState<Array<{ id: string; name: string | null; email: string }>>([])
  const [loading, setLoading] = React.useState(true)
  const [loadingSubjects, setLoadingSubjects] = React.useState(true)
  const [loadingStudents, setLoadingStudents] = React.useState(true)
  const [saving, setSaving] = React.useState(false)
  const [filters, setFilters] = React.useState({ subjectId: '' })
  const [form, setForm] = React.useState({
    subjectId: '',
    studentId: '',
    assessmentName: 'Internal Test',
    maxMark: 50,
    obtainedMark: 40,
    recordedAt: new Date().toISOString().split('T')[0],
    remarks: ''
  })

  const loadSubjects = React.useCallback(async () => {
    try {
      setLoadingSubjects(true)
      const email = localStorage.getItem('demoEmail')
      if (isDemoFirebase && email) setDemoEmail(email)
      const { data } = await api.get('/api/subjects')
      setSubjects((data?.subjects || []) as SubjectOption[])
    } catch (error: any) {
      toast.error(error?.response?.data?.error || 'Failed to load subjects')
      setSubjects([])
    } finally {
      setLoadingSubjects(false)
    }
  }, [])

  const loadStudents = React.useCallback(async () => {
    try {
      setLoadingStudents(true)
      const email = localStorage.getItem('demoEmail')
      if (isDemoFirebase && email) setDemoEmail(email)
      const { data } = await api.get('/api/auth/all')
      const all = (data?.users || []) as Array<{ id: string; name: string | null; email: string; role: string }>
      setStudents(all.filter((u) => u.role === 'student').map((u) => ({ id: u.id, name: u.name, email: u.email })))
    } catch (error: any) {
      toast.error(error?.response?.data?.error || 'Failed to load students')
      setStudents([])
    } finally {
      setLoadingStudents(false)
    }
  }, [])

  const loadMarks = React.useCallback(async () => {
    try {
      setLoading(true)
      const email = localStorage.getItem('demoEmail')
      if (isDemoFirebase && email) setDemoEmail(email)
      const params: Record<string, string> = {}
      if (filters.subjectId) params.subjectId = filters.subjectId
      const { data } = await api.get('/api/internal-marks', { params })
      setMarks((data?.marks || []) as InternalMarkRecord[])
    } catch (error: any) {
      toast.error(error?.response?.data?.error || 'Failed to load internal marks')
      setMarks([])
    } finally {
      setLoading(false)
    }
  }, [filters])

  React.useEffect(() => {
    loadSubjects()
    loadStudents()
  }, [loadSubjects, loadStudents])

  React.useEffect(() => {
    loadMarks()
  }, [loadMarks])

  const onCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.subjectId) {
      toast.warning('Select a subject')
      return
    }
    if (!form.studentId) {
      toast.warning('Select a student')
      return
    }
    if (!form.assessmentName) {
      toast.warning('Enter an assessment name')
      return
    }
    if (form.obtainedMark > form.maxMark) {
      toast.warning('Obtained mark cannot exceed max mark')
      return
    }
    try {
      setSaving(true)
      const email = localStorage.getItem('demoEmail')
      if (isDemoFirebase && email) setDemoEmail(email)
      await api.post('/api/internal-marks', {
        subjectId: form.subjectId,
        studentId: form.studentId,
        assessmentName: form.assessmentName,
        maxMark: Number(form.maxMark),
        obtainedMark: Number(form.obtainedMark),
        recordedAt: form.recordedAt,
        remarks: form.remarks || undefined
      })
      toast.success('Internal mark created')
      setForm((prev) => ({ ...prev, assessmentName: '', obtainedMark: 0, remarks: '' }))
      loadMarks()
    } catch (error: any) {
      toast.error(error?.response?.data?.error || 'Failed to create internal mark')
    } finally {
      setSaving(false)
    }
  }

  const onDelete = async (id: string) => {
    if (!window.confirm('Delete this mark?')) return
    try {
      const email = localStorage.getItem('demoEmail')
      if (isDemoFirebase && email) setDemoEmail(email)
      await api.delete(`/api/internal-marks/${id}`)
      toast.success('Mark deleted')
      loadMarks()
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
            <h2 className="text-sm font-semibold">Create Internal Mark</h2>
            <p className="text-xs text-gray-500">Record internal assessments for any student</p>
          </div>
          <button onClick={loadSubjects} className="text-xs px-3 py-1.5 border rounded hover:bg-gray-100" disabled={loadingSubjects}>
            {loadingSubjects ? 'Loading...' : 'Reload Subjects'}
          </button>
        </div>
        <form onSubmit={onCreate} className="p-4 space-y-4 text-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium uppercase text-gray-600">Subject *</label>
              <select
                value={form.subjectId}
                onChange={(e) => setForm((prev) => ({ ...prev, subjectId: e.target.value }))}
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
              <label className="block text-xs font-medium uppercase text-gray-600">Student *</label>
              <select
                value={form.studentId}
                onChange={(e) => setForm((prev) => ({ ...prev, studentId: e.target.value }))}
                className="mt-1 w-full border rounded px-3 py-2 bg-white"
                required
                disabled={loadingStudents}
              >
                <option value="">{loadingStudents ? 'Loading students...' : 'Select student'}</option>
                {students.map((student) => (
                  <option key={student.id} value={student.id}>
                    {(student.name || student.email)} — {student.email}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium uppercase text-gray-600">Assessment *</label>
              <input
                type="text"
                value={form.assessmentName}
                onChange={(e) => setForm((prev) => ({ ...prev, assessmentName: e.target.value }))}
                className="mt-1 w-full border rounded px-3 py-2 bg-white"
                placeholder="e.g. Internal Test 1"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium uppercase text-gray-600">Recorded Date *</label>
              <input
                type="date"
                value={form.recordedAt}
                onChange={(e) => setForm((prev) => ({ ...prev, recordedAt: e.target.value }))}
                className="mt-1 w-full border rounded px-3 py-2 bg-white"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium uppercase text-gray-600">Max Mark *</label>
              <input
                type="number"
                min={1}
                value={form.maxMark}
                onChange={(e) => setForm((prev) => ({ ...prev, maxMark: Number(e.target.value) }))}
                className="mt-1 w-full border rounded px-3 py-2 bg-white"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium uppercase text-gray-600">Obtained Mark *</label>
              <input
                type="number"
                min={0}
                value={form.obtainedMark}
                onChange={(e) => setForm((prev) => ({ ...prev, obtainedMark: Number(e.target.value) }))}
                className="mt-1 w-full border rounded px-3 py-2 bg-white"
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium uppercase text-gray-600">Remarks</label>
            <textarea
              rows={3}
              value={form.remarks}
              onChange={(e) => setForm((prev) => ({ ...prev, remarks: e.target.value }))}
              className="mt-1 w-full border rounded px-3 py-2 bg-white"
              placeholder="Optional remarks"
            />
          </div>
          <div className="flex justify-end">
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50" disabled={saving}>
              {saving ? 'Saving...' : 'Create Mark'}
            </button>
          </div>
        </form>
      </section>

      <section className="border rounded-md bg-white">
        <div className="px-4 py-3 border-b flex flex-wrap items-center gap-3 justify-between">
          <div>
            <h3 className="text-sm font-semibold">Internal Marks Overview</h3>
            <p className="text-xs text-gray-500">Filter by subject</p>
          </div>
          <div className="flex flex-wrap gap-2 text-sm">
            <select
              value={filters.subjectId}
              onChange={(e) => setFilters((prev) => ({ ...prev, subjectId: e.target.value }))}
              className="border rounded px-3 py-1.5 bg-white"
            >
              <option value="">All Subjects</option>
              {subjects.map((subject) => (
                <option key={subject.id} value={subject.id}>
                  {subject.code}
                </option>
              ))}
            </select>
            <button onClick={loadMarks} className="px-3 py-1.5 border rounded hover:bg-gray-100">Apply</button>
          </div>
        </div>

        {loading ? (
          <div className="p-6 text-center text-gray-500">Loading internal marks...</div>
        ) : marks.length === 0 ? (
          <div className="p-6 text-center text-gray-500">No internal marks found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-[1000px] w-full text-left text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 border-b">#</th>
                  <th className="px-3 py-2 border-b">Student</th>
                  <th className="px-3 py-2 border-b">Subject</th>
                  <th className="px-3 py-2 border-b">Assessment</th>
                  <th className="px-3 py-2 border-b">Recorded On</th>
                  <th className="px-3 py-2 border-b">Max</th>
                  <th className="px-3 py-2 border-b">Obtained</th>
                  <th className="px-3 py-2 border-b">Recorded By</th>
                  <th className="px-3 py-2 border-b">Remarks</th>
                  <th className="px-3 py-2 border-b text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {marks.map((mark, index) => (
                  <tr key={mark.id} className="border-b">
                    <td className="px-3 py-2">{index + 1}</td>
                    <td className="px-3 py-2">
                      <div className="font-medium">{mark.student?.name || '—'}</div>
                      <div className="text-xs text-gray-500">{mark.student?.rollNumber || mark.student?.email || '—'}</div>
                    </td>
                    <td className="px-3 py-2">
                      <div className="font-medium">{mark.subject?.code || '—'}</div>
                      <div className="text-xs text-gray-500">{mark.subject?.name || '—'}</div>
                    </td>
                    <td className="px-3 py-2">{mark.assessmentName}</td>
                    <td className="px-3 py-2">{formatDate(mark.recordedAt)}</td>
                    <td className="px-3 py-2">{mark.maxMark}</td>
                    <td className="px-3 py-2">{mark.obtainedMark}</td>
                    <td className="px-3 py-2">
                      <div>{mark.recordedBy?.name || '—'}</div>
                      <div className="text-xs text-gray-500">{mark.recordedBy?.email || ''}</div>
                    </td>
                    <td className="px-3 py-2" style={{ maxWidth: 240 }}>{mark.remarks || '—'}</td>
                    <td className="px-3 py-2 text-right">
                      <button onClick={() => onDelete(mark.id)} className="text-xs text-red-600 hover:underline">Delete</button>
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


