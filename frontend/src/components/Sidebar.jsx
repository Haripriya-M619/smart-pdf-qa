import { useEffect, useState } from 'react'
import { FileText, Trash2, Clock, MessageSquare, ChevronRight } from 'lucide-react'
import { getSessions, deleteSession } from '../lib/api'

export default function Sidebar({ activeSessionId, onSelectSession, onDeleted, refreshTrigger }) {
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(false)

  const fetchSessions = async () => {
    try {
      setLoading(true)
      const data = await getSessions()
      setSessions(data)
    } catch {
      // backend may not have sessions yet
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchSessions() }, [refreshTrigger])

  const handleDelete = async (e, id) => {
    e.stopPropagation()
    await deleteSession(id)
    setSessions(s => s.filter(x => x.session_id !== id))
    if (id === activeSessionId) onDeleted()
  }

  const fmt = (iso) => {
    const d = new Date(iso)
    return d.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  return (
    <aside className="w-72 shrink-0 bg-[#111118] border-r border-[#1e1e2a] flex flex-col h-screen">
      {/* Header */}
      <div className="px-5 pt-6 pb-4 border-b border-[#1e1e2a]">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-2.5 h-2.5 rounded-full bg-gradient-to-br from-[#7c6aff] to-[#c084fc]" />
          <span className="text-sm font-bold tracking-widest uppercase text-white">PDF Q&A</span>
        </div>
        <p className="font-mono text-[10px] text-[#475569] tracking-wider">RAG · Claude Sonnet · FAISS</p>
      </div>

      {/* History */}
      <div className="flex-1 overflow-y-auto px-3 py-4">
        <p className="font-mono text-[10px] uppercase tracking-widest text-[#334155] px-2 mb-3">
          Chat History
        </p>

        {loading && (
          <p className="font-mono text-xs text-[#334155] px-2">Loading...</p>
        )}

        {!loading && sessions.length === 0 && (
          <div className="px-2 py-8 text-center">
            <Clock size={24} className="text-[#1e293b] mx-auto mb-2" />
            <p className="font-mono text-xs text-[#334155]">No sessions yet.<br />Upload a PDF to start.</p>
          </div>
        )}

        <div className="flex flex-col gap-2">
          {sessions.map(s => {
            const isActive = s.session_id === activeSessionId
            return (
              <div
                key={s.session_id}
                onClick={() => onSelectSession(s.session_id)}
                className={`group relative rounded-xl p-3 cursor-pointer transition-all border
                  ${isActive
                    ? 'border-[#4338ca] bg-[#13102a]'
                    : 'border-[#1e293b] bg-[#0f172a] hover:border-[#2e2e4a]'
                  }`}
              >
                {/* title */}
                <div className="flex items-start gap-2 pr-6">
                  <MessageSquare size={13} className="text-[#7c6aff] mt-0.5 shrink-0" />
                  <p className="text-[13px] font-medium text-[#e2e8f0] leading-snug line-clamp-2">
                    {s.title}
                  </p>
                </div>

                {/* meta */}
                <div className="mt-2 flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-[10px] bg-[#1e293b] text-[#818cf8] px-2 py-0.5 rounded-full">
                    {s.message_count}Q
                  </span>
                  <span className="font-mono text-[10px] text-[#475569] flex items-center gap-1">
                    <FileText size={10} />
                    {s.filename.length > 18 ? s.filename.slice(0, 18) + '…' : s.filename}
                  </span>
                </div>
                <p className="font-mono text-[10px] text-[#334155] mt-1.5">{fmt(s.created_at)}</p>

                {/* delete */}
                <button
                  onClick={(e) => handleDelete(e, s.session_id)}
                  className="absolute top-2.5 right-2.5 opacity-0 group-hover:opacity-100 transition-opacity
                             text-[#475569] hover:text-red-400 p-1 rounded"
                >
                  <Trash2 size={12} />
                </button>

                {isActive && (
                  <ChevronRight size={12} className="absolute right-2.5 bottom-2.5 text-[#7c6aff]" />
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Footer */}
      <div className="px-5 py-4 border-t border-[#1e1e2a]">
        <p className="font-mono text-[10px] text-[#1e293b]">
          Built with FastAPI · React · LangChain
        </p>
      </div>
    </aside>
  )
}
