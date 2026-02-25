import { Database } from 'lucide-react';

/**
 * DataTable — reusable table component
 *
 * Props:
 *  - columns: [{ key, label, className, style, render(row, idx) }]
 *  - data: array of row objects
 *  - loading: bool
 *  - error: string|null
 *  - emptyMessage: string
 *  - emptyDescription: string
 *  - pagination: { current_page, last_page, per_page, total }
 *  - page: current page number
 *  - onPageChange: fn(page)
 *  - footerRow: optional JSX for <tfoot>
 *  - tableId: string
 */
export default function DataTable({
    columns = [],
    data = [],
    loading = false,
    error = null,
    emptyMessage = 'No data found',
    emptyDescription = 'Try adjusting your filters.',
    pagination = { current_page: 1, last_page: 1, per_page: 15, total: 0 },
    page = 1,
    onPageChange,
    footerRow,
    tableId = 'data-table',
}) {
    const renderPagination = () => {
        const pages = [];
        const last = Math.max(1, pagination.last_page);

        if (last <= 5) {
            for (let i = 1; i <= last; i++) pages.push(i);
        } else {
            if (page <= 3) pages.push(1, 2, 3, 4, '...', last);
            else if (page >= last - 2) pages.push(1, '...', last - 3, last - 2, last - 1, last);
            else pages.push(1, '...', page - 1, page, page + 1, '...', last);
        }

        return pages.map((p, idx) =>
            p === '...' ? (
                <span key={`ellipsis-${idx}`} style={{ padding: '4px 8px', color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>...</span>
            ) : (
                <button
                    key={p}
                    className="btn btn-ghost"
                    style={{
                        padding: '4px',
                        minWidth: '32px',
                        height: '32px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: page === p ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
                        color: page === p ? 'var(--primary)' : 'var(--text-secondary)',
                        fontWeight: page === p ? 600 : 400,
                        borderRadius: '4px',
                    }}
                    onClick={() => onPageChange?.(p)}
                >
                    {p}
                </button>
            )
        );
    };

    return (
        <div className="table-container">
            {loading ? (
                <div className="table-loading">
                    <div className="spinner" />
                    <span>Loading...</span>
                </div>
            ) : error && data.length === 0 ? (
                <div className="table-empty">
                    <Database className="table-empty-icon" size={60} />
                    <h3>Unable to load data</h3>
                    <p>{error}</p>
                </div>
            ) : data.length === 0 ? (
                <div className="table-empty">
                    <Database className="table-empty-icon" size={60} />
                    <h3>{emptyMessage}</h3>
                    <p>{emptyDescription}</p>
                </div>
            ) : (
                <div className="table-scroll">
                    <table className="data-table" id={tableId}>
                        <thead>
                            <tr>
                                {columns.map((col) => (
                                    <th key={col.key} className={col.className || ''} style={col.thStyle || col.style || {}}>
                                        {col.label}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {data.map((row, idx) => (
                                <tr key={row.id ?? idx}>
                                    {columns.map((col) => (
                                        <td key={col.key} className={col.className || ''} style={col.tdStyle || {}}>
                                            {col.render ? col.render(row, idx) : row[col.key] ?? '—'}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                        {footerRow && (
                            <tfoot>
                                {footerRow}
                            </tfoot>
                        )}
                    </table>
                </div>
            )}

            {/* Pagination Footer */}
            {!loading && data.length > 0 && (
                <div className="table-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        Showing {(pagination.current_page - 1) * pagination.per_page + 1} to {Math.min(pagination.current_page * pagination.per_page, pagination.total)} of {pagination.total}
                    </div>

                    <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                        <button
                            className="btn btn-ghost"
                            disabled={page === 1}
                            onClick={() => onPageChange?.(page - 1)}
                            style={{ padding: '4px 10px', fontSize: '13px' }}
                        >
                            Prev
                        </button>
                        <div style={{ display: 'flex', gap: '2px', margin: '0 8px' }}>
                            {renderPagination()}
                        </div>
                        <button
                            className="btn btn-ghost"
                            disabled={page >= Math.max(1, pagination.last_page)}
                            onClick={() => onPageChange?.(page + 1)}
                            style={{ padding: '4px 10px', fontSize: '13px' }}
                        >
                            Next
                        </button>
                    </div>

                    <div>Last updated: {new Date().toLocaleString()}</div>
                </div>
            )}
        </div>
    );
}
