import React from 'react'
import { useNavigate } from 'react-router-dom'
import api, { setDemoEmail } from '../../lib/api'
import { isDemoFirebase } from '../../services/firebase'

type SubjectInfo = {
    title: string
    section: string
    exams: string
    periods: number
    allocatedHours: number
    pendingAttendance: string
    assignment: string
    totalStudents: number
}

export default function StaffSubjectCard() {
    const [subjects, setSubjects] = React.useState<SubjectInfo[]>([])
    const [loading, setLoading] = React.useState(true)

    const load = async () => {
        setLoading(true)
        try {
            const email = localStorage.getItem('demoEmail')
            if (isDemoFirebase && email) setDemoEmail(email)
            const { data } = await api.get('/api/subjects/staff/assigned/current')
            const fetched = (data?.subjects || []).map((s: any) => ({
                title: `${s.code} - ${s.name}`,
                section: s.section,
                exams: 'Exams & Class',
                periods: s.stats?.totalPeriods || 0,
                allocatedHours: s.stats?.allocatedHours || 0,
                pendingAttendance: s.stats?.pendingAttendance || '0/0',
                assignment: s.stats?.assignment || '0/0',
                totalStudents: s.stats?.totalStudents || 0
            }))
            setSubjects(fetched)
        } catch (err: any) {
            console.error('Error loading subjects:', err)
            setSubjects([])
        } finally {
            setLoading(false)
        }
    }

    React.useEffect(() => { load() }, [])

    if (loading) return <div className="p-4 text-sm text-gray-500">Loading subjects...</div>

    return (
        <section className="mb-5">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {subjects.map((s, idx) => (
                    <SubjectCard key={idx} subj={s} />
                ))}
            </div>
        </section>
    )
}

function SubjectCard({ subj }: { subj: SubjectInfo }) {
    const [open, setOpen] = React.useState(false)
    const navigate = useNavigate()
    React.useEffect(() => {
        const onDoc = () => setOpen(false)
        if (open) document.addEventListener('click', onDoc)
        return () => document.removeEventListener('click', onDoc)
    }, [open])
    return (
        <div className="rounded-md border bg-white overflow-hidden shadow-sm relative">
            <div className="px-3 py-2 bg-blue-50 text-blue-900 text-xs font-semibold flex items-center justify-between">
                <span>{subj.section}</span>
                <button className="p-1 rounded hover:bg-blue-100" onClick={(e) => { e.stopPropagation(); setOpen((v) => !v) }}>⋯</button>
            </div>
            {open && (
                <div className="absolute right-2 top-9 z-20 w-56 bg-white border rounded-md shadow-lg text-[13px]" onClick={(e) => e.stopPropagation()}>
                    <MenuItem icon={<IconSquare />} label="Lesson Plan" />
                    <MenuItem icon={<IconSquare />} label="Monthly Lesson Plan" />
                    <MenuItem icon={<IconCheck />} label="Attendance" onClick={() => { 
                        setOpen(false); 
                        const subjectId = `SUBJ-${subj.title.split(' - ')[0]}`;
                        navigate(`/dashboard/staff/academic/subject-card/attendance?subjectId=${encodeURIComponent(subjectId)}&subjectName=${encodeURIComponent(subj.title)}&section=${encodeURIComponent(subj.section)}`) 
                    }} />
                    <MenuItem icon={<IconDoc />} label="Assignment" onClick={() => { 
                        setOpen(false); 
                        const subjectId = `SUBJ-${subj.title.split(' - ')[0]}`;
                        navigate(`/dashboard/staff/academic/subject-card/assignment?subjectId=${encodeURIComponent(subjectId)}&subjectName=${encodeURIComponent(subj.title)}&section=${encodeURIComponent(subj.section)}`) 
                    }} />
                    <MenuItem icon={<IconMonitor />} label="Online Test" />
                    <MenuItem icon={<IconClock />} label="Stay Back / Special Class" />
                    <MenuItem icon={<IconTick />} label="Internals" />
                    <MenuItem icon={<IconChat />} label="Feedback / Survey" />
                    <MenuItem icon={<IconChat />} label="Feedback About Students" />
                    <MenuItem icon={<IconSettings />} label="Manage Assessment" />
                </div>
            )}
            <div className="p-3">
                <div className="text-sm font-medium text-gray-900 mb-2">{subj.title}</div>
                <div className="flex flex-wrap gap-2 text-[11px]">
                    <Badge color="blue">{subj.exams}</Badge>
                    <Badge color="purple">Others</Badge>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-[11px] text-gray-700">
                    <KV k="Tot. Periods" v={`${subj.periods}`} />
                    <KV k="Max. Mark" v="75" />
                    <KV k="Allocated Hours" v={`${subj.allocatedHours}`} />
                    <KV k="Pending Attendance" v={subj.pendingAttendance} />
                    <KV k="Assignment" v={subj.assignment} />
                </div>
            </div>
            <div className="px-3 pb-3">
                <Badge color="teal">Total Students - {subj.totalStudents}</Badge>
            </div>
        </div>
    )
}

function KV({ k, v }: { k: string; v: string }) {
    return (
        <div className="flex items-center justify-between border rounded px-2 py-1 bg-gray-50">
            <span className="text-gray-500">{k}:</span>
            <span className="font-medium text-gray-800">{v}</span>
        </div>
    )
}

function Badge({ children, color }: { children: React.ReactNode; color: 'blue' | 'purple' | 'teal' }) {
    const colorMap: Record<string, string> = {
        blue: 'bg-blue-100 text-blue-800',
        purple: 'bg-violet-100 text-violet-800',
        teal: 'bg-emerald-100 text-emerald-800'
    }
    return <span className={`px-2 py-0.5 rounded ${colorMap[color]}`}>{children}</span>
}

function MenuItem({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick?: () => void }) {
    return (
        <button className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-100 text-left" onClick={onClick}>
            <span className="text-rose-600">{icon}</span>
            <span>{label}</span>
            <span className="ml-auto text-gray-400">›</span>
        </button>
    )
}

const IconSquare = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><rect x="5" y="5" width="14" height="14" rx="2"/></svg>
)
const IconCheck = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M20 6L9 17l-5-5"/></svg>
)
const IconDoc = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M6 3.75A2.25 2.25 0 018.25 1.5h4.5L18 6.75v13.5A2.25 2.25 0 0115.75 22.5H8.25A2.25 2.25 0 016 20.25V3.75z"/></svg>
)
const IconMonitor = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M3.75 5.25h16.5v10.5H3.75z"/><path d="M9 18h6v1.5H9z"/></svg>
)
const IconClock = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M12 3.75a8.25 8.25 0 110 16.5 8.25 8.25 0 010-16.5zm.75 4.5h-1.5v4.5l3.75 2.25.75-1.26-3-1.74V8.25z"/></svg>
)
const IconTick = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M4.5 12l4.5 4.5L19.5 6"/></svg>
)
const IconChat = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M2.25 12A8.25 8.25 0 0110.5 3.75h3A8.25 8.25 0 0121.75 12v.75A6.75 6.75 0 0115 19.5H9l-4.5 2.25.75-3A6.75 6.75 0 012.25 12.75V12z"/></svg>
)
const IconSettings = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M12 8.25a3.75 3.75 0 100 7.5 3.75 3.75 0 000-7.5z"/><path d="M3.75 12a8.25 8.25 0 0116.5 0 8.25 8.25 0 01-16.5 0z"/></svg>
)


