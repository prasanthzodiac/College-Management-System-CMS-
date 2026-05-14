import React, { useState, useEffect } from 'react'
import api, { setDemoEmail } from '../../lib/api'
import { isDemoFirebase } from '../../services/firebase'
import { toast } from 'sonner'

type ProgramOutcome = {
    code: string
    title: string
    desc: string
}

type ProgramSpecificOutcome = {
    code: string
    desc: string
}

type SubjectWithPOs = {
    id: string
    code: string
    name: string
    section: string
    mappedPOs: string[]
}

export default function ProgramOutcome() {
    const [programOutcomes, setProgramOutcomes] = useState<ProgramOutcome[]>([])
    const [programSpecificOutcomes, setProgramSpecificOutcomes] = useState<ProgramSpecificOutcome[]>([])
    const [subjects, setSubjects] = useState<SubjectWithPOs[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedSubject, setSelectedSubject] = useState<string | null>(null)

    useEffect(() => {
        loadProgramOutcomes()
    }, [])

    const loadProgramOutcomes = async () => {
        setLoading(true)
        try {
            const email = localStorage.getItem('demoEmail')
            if (isDemoFirebase && email) setDemoEmail(email)

            const { data } = await api.get('/api/subjects/program-outcomes')
            if (data?.programOutcomes) {
                setProgramOutcomes(data.programOutcomes)
            }
            if (data?.programSpecificOutcomes) {
                setProgramSpecificOutcomes(data.programSpecificOutcomes)
            }
            if (data?.subjects) {
                setSubjects(data.subjects)
            }
        } catch (err: any) {
            console.error('Error loading program outcomes:', err)
            toast.error(err?.response?.data?.error || 'Failed to load program outcomes')
        } finally {
            setLoading(false)
        }
    }

    const getPOsForSubject = (subjectId: string): ProgramOutcome[] => {
        const subject = subjects.find(s => s.id === subjectId)
        if (!subject) return []
        return programOutcomes.filter(po => subject.mappedPOs.includes(po.code))
    }

    return (
        <div className="p-4">
            <div className="rounded-md border bg-white overflow-hidden">
                <div className="px-4 py-3 bg-blue-700 text-white">
                    <div className="font-medium">Program Outcome</div>
                    <div className="text-[12px] opacity-90">Program Outcomes and Program Specific Outcomes</div>
                </div>
                <div className="p-4 space-y-6">
                    {loading ? (
                        <div className="text-center text-gray-500 py-8">Loading...</div>
                    ) : (
                        <>
                            {/* Subject Selection */}
                            {subjects.length > 0 && (
                                <div>
                                    <h3 className="text-base font-semibold mb-3 text-gray-800">Select Subject</h3>
                                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                                        {subjects.map((subject) => (
                                            <button
                                                key={subject.id}
                                                onClick={() => setSelectedSubject(selectedSubject === subject.id ? null : subject.id)}
                                                className={`px-3 py-2 text-sm rounded border text-left transition-colors ${
                                                    selectedSubject === subject.id
                                                        ? 'bg-blue-600 text-white border-blue-600'
                                                        : 'bg-white hover:bg-gray-50 border-gray-300'
                                                }`}
                                            >
                                                <div className="font-medium">{subject.code}</div>
                                                <div className="text-xs opacity-90">{subject.name}</div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Selected Subject's Program Outcomes */}
                            {selectedSubject && (
                                <div>
                                    <h3 className="text-base font-semibold mb-3 text-gray-800">
                                        Program Outcomes for {subjects.find(s => s.id === selectedSubject)?.name}
                                    </h3>
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full text-sm">
                                            <thead>
                                                <tr className="bg-gray-50 border-b">
                                                    <th className="px-4 py-3 text-left font-semibold text-gray-700 w-20">Code</th>
                                                    <th className="px-4 py-3 text-left font-semibold text-gray-700 w-48">Title</th>
                                                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Description</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {getPOsForSubject(selectedSubject).map((po, idx) => (
                                                    <tr key={po.code} className={`border-b hover:bg-gray-50 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                                                        <td className="px-4 py-3 font-semibold text-blue-700">{po.code}</td>
                                                        <td className="px-4 py-3 font-medium text-gray-900">{po.title}</td>
                                                        <td className="px-4 py-3 text-gray-700">{po.desc}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            {/* All Program Outcomes */}
                            <div>
                                <h3 className="text-base font-semibold mb-3 text-gray-800">All Program Outcomes (PO)</h3>
                                <div className="overflow-x-auto">
                                    <table className="min-w-full text-sm">
                                        <thead>
                                            <tr className="bg-gray-50 border-b">
                                                <th className="px-4 py-3 text-left font-semibold text-gray-700 w-20">Code</th>
                                                <th className="px-4 py-3 text-left font-semibold text-gray-700 w-48">Title</th>
                                                <th className="px-4 py-3 text-left font-semibold text-gray-700">Description</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {programOutcomes.map((po, idx) => (
                                                <tr key={po.code} className={`border-b hover:bg-gray-50 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                                                    <td className="px-4 py-3 font-semibold text-blue-700">{po.code}</td>
                                                    <td className="px-4 py-3 font-medium text-gray-900">{po.title}</td>
                                                    <td className="px-4 py-3 text-gray-700">{po.desc}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Program Specific Outcomes */}
                            <div>
                                <h3 className="text-base font-semibold mb-3 text-gray-800">Program Specific Outcomes (PSO)</h3>
                                <div className="overflow-x-auto">
                                    <table className="min-w-full text-sm">
                                        <thead>
                                            <tr className="bg-gray-50 border-b">
                                                <th className="px-4 py-3 text-left font-semibold text-gray-700 w-20">Code</th>
                                                <th className="px-4 py-3 text-left font-semibold text-gray-700">Description</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {programSpecificOutcomes.map((pso, idx) => (
                                                <tr key={pso.code} className={`border-b hover:bg-gray-50 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                                                    <td className="px-4 py-3 font-semibold text-blue-700">{pso.code}</td>
                                                    <td className="px-4 py-3 text-gray-700">{pso.desc}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}

