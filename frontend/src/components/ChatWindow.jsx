import { useState, useEffect, useRef } from 'react'
import { Send, FileText, ChevronDown, Sparkles, RotateCcw } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import { askQuestion, getSession } from '../lib/api'

export default function ChatWindow({ session, apiKey, onNewMessage, onReset }) {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showSources, setShowSources] = useState({})
  const bottomRef = useRef(null)
  const inputRef = useRef(null)

  // load existing history when session changes
  useEffect(() => {
    if (!session) return
    const loadHistory = async () => {
      try {
        const data = await getSession(session.session_id)
        const hist = data.history || []
        // pair up user/assistant turns
        const msgs = []
        for (let i = 0; i < hist.length; i += 2) {
          if (hist[i]) msgs.push({ role: 'user', content: hist[i].content })
          if (hist[i + 1]) msgs.push({ role: 'assistant', content: hist[i + 1].content, sources: [] })
        }
        setMessages(msgs)
      } catch {
        setMessages([])
      }
    }
    loadHistory()
  }, [session?.session_id])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const send = async () => {
    const q = input.trim()
    if (!q || loading) return
    
    setError('')
    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: q }])
    setLoading(true)

    try {
      const data = await askQuestion(session.session_id, q, apiKey)
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.answer,
        sources: data.sources || [],
      }])
      onNewMessage()
    } catch (e) {
      setError(e?.response?.data?.detail || 'Something went wrong.')
      setMessages(prev => prev.slice(0, -1))
    } finally {
      setLoading(false)
      inputRef.current?.focus()
    }
  }

  const onKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
  }

  const toggleSources = (i) => setShowSources(s => ({ ...s, [i]: !s[i] }))

  return (
    <div className="flex flex-col h-full">
      {/* PDF info bar */}
      <div className="flex items-center gap-3 px-6 py-3 border-b border-[#1e1e2a] bg-[#0e0e14]">
        <FileText size={15} className="text-[#7c6aff] shrink-0" />
        <span className="text-sm font-medium text-[#e2e8f0] truncate">{session.filename}</span>
        <div className="flex gap-2 ml-auto shrink-0">
          <span className="font-mono text-[10px] bg-[#1e293b] text-[#818cf8] px-2 py-0.5 rounded-full">
            {session.pages} pages
          </span>
          <span className="font-mono text-[10px] bg-[#1e293b] text-[#818cf8] px-2 py-0.5 rounded-full">
            {session.chunk_count} chunks
          </span>
        </div>
        <button
          onClick={onReset}
          className="ml-2 text-[#475569] hover:text-white transition-colors"
          title="Upload new PDF"
        >
          <RotateCcw size={14} />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
            <Sparkles size={28} className="text-[#7c6aff]" />
            <p className="text-[#94a3b8] text-sm font-medium">PDF loaded. Ask your first question.</p>
            <p className="font-mono text-xs text-[#334155]">Try: "Summarize this document" or "What are the key findings?"</p>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`fade-up flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
            <span className="font-mono text-[10px] uppercase tracking-widest text-[#334155] mb-1 px-1">
              {msg.role === 'user' ? 'You' : 'Claude'}
            </span>

            <div className={`max-w-[78%] rounded-2xl px-4 py-3 text-sm leading-relaxed
              ${msg.role === 'user'
                ? 'bg-gradient-to-br from-[#1e1b4b] to-[#312e81] text-[#e0e7ff] border border-[#4338ca33] rounded-tr-sm'
                : 'bg-[#0f172a] text-[#e2e8f0] border border-[#1e293b] rounded-tl-sm'
              }`}
            >
              {msg.role === 'assistant'
                ? <ReactMarkdown className="prose prose-invert prose-sm max-w-none">{msg.content}</ReactMarkdown>
                : msg.content
              }
            </div>

            {/* Sources toggle */}
            {msg.role === 'assistant' && msg.sources?.length > 0 && (
              <div className="mt-1.5 px-1">
                <button
                  onClick={() => toggleSources(i)}
                  className="flex items-center gap-1 font-mono text-[10px] text-[#475569] hover:text-[#7c6aff] transition-colors"
                >
                  <ChevronDown size={10} className={`transition-transform ${showSources[i] ? 'rotate-180' : ''}`} />
                  {showSources[i] ? 'Hide' : 'Show'} sources ({msg.sources.length})
                </button>
                {showSources[i] && (
                  <div className="mt-2 flex flex-col gap-1.5">
                    {msg.sources.map((s, j) => (
                      <div key={j} className="font-mono text-[11px] text-[#64748b] bg-[#0f172a] border border-[#1e293b] rounded-lg px-3 py-2 leading-relaxed max-w-sm">
                        📎 {s}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}

        {/* Typing indicator */}
        {loading && (
          <div className="fade-up flex flex-col items-start gap-1">
            <span className="font-mono text-[10px] uppercase tracking-widest text-[#334155] mb-1 px-1">Claude</span>
            <div className="bg-[#0f172a] border border-[#1e293b] rounded-2xl rounded-tl-sm px-5 py-4">
              <div className="flex gap-1.5 items-center">
                <span className="dot w-2 h-2 rounded-full bg-[#7c6aff] block" />
                <span className="dot w-2 h-2 rounded-full bg-[#7c6aff] block" />
                <span className="dot w-2 h-2 rounded-full bg-[#7c6aff] block" />
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Error */}
      {error && (
        <p className="mx-6 mb-2 font-mono text-xs text-red-400 bg-red-900/20 border border-red-900 px-4 py-2 rounded-lg">
          ⚠ {error}
        </p>
      )}

      {/* Input */}
      <div className="px-6 pb-6 pt-2">
        <div className={`flex items-end gap-3 bg-[#111118] border rounded-2xl px-4 py-3 transition-colors
          ${loading ? 'border-[#1e293b]' : 'border-[#2e2e3a] focus-within:border-[#7c6aff]'}`}
        >
          <textarea
            ref={inputRef}
            rows={1}
            value={input}
            onChange={e => {
              setInput(e.target.value)
              e.target.style.height = 'auto'
              e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px'
            }}
            onKeyDown={onKey}
            disabled={loading}
            placeholder="Ask a question about your PDF…"
            className="flex-1 bg-transparent text-sm text-[#e2e8f0] placeholder-[#334155] resize-none outline-none font-sans leading-relaxed"
            style={{ maxHeight: 120 }}
          />
          <button
            onClick={send}
            disabled={loading || !input.trim()}
            className="shrink-0 w-8 h-8 rounded-xl bg-gradient-to-br from-[#7c6aff] to-[#c084fc]
                       flex items-center justify-center text-white transition-opacity
                       disabled:opacity-30 disabled:cursor-not-allowed hover:opacity-90"
          >
            <Send size={14} />
          </button>
        </div>
        <p className="font-mono text-[10px] text-[#1e293b] text-center mt-2">
          Enter to send · Shift+Enter for new line
        </p>
      </div>
    </div>
  )
}
