import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import api, { setDemoEmail } from '../../lib/api'
import { isDemoFirebase } from '../../services/firebase'

export default function Feedback() {
    const [items, setItems] = useState<any[]>([])
    const [category, setCategory] = useState('')
    const [subject, setSubject] = useState('')
    const [message, setMessage] = useState('')
    const [rating, setRating] = useState(0)
    const [fileName, setFileName] = useState<string | null>(null)
    const fileRef = useRef<HTMLInputElement | null>(null)

    const readFileAsBase64 = (file: File) => new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(String(reader.result))
        reader.onerror = reject
        reader.readAsDataURL(file)
    })

    const load = async () => {
        const email = localStorage.getItem('demoEmail')
        if (isDemoFirebase && email) setDemoEmail(email)
        const { data } = await api.get('/api/feedback')
        setItems(data?.items || [])
    }

    useEffect(() => { load() }, [])

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!category || !subject || !message || !rating) {
            toast.error('Please complete all required fields')
            return
        }
        try {
            let attachmentUrl: string | undefined
            const file = fileRef.current?.files?.[0]
            if (file) {
                const base64 = await readFileAsBase64(file)
                const { data } = await api.post('/api/media/upload', { data: base64, folder: 'feedback' })
                attachmentUrl = data?.url
            }

            await api.post('/api/feedback', { category, subject, message, rating, attachmentUrl })
            toast.success('Feedback submitted and saved')
            setCategory(''); setSubject(''); setMessage(''); setRating(0); setFileName(null); if (fileRef.current) fileRef.current.value = ''
            await load()
        } catch (err: any) {
            toast.error(err?.message || 'Failed to submit feedback')
        }
    }

    return (
        <div className="p-4">
            <div className="rounded-md border bg-white overflow-hidden">
                <div className="px-4 py-2 bg-blue-700 text-white font-medium">Feedback</div>
                <form onSubmit={onSubmit} className="p-4 text-sm space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-medium mb-1">* Category</label>
                            <select value={category} onChange={(e)=>setCategory(e.target.value)} className="w-full border rounded px-3 py-2 bg-white">
                                <option value="">-- Select --</option>
                                <option>Academic</option>
                                <option>Facilities</option>
                                <option>Administration</option>
                                <option>Technical</option>
                                <option>Other</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-medium mb-1">* Subject</label>
                            <input value={subject} onChange={(e)=>setSubject(e.target.value)} placeholder="Short title" className="w-full border rounded px-3 py-2 bg-white" />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-medium mb-1">* Message</label>
                        <textarea value={message} onChange={(e)=>setMessage(e.target.value)} rows={4} placeholder="Describe your feedback" className="w-full border rounded px-3 py-2 bg-white" />
                    </div>

                    <div>
                        <label className="block text-xs font-medium mb-1">* Rating</label>
                        <div className="flex items-center gap-1">
                            {[1,2,3,4,5].map(n => (
                                <button key={n} type="button" onClick={()=>setRating(n)} className={`text-xl ${rating>=n ? 'text-yellow-500' : 'text-gray-300'}`}>★</button>
                            ))}
                            <span className="ml-2 text-xs opacity-70">{rating ? `${rating}/5` : 'Select'}</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-medium mb-1">Attachment (optional)</label>
                            <input ref={fileRef} onChange={(e)=>setFileName(e.target.files?.[0]?.name || null)} type="file" className="w-full border rounded px-3 py-2 bg-white" />
                            {fileName && <div className="text-xs mt-1 opacity-70">{fileName}</div>}
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button type="submit" className="px-3 py-1.5 rounded bg-blue-700 text-white">Submit</button>
                        <button type="button" onClick={()=>{setCategory(''); setSubject(''); setMessage(''); setRating(0); setFileName(null); if (fileRef.current) fileRef.current.value = ''}} className="px-3 py-1.5 rounded border">Clear</button>
                    </div>
                </form>
            </div>

            {/* Feedback history */}
            <div className="mt-6 rounded-md border bg-white overflow-hidden">
                <div className="px-4 py-2 bg-gray-50 font-medium">Your previous feedback</div>
                {items.length === 0 ? (
                    <div className="p-4 text-sm text-gray-500">No feedback submitted yet.</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-sm">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-3 py-2 text-left border-b">Date</th>
                                    <th className="px-3 py-2 text-left border-b">Category</th>
                                    <th className="px-3 py-2 text-left border-b">Subject</th>
                                    <th className="px-3 py-2 text-left border-b">Rating</th>
                                    <th className="px-3 py-2 text-left border-b">Attachment</th>
                                </tr>
                            </thead>
                            <tbody>
                                {items.map(it => (
                                    <tr key={it.id} className="border-b">
                                        <td className="px-3 py-2">{new Date(it.createdAt).toLocaleDateString('en-GB')}</td>
                                        <td className="px-3 py-2">{it.category}</td>
                                        <td className="px-3 py-2">{it.subject}</td>
                                        <td className="px-3 py-2">{'★'.repeat(it.rating)}{'☆'.repeat(5 - it.rating)}</td>
                                        <td className="px-3 py-2">{it.attachmentUrl ? <a href={it.attachmentUrl} className="text-blue-700" target="_blank">View</a> : '—'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    )
}



