import React from 'react'

export type Column<T> = {
    key: keyof T | string
    header: string
    render?: (row: T) => React.ReactNode
    sortable?: boolean
}

export default function DataTable<T extends Record<string, any>>({
    title,
    columns,
    rows,
    pageSize = 10
}: {
    title: string
    columns: Column<T>[]
    rows: T[]
    pageSize?: number
}) {
    const [q, setQ] = React.useState('')
    const [sortKey, setSortKey] = React.useState<keyof T | string | null>(null)
    const [sortDir, setSortDir] = React.useState<'asc' | 'desc'>('asc')
    const [page, setPage] = React.useState(1)

    const filtered = React.useMemo(() => {
        const term = q.toLowerCase().trim()
        let r = rows
        if (term) {
            r = r.filter((row) => Object.values(row).some((v) => String(v).toLowerCase().includes(term)))
        }
        if (sortKey && typeof sortKey === 'string' && r.length > 0 && sortKey in r[0]) {
            r = [...r].sort((a, b) => {
                const av = a[sortKey as keyof T]
                const bv = b[sortKey as keyof T]
                if (av === bv) return 0
                const cmp = String(av).localeCompare(String(bv), undefined, { numeric: true, sensitivity: 'base' })
                return sortDir === 'asc' ? cmp : -cmp
            })
        }
        return r
    }, [rows, q, sortKey, sortDir])

    const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
    const pageRows = filtered.slice((page - 1) * pageSize, page * pageSize)

    const onSort = (key: keyof T | string, sortable?: boolean) => {
        if (sortable === false) return
        if (sortKey !== key) {
            setSortKey(key)
            setSortDir('asc')
        } else {
            setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
        }
    }

    React.useEffect(() => {
        setPage(1)
    }, [q])

    return (
        <section className="mb-5 border rounded-md bg-white overflow-hidden">
            <div className="px-4 py-2 border-b bg-gray-50 flex items-center justify-between">
                <div className="text-sm font-medium">{title}</div>
                <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search..." className="text-sm border rounded px-2 py-1 bg-white" />
            </div>
            <div className="overflow-auto">
                <table className="min-w-full text-sm">
                    <thead className="bg-white">
                        <tr className="text-left text-gray-700">
                            {columns.map((c) => (
                                <th key={String(c.key)} className={`px-3 py-2 ${c.sortable !== false ? 'cursor-pointer select-none' : ''}`} onClick={() => onSort(c.key, c.sortable)}>
                                    <span className="inline-flex items-center gap-1">
                                        <span>{c.header}</span>
                                        {c.sortable !== false && sortKey === c.key && (
                                            sortDir === 'asc' ? (
                                                <svg aria-hidden="true" viewBox="0 0 20 20" className="w-3 h-3 fill-current text-gray-500"><path d="M10 6l-5 6h10L10 6z"/></svg>
                                            ) : (
                                                <svg aria-hidden="true" viewBox="0 0 20 20" className="w-3 h-3 fill-current text-gray-500"><path d="M10 14l5-6H5l5 6z"/></svg>
                                            )
                                        )}
                                    </span>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {pageRows.map((row, idx) => (
                            <tr key={idx} className="border-t">
                                {columns.map((c) => (
                                    <td key={String(c.key)} className="px-3 py-2">{c.render ? c.render(row) : (c.key in row ? String(row[c.key as keyof T]) : '')}</td>
                                ))}
                            </tr>
                        ))}
                        {pageRows.length === 0 && (
                            <tr>
                                <td className="px-3 py-6 text-center text-gray-500" colSpan={columns.length}>No records</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
            <div className="px-4 py-2 border-t bg-white text-xs flex items-center justify-between">
                <div>Showing {(page - 1) * pageSize + 1}-{Math.min(page * pageSize, filtered.length)} of {filtered.length}</div>
                <div className="flex items-center gap-1">
                    <button aria-label="First page" className="px-2 py-1 rounded border disabled:opacity-50" disabled={page === 1} onClick={() => setPage(1)}>
                        <svg viewBox="0 0 20 20" className="w-4 h-4 fill-current text-blue-700"><path d="M6 4v12H4V4h2zm2.5 6l7.5 6V4L8.5 10z"/></svg>
                    </button>
                    <button aria-label="Previous page" className="px-2 py-1 rounded border disabled:opacity-50" disabled={page === 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
                        <svg viewBox="0 0 20 20" className="w-4 h-4 fill-current text-blue-700"><path d="M12.5 15l-5-5 5-5v10z"/></svg>
                    </button>
                    <span className="px-2">{page}/{totalPages}</span>
                    <button aria-label="Next page" className="px-2 py-1 rounded border disabled:opacity-50" disabled={page === totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>
                        <svg viewBox="0 0 20 20" className="w-4 h-4 fill-current text-blue-700"><path d="M7.5 5l5 5-5 5V5z"/></svg>
                    </button>
                    <button aria-label="Last page" className="px-2 py-1 rounded border disabled:opacity-50" disabled={page === totalPages} onClick={() => setPage(totalPages)}>
                        <svg viewBox="0 0 20 20" className="w-4 h-4 fill-current text-blue-700"><path d="M14 4v12h2V4h-2zM11.5 10L4 16V4l7.5 6z"/></svg>
                    </button>
                </div>
            </div>
        </section>
    )
}


